"""
Alarm Log & Metrics API endpoints for NOC section.
Register these in servidor_academia.py BEFORE the SPA catch-all.
"""
import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter(prefix="/api/noc/alarms", tags=["alarms"])


def _get_db():
    from alarm_ingestion import get_db
    return get_db()


def _rows_to_dicts(cursor, rows):
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, r)) for r in rows]


@router.get("/events")
def get_alarm_events(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    city: Optional[str] = None,
    host_id: Optional[str] = None,
    alarm_type: Optional[str] = None,
    severity: Optional[str] = None,
    event_type: Optional[str] = None,
    limit: int = Query(default=500, le=5000),
    offset: int = 0,
):
    db = _get_db()
    if not start_date:
        start_date = (datetime.now(timezone.utc) - timedelta(hours=24)).strftime("%Y-%m-%dT%H:%M:%SZ")
    if not end_date:
        end_date = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    where = ["event_time >= ?", "event_time <= ?"]
    params = [start_date, end_date]

    if city:
        where.append("city = ?"); params.append(city)
    if host_id:
        where.append("host_id = ?"); params.append(host_id)
    if alarm_type:
        where.append("alarm_type = ?"); params.append(alarm_type)
    if severity:
        where.append("perceived_severity = ?"); params.append(severity)
    if event_type:
        where.append("event_type = ?"); params.append(event_type)

    where_sql = " AND ".join(where)

    count = db.execute(f"SELECT COUNT(*) FROM alarm_events WHERE {where_sql}", params).fetchone()[0]
    cur = db.execute(
        f"SELECT * FROM alarm_events WHERE {where_sql} ORDER BY event_time DESC LIMIT ? OFFSET ?",
        params + [limit, offset])
    events = _rows_to_dicts(cur, cur.fetchall())

    return {"total": count, "events": events, "limit": limit, "offset": offset}


@router.get("/events/{event_id}")
def get_alarm_event(event_id: str):
    db = _get_db()
    cur = db.execute("SELECT * FROM alarm_events WHERE event_id = ?", (event_id,))
    row = cur.fetchone()
    if not row:
        return {"error": "Not found"}
    cols = [d[0] for d in cur.description]
    return dict(zip(cols, row))


@router.get("/active")
def get_active_alarms(
    city: Optional[str] = None,
    severity: Optional[str] = None,
):
    db = _get_db()
    where = ["1=1"]
    params = []
    if city:
        where.append("city = ?"); params.append(city)
    if severity:
        where.append("perceived_severity = ?"); params.append(severity)

    where_sql = " AND ".join(where)
    cur = db.execute(
        f"SELECT * FROM alarm_active WHERE {where_sql} ORDER BY raised_at DESC", params)
    alarms = _rows_to_dicts(cur, cur.fetchall())
    return {"total": len(alarms), "alarms": alarms}


@router.post("/active/{correlation_id}/acknowledge")
def acknowledge_alarm(correlation_id: str, operator: str = "admin", notes: str = ""):
    db = _get_db()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    db.execute(
        "UPDATE alarm_active SET acknowledged_at = ?, acknowledged_by = ?, notes = ? WHERE correlation_id = ?",
        (now, operator, notes, correlation_id))
    db.commit()
    return {"ok": True, "correlation_id": correlation_id}


