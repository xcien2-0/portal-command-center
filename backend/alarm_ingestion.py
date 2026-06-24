"""
Alarm Ingestion Engine for NOCBoard Energia.
Polls NOCBoard API, detects state transitions, persists to SQLite.
ITU-T X.733 compliant alarm model.
"""
import sqlite3
import threading
import time
import uuid
import json
import logging
import os
import requests
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field
from typing import Dict, List, Optional
from collections import defaultdict

logger = logging.getLogger("XCIEN-ALARM-INGESTION")

POLL_INTERVAL = 30
API_URL = "http://localhost:9404/api"
API_KEY = "f4f5ef40c4c54aeca1d6a66109e4555d"
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "db", "alarm_log.db")
HOSTS_FALLBACK = os.path.expanduser("~/Library/Application Support/NOCBoardEnergia/hosts.json")

CASCADE_WINDOW = 120
CASCADE_THRESHOLD = 5

ALARM_TYPE_MAP = {
    "hostOffline":         ("communicationsAlarm",  "communicationsSubsystemFailure", "critical"),
    "hostRecovered":       ("communicationsAlarm",  "communicationsSubsystemFailure", "cleared"),
    "highLatency":         ("qualityOfServiceAlarm","responseTimeExcessive",          "warning"),
    "mainsOutage":         ("environmentalAlarm",   "powerProblem",                   "major"),
    "siteOnBatteryBackup": ("environmentalAlarm",   "powerProblem",                   "major"),
    "batteryVoltageLow":   ("equipmentAlarm",       "batteryChargingFailure",         "major"),
    "batterySOCLow":       ("equipmentAlarm",       "batteryChargingFailure",         "critical"),
    "siteCritical":        ("equipmentAlarm",       "equipmentMalfunction",           "critical"),
}

SEVERITY_ORDER = {"critical": 5, "major": 4, "minor": 3, "warning": 2, "indeterminate": 1, "cleared": 0}