@router.get("/summary")
def get_alarm_summary(hours: int = 24):
    db = _get_db()
    since = (datetime.now(timezone.utc) - timedelta(hours=hours)).strftime("%Y-%m-%dT%H:%M:%SZ")

    total = db.execute("SELECT COUNT(*) FROM alarm_events WHERE event_time >= ?", (since,)).fetchone()[0]
    raises = db.execute("SELECT COUNT(*) FROM alarm_events WHERE event_time >= ? AND event_type = 'raise'", (since,)).fetchone()[0]
    clears = db.execute("SELECT COUNT(*) FROM alarm_events WHERE event_time >= ? AND event_type = 'clear'", (since,)).fetchone()[0]
    active = db.execute("SELECT COUNT(*) FROM alarm_active").fetchone()[0]

    by_severity = {}
    for row in db.execute("SELECT perceived_severity, COUNT(*) FROM alarm_events WHERE event_time >= ? GROUP BY perceived_severity", (since,)).fetchall():
        by_severity[row[0]] = row[1]

    by_type = {}
    for row in db.execute("SELECT raw_alert_type, COUNT(*) FROM alarm_events WHERE event_time >= ? GROUP BY raw_alert_type", (since,)).fetchall():
        by_type[row[0]] = row[1]

    by_city = {}
    for row in db.execute("SELECT city, COUNT(*) FROM alarm_events WHERE event_time >= ? GROUP BY city ORDER BY COUNT(*) DESC LIMIT 10", (since,)).fetchall():
        by_city[row[0]] = row[1]

    top_offenders = []
    for row in db.execute("""
        SELECT host_name, host_ip, city, COUNT(*) as alarm_count
        FROM alarm_events WHERE event_time >= ? AND event_type = 'raise'
        GROUP BY host_id ORDER BY alarm_count DESC LIMIT 10
    """, (since,)).fetchall():
        top_offenders.append({"host": row[0], "ip": row[1], "city": row[2], "count": row[3]})

    return {
        "period_hours": hours,
        "total_events": total,
        "raises": raises,
        "clears": clears,
        "active_alarms": active,
        "by_severity": by_severity,
        "by_type": by_type,
        "by_city": by_city,
        "top_offenders": top_offenders,
    }


@router.get("/mttr")
def get_mttr(city: Optional[str] = None, days: int = 7):
    db = _get_db()
    since = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")

    where_extra = "AND e1.city = ?" if city else ""
    params = [since] + ([city] if city else [])

    rows = db.execute(f"""
        SELECT e1.host_name, e1.city, e1.event_time as raised_at, e2.event_time as cleared_at,
            CAST((julianday(e2.event_time) - julianday(e1.event_time)) * 24 * 60 AS REAL) as mttr_minutes
        FROM alarm_events e1
        JOIN alarm_events e2 ON e1.correlation_id = e2.correlation_id AND e2.event_type = 'clear'
        WHERE e1.event_type = 'raise' AND e1.event_time >= ? {where_extra}
        ORDER BY mttr_minutes DESC
    """, params).fetchall()

    if not rows:
        return {"mttr_avg_minutes": 0, "mttr_max_minutes": 0, "sample_count": 0, "details": []}

    mttrs = [r[4] for r in rows if r[4] is not None and r[4] > 0]
    avg = sum(mttrs) / len(mttrs) if mttrs else 0

    details = [{"host": r[0], "city": r[1], "raised": r[2], "cleared": r[3], "mttr_min": round(r[4] or 0, 1)} for r in rows[:20]]

    return {
        "period_days": days,
        "mttr_avg_minutes": round(avg, 1),
        "mttr_max_minutes": round(max(mttrs) if mttrs else 0, 1),
        "sample_count": len(mttrs),
        "details": details,
    }


@router.get("/availability")
def get_availability(days: int = 7):
    db = _get_db()
    since = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")

    total_snapshots = db.execute(
        "SELECT host_id, COUNT(*) as total, SUM(CASE WHEN status='online' THEN 1 ELSE 0 END) as online_count FROM host_snapshots WHERE snapshot_time >= ? GROUP BY host_id",
        (since,)).fetchall()

    hosts = []
    for row in total_snapshots:
        pct = (row[2] / row[1] * 100) if row[1] > 0 else 0
        hosts.append({"host_id": row[0], "total_snapshots": row[1], "online": row[2], "availability_pct": round(pct, 2)})

    global_total = sum(h["total_snapshots"] for h in hosts)
    global_online = sum(h["online"] for h in hosts)
    global_pct = (global_online / global_total * 100) if global_total > 0 else 0

    return {
        "period_days": days,
        "global_availability_pct": round(global_pct, 2),
        "hosts": sorted(hosts, key=lambda x: x["availability_pct"]),
    }


@router.get("/status")
def alarm_system_status():
    from alarm_ingestion import get_poller
    p = get_poller()
    return {
        "status": "running" if p._running else "stopped",
        "poll_count": p.poll_count,
        "tracked_hosts": len(p.prev_states),
        "active_alarms": p.conn.execute("SELECT COUNT(*) FROM alarm_active").fetchone()[0],
        "total_events": p.conn.execute("SELECT COUNT(*) FROM alarm_events").fetchone()[0],
        "total_snapshots": p.conn.execute("SELECT COUNT(*) FROM host_snapshots").fetchone()[0],
    }