SCHEMA = """
CREATE TABLE IF NOT EXISTS alarm_events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id        TEXT NOT NULL UNIQUE,
    host_id         TEXT NOT NULL,
    host_ip         TEXT NOT NULL,
    host_name       TEXT NOT NULL,
    city            TEXT NOT NULL,
    site            TEXT NOT NULL DEFAULT '',
    vendor          TEXT NOT NULL DEFAULT '',
    device_type     TEXT NOT NULL DEFAULT '',
    alarm_type      TEXT NOT NULL,
    perceived_severity TEXT NOT NULL DEFAULT 'warning',
    probable_cause  TEXT NOT NULL DEFAULT '',
    specific_problem TEXT NOT NULL DEFAULT '',
    event_type      TEXT NOT NULL,
    correlation_id  TEXT,
    event_time      TEXT NOT NULL,
    ingested_at     TEXT NOT NULL DEFAULT (datetime('now')),
    raw_alert_type  TEXT NOT NULL DEFAULT '',
    raw_data        TEXT DEFAULT '{}',
    shift_date      TEXT NOT NULL,
    shift_period    TEXT NOT NULL DEFAULT 'day'
);
CREATE INDEX IF NOT EXISTS idx_ae_host ON alarm_events(host_id, event_time);
CREATE INDEX IF NOT EXISTS idx_ae_city ON alarm_events(city, event_time);
CREATE INDEX IF NOT EXISTS idx_ae_type ON alarm_events(alarm_type, event_time);
CREATE INDEX IF NOT EXISTS idx_ae_sev ON alarm_events(perceived_severity, event_time);
CREATE INDEX IF NOT EXISTS idx_ae_corr ON alarm_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_ae_shift ON alarm_events(shift_date, shift_period);

CREATE TABLE IF NOT EXISTS alarm_active (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    correlation_id  TEXT NOT NULL UNIQUE,
    host_id         TEXT NOT NULL,
    host_ip         TEXT NOT NULL,
    host_name       TEXT NOT NULL,
    city            TEXT NOT NULL,
    site            TEXT NOT NULL DEFAULT '',
    vendor          TEXT NOT NULL DEFAULT '',
    device_type     TEXT NOT NULL DEFAULT '',
    alarm_type      TEXT NOT NULL,
    perceived_severity TEXT NOT NULL,
    probable_cause  TEXT NOT NULL DEFAULT '',
    specific_problem TEXT NOT NULL DEFAULT '',
    raw_alert_type  TEXT NOT NULL DEFAULT '',
    raised_at       TEXT NOT NULL,
    last_changed_at TEXT NOT NULL,
    acknowledged_at TEXT,
    acknowledged_by TEXT,
    escalation_level INTEGER NOT NULL DEFAULT 0,
    suppressed      INTEGER NOT NULL DEFAULT 0,
    suppression_reason TEXT DEFAULT '',
    notes           TEXT DEFAULT '',
    ticket_id       TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_aa_host ON alarm_active(host_id);
CREATE INDEX IF NOT EXISTS idx_aa_sev ON alarm_active(perceived_severity);

CREATE TABLE IF NOT EXISTS host_snapshots (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    host_id         TEXT NOT NULL,
    host_ip         TEXT NOT NULL,
    city            TEXT NOT NULL,
    status          TEXT NOT NULL,
    health_score    REAL NOT NULL DEFAULT 0,
    latency_ms      REAL DEFAULT NULL,
    packet_loss_pct REAL DEFAULT NULL,
    battery_voltage REAL DEFAULT NULL,
    mains_present   INTEGER DEFAULT NULL,
    battery_soc     REAL DEFAULT NULL,
    snapshot_time   TEXT NOT NULL DEFAULT (datetime('now')),
    state_changed   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_hs_host ON host_snapshots(host_id, snapshot_time);

CREATE TABLE IF NOT EXISTS cfe_outages (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    outage_id       TEXT NOT NULL UNIQUE,
    city            TEXT NOT NULL,
    site            TEXT NOT NULL DEFAULT '',
    affected_hosts  TEXT NOT NULL DEFAULT '[]',
    started_at      TEXT NOT NULL,
    ended_at        TEXT,
    duration_minutes REAL DEFAULT NULL,
    correlation_id  TEXT
);
CREATE INDEX IF NOT EXISTS idx_cfe_city ON cfe_outages(city, started_at);

CREATE TABLE IF NOT EXISTS metrics_cache (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_key      TEXT NOT NULL UNIQUE,
    metric_type     TEXT NOT NULL,
    scope           TEXT NOT NULL DEFAULT 'global',
    scope_value     TEXT NOT NULL DEFAULT '',
    period          TEXT NOT NULL,
    period_start    TEXT NOT NULL,
    period_end      TEXT NOT NULL,
    value           REAL NOT NULL,
    metadata        TEXT DEFAULT '{}',
    computed_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_mc_type ON metrics_cache(metric_type, scope, period_start);
"""


@dataclass
class HostState:
    status: str
    alerts: frozenset
    health: float
    mains: Optional[bool]
    bat_v: Optional[float]
    bat_soc: Optional[float]
    latency: float


def _now_utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _shift_info(dt: Optional[datetime] = None) -> tuple:
    dt = dt or datetime.now(timezone.utc)
    hour = (dt - timedelta(hours=6)).hour
    period = "day" if 8 <= hour < 20 else "night"
    return dt.strftime("%Y-%m-%d"), period


def init_db(db_path: str = DB_PATH) -> sqlite3.Connection:
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.executescript(SCHEMA)
    conn.commit()
    return conn


def derive_state(host: dict) -> HostState:
    ping = host.get("ping", host.get("lastPingResult", {}))
    metrics = host.get("_api_metrics", host.get("latestMetrics", {}))
    status = host.get("status", "unknown")
    alerts = []
    mains = metrics.get("mains_present", metrics.get("mainsPresent"))
    if mains is not None and not mains:
        alerts.append("mainsOutage")
    mv = metrics.get("mains_voltage", metrics.get("mainsVoltage"))
    if mv is not None and mv == 0:
        alerts.append("mainsOutage")
    bv = metrics.get("battery_voltage", metrics.get("batteryVoltage"))
    if bv is not None and isinstance(bv, (int, float)) and bv < 46:
        alerts.append("batteryVoltageLow")
    soc = metrics.get("battery_soc", metrics.get("batterySOC"))
    if soc is not None and isinstance(soc, (int, float)) and soc < 20:
        alerts.append("batterySOCLow")
    lat = ping.get("latency_avg", ping.get("latencyAvg", 0)) or 0
    if lat > 200:
        alerts.append("highLatency")
    return HostState(
        status=status, alerts=frozenset(alerts), health=host.get("health_score", host.get("healthScore", 0)),
        mains=mains, bat_v=bv, bat_soc=soc, latency=lat
    )


def _host_meta(h: dict) -> dict:
    return {
        "host_id": h.get("id", h.get("host_id", "")),
        "host_ip": h.get("ip", ""),
        "host_name": h.get("display_name", h.get("name", h.get("rawName", ""))),
        "city": h.get("city", ""),
        "site": h.get("site", ""),
        "vendor": h.get("power_vendor", h.get("powerVendor", "")),
        "device_type": h.get("power_device_type", h.get("powerDeviceType", "")),
    }


class AlarmPoller:
    def __init__(self, db_path: str = DB_PATH):
        self.conn = init_db(db_path)
        self.prev_states: Dict[str, HostState] = {}
        self.prev_snapshots: Dict[str, str] = {}
        self.pending_raises: List[dict] = []
        self.flap_counters: Dict[str, List[float]] = defaultdict(list)
        self.poll_count = 0
        self._running = False

    def _fetch_hosts(self) -> List[dict]:
        try:
            r = requests.get(f"{API_URL}/hosts", headers={"X-API-Key": API_KEY}, timeout=10)
            if r.ok:
                data = r.json()
                return data.get("hosts", [])
        except Exception:
            pass
        try:
            with open(HOSTS_FALLBACK, "r") as f:
                return json.load(f)
        except Exception:
            return []

    def _emit_event(self, meta: dict, raw_type: str, event_type: str, correlation_id: str, problem: str = "", raw_data: dict = None):
        at, sp = ALARM_TYPE_MAP.get(raw_type, ("processingErrorAlarm", "unknown", "warning"))
        if len(at) == 3:
            alarm_type, probable_cause, severity = at
        else:
            alarm_type, probable_cause, severity = at, sp, "warning"

        now = _now_utc()
        sd, sp_shift = _shift_info()
        eid = str(uuid.uuid4())

        self.conn.execute("""
            INSERT INTO alarm_events (event_id, host_id, host_ip, host_name, city, site, vendor, device_type,
                alarm_type, perceived_severity, probable_cause, specific_problem, event_type, correlation_id,
                event_time, raw_alert_type, raw_data, shift_date, shift_period)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (eid, meta["host_id"], meta["host_ip"], meta["host_name"], meta["city"], meta["site"],
              meta["vendor"], meta["device_type"], alarm_type, severity, probable_cause, problem,
              event_type, correlation_id, now, raw_type, json.dumps(raw_data or {}), sd, sp_shift))

        if event_type == "raise":
            try:
                self.conn.execute("""
                    INSERT OR REPLACE INTO alarm_active (correlation_id, host_id, host_ip, host_name, city, site,
                        vendor, device_type, alarm_type, perceived_severity, probable_cause, specific_problem,
                        raw_alert_type, raised_at, last_changed_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """, (correlation_id, meta["host_id"], meta["host_ip"], meta["host_name"], meta["city"],
                      meta["site"], meta["vendor"], meta["device_type"], alarm_type, severity,
                      probable_cause, problem, raw_type, now, now))
            except Exception as e:
                logger.warning(f"Failed to insert alarm_active: {e}")

        elif event_type == "clear":
            self.conn.execute("DELETE FROM alarm_active WHERE correlation_id = ?", (correlation_id,))

        self.conn.commit()
        logger.info(f"[{event_type.upper()}] {meta['host_name']} | {raw_type} | {severity} | {correlation_id[:8]}")

    def _check_cascade(self, now_ts: float) -> Optional[str]:
        cutoff = now_ts - CASCADE_WINDOW
        self.pending_raises = [e for e in self.pending_raises if e["ts"] > cutoff]
        if len(self.pending_raises) >= CASCADE_THRESHOLD:
            cities = set(e["city"] for e in self.pending_raises)
            cid = f"CASCADE-{int(now_ts)}"
            logger.warning(f"CASCADE detected: {len(self.pending_raises)} hosts across {len(cities)} cities")
            return cid
        return None

    def _check_flap(self, host_id: str, now_ts: float) -> bool:
        flaps = self.flap_counters[host_id]
        flaps.append(now_ts)
        self.flap_counters[host_id] = [t for t in flaps if now_ts - t < 600]
        return len(self.flap_counters[host_id]) >= 6

    def _snapshot(self, host: dict, state: HostState, changed: bool):
        if self.poll_count % 10 != 0 and not changed:
            return
        ping = host.get("ping", host.get("lastPingResult", {}))
        meta = _host_meta(host)
        self.conn.execute("""
            INSERT INTO host_snapshots (host_id, host_ip, city, status, health_score, latency_ms,
                packet_loss_pct, battery_voltage, mains_present, battery_soc, state_changed)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
        """, (meta["host_id"], meta["host_ip"], meta["city"], state.status, state.health,
              state.latency if state.latency else None,
              ping.get("packet_loss", ping.get("packetLoss")),
              state.bat_v, 1 if state.mains else 0 if state.mains is not None else None,
              state.bat_soc, 1 if changed else 0))

    def poll_once(self):
        hosts = self._fetch_hosts()
        if not hosts:
            return
        self.poll_count += 1
        now_ts = time.time()
        transitions = 0

        for h in hosts:
            hid = h.get("id", h.get("host_id", h.get("ip", "")))
            if not hid:
                continue
            meta = _host_meta(h)
            state = derive_state(h)
            prev = self.prev_states.get(hid)

            if prev is None:
                self.prev_states[hid] = state
                self._snapshot(h, state, False)
                continue

            changed = state.status != prev.status or state.alerts != prev.alerts
            self._snapshot(h, state, changed)

            if not changed:
                continue

            transitions += 1

            # Host went offline
            if state.status == "offline" and prev.status != "offline":
                if self._check_flap(hid, now_ts):
                    logger.info(f"FLAP suppressed: {meta['host_name']}")
                    continue
                cid = str(uuid.uuid4())
                self.pending_raises.append({"ts": now_ts, "city": meta["city"], "host_id": hid})
                cascade_id = self._check_cascade(now_ts)
                if cascade_id:
                    cid = cascade_id
                self._emit_event(meta, "hostOffline", "raise", cid,
                                 f"{meta['host_name']} no responde", h)

            # Host came back online
            elif state.status == "online" and prev.status == "offline":
                open_alarm = self.conn.execute(
                    "SELECT correlation_id FROM alarm_active WHERE host_id = ? AND raw_alert_type = 'hostOffline'",
                    (hid,)).fetchone()
                cid = open_alarm[0] if open_alarm else str(uuid.uuid4())
                self._emit_event(meta, "hostRecovered", "clear", cid,
                                 f"{meta['host_name']} recuperado", h)

            # New alerts appeared
            new_alerts = state.alerts - prev.alerts
            for alert_type in new_alerts:
                if alert_type in ("mainsOutage", "batteryVoltageLow", "batterySOCLow", "highLatency"):
                    cid = str(uuid.uuid4())
                    self._emit_event(meta, alert_type, "raise", cid,
                                     f"{meta['host_name']}: {alert_type}", h)

            # Alerts cleared
            cleared = prev.alerts - state.alerts
            for alert_type in cleared:
                open_alarm = self.conn.execute(
                    "SELECT correlation_id FROM alarm_active WHERE host_id = ? AND raw_alert_type = ?",
                    (hid, alert_type)).fetchone()
                cid = open_alarm[0] if open_alarm else str(uuid.uuid4())
                cleared_type = "hostRecovered" if alert_type == "hostOffline" else alert_type
                self._emit_event(meta, cleared_type, "clear", cid,
                                 f"{meta['host_name']}: {alert_type} cleared", h)

            self.prev_states[hid] = state

        if transitions:
            logger.info(f"Poll #{self.poll_count}: {transitions} transitions from {len(hosts)} hosts")

    def run(self):
        self._running = True
        logger.info(f"Alarm poller started (interval={POLL_INTERVAL}s, db={DB_PATH})")
        while self._running:
            try:
                self.poll_once()
            except Exception as e:
                logger.error(f"Poll error: {e}")
            time.sleep(POLL_INTERVAL)

    def stop(self):
        self._running = False

    def start_daemon(self):
        t = threading.Thread(target=self.run, daemon=True, name="alarm-poller")
        t.start()
        return t


# Singleton
_poller: Optional[AlarmPoller] = None


def get_poller() -> AlarmPoller:
    global _poller
    if _poller is None:
        _poller = AlarmPoller()
    return _poller


def start_alarm_ingestion():
    p = get_poller()
    p.start_daemon()
    return p


def get_db() -> sqlite3.Connection:
    return get_poller().conn
