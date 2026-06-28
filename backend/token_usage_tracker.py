"""
token_usage_tracker.py
Módulo de tracking de consumo de tokens AI para XCIEN Portal.
Registra cada llamada a la API, calcula costos estimados y expone endpoints de analytics.
"""

import os
import json
import sqlite3
import threading
from datetime import datetime, timedelta
from typing import Optional

# ─── Costos por 1M tokens (USD) — tarifa pública 2025 ─────────────────────────
MODEL_PRICING: dict[str, dict] = {
    # Claude (Anthropic)
    "claude-sonnet-4-6":         {"input": 3.00,  "output": 15.00, "provider": "claude"},
    "claude-haiku-4-5-20251001": {"input": 0.80,  "output": 4.00,  "provider": "claude"},
    "claude-opus-4-5":           {"input": 15.00, "output": 75.00, "provider": "claude"},
    "claude-sonnet-4-5":         {"input": 3.00,  "output": 15.00, "provider": "claude"},
    # Perplexity
    "llama-3.1-sonar-small-128k-online": {"input": 0.20, "output": 0.20, "provider": "perplexity"},
    "llama-3.1-sonar-large-128k-online": {"input": 1.00, "output": 1.00, "provider": "perplexity"},
    # Ollama (local = gratis)
    "llama3.2":    {"input": 0.00, "output": 0.00, "provider": "ollama"},
    "llama3.2:3b": {"input": 0.00, "output": 0.00, "provider": "ollama"},
    "mistral":     {"input": 0.00, "output": 0.00, "provider": "ollama"},
    # Default fallback
    "_default":    {"input": 3.00, "output": 15.00, "provider": "unknown"},
}

PROVIDER_MONTHLY_BUDGET_USD: dict[str, float] = {
    "claude":      50.00,
    "perplexity":  20.00,
    "litellm":     30.00,
    "ollama":      0.00,
    "antigravity": 50.00,
}

# ─── DB ───────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH  = os.path.join(BASE_DIR, "db", "token_usage.db")
_lock    = threading.Lock()


def _get_conn() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with _lock:
        conn = _get_conn()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS token_usage (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                ts            TEXT    NOT NULL,
                provider      TEXT    NOT NULL,
                model         TEXT    NOT NULL,
                endpoint      TEXT    NOT NULL,
                input_tokens  INTEGER NOT NULL DEFAULT 0,
                output_tokens INTEGER NOT NULL DEFAULT 0,
                cost_usd      REAL    NOT NULL DEFAULT 0.0,
                session_id    TEXT,
                extra         TEXT
            )
        """)
        conn.commit()
        conn.close()


# ─── Core: registrar una llamada ──────────────────────────────────────────────
def log_usage(
    provider: str,
    model: str,
    endpoint: str,
    input_tokens: int,
    output_tokens: int,
    session_id: Optional[str] = None,
    extra: Optional[dict] = None,
):
    pricing = MODEL_PRICING.get(model, MODEL_PRICING["_default"])
    cost_usd = (
        (input_tokens  / 1_000_000) * pricing["input"] +
        (output_tokens / 1_000_000) * pricing["output"]
    )
    ts = datetime.utcnow().isoformat()
    with _lock:
        conn = _get_conn()
        conn.execute(
            """INSERT INTO token_usage
               (ts, provider, model, endpoint, input_tokens, output_tokens, cost_usd, session_id, extra)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (ts, provider, model, endpoint, input_tokens, output_tokens, cost_usd,
             session_id, json.dumps(extra or {}))
        )
        conn.commit()
        conn.close()


# ─── Estimador cuando la API no devuelve usage ────────────────────────────────
def estimate_tokens(text: str) -> int:
    """Aproximación: 1 token ≈ 4 chars en español."""
    return max(1, len(text) // 4)


# ─── Analytics ────────────────────────────────────────────────────────────────
def get_stats(days: int = 30) -> dict:
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()
    with _lock:
        conn = _get_conn()

        # Totales globales
        row = conn.execute("""
            SELECT
                COUNT(*)              AS calls,
                SUM(input_tokens)     AS input_total,
                SUM(output_tokens)    AS output_total,
                SUM(cost_usd)         AS cost_total
            FROM token_usage WHERE ts >= ?
        """, (since,)).fetchone()

        calls        = row["calls"]        or 0
        input_total  = row["input_total"]  or 0
        output_total = row["output_total"] or 0
        cost_total   = row["cost_total"]   or 0.0

        # Por proveedor
        by_provider = []
        rows = conn.execute("""
            SELECT provider,
                   COUNT(*)              AS calls,
                   SUM(input_tokens)     AS input_tokens,
                   SUM(output_tokens)    AS output_tokens,
                   SUM(cost_usd)         AS cost_usd
            FROM token_usage WHERE ts >= ?
            GROUP BY provider ORDER BY cost_usd DESC
        """, (since,)).fetchall()
        for r in rows:
            budget = PROVIDER_MONTHLY_BUDGET_USD.get(r["provider"], 50.0)
            by_provider.append({
                "provider":      r["provider"],
                "calls":         r["calls"],
                "input_tokens":  r["input_tokens"]  or 0,
                "output_tokens": r["output_tokens"] or 0,
                "cost_usd":      round(r["cost_usd"] or 0.0, 4),
                "budget_usd":    budget,
                "pct_budget":    round(min((r["cost_usd"] or 0.0) / budget * 100, 100), 1) if budget > 0 else 0,
            })

        # Por modelo
        by_model = []
        rows = conn.execute("""
            SELECT model, provider,
                   COUNT(*)              AS calls,
                   SUM(input_tokens)     AS input_tokens,
                   SUM(output_tokens)    AS output_tokens,
                   SUM(cost_usd)         AS cost_usd
            FROM token_usage WHERE ts >= ?
            GROUP BY model ORDER BY calls DESC LIMIT 10
        """, (since,)).fetchall()
        for r in rows:
            by_model.append({
                "model":         r["model"],
                "provider":      r["provider"],
                "calls":         r["calls"],
                "input_tokens":  r["input_tokens"]  or 0,
                "output_tokens": r["output_tokens"] or 0,
                "cost_usd":      round(r["cost_usd"] or 0.0, 4),
            })

        # Por endpoint
        by_endpoint = []
        rows = conn.execute("""
            SELECT endpoint,
                   COUNT(*)          AS calls,
                   SUM(cost_usd)     AS cost_usd
            FROM token_usage WHERE ts >= ?
            GROUP BY endpoint ORDER BY calls DESC LIMIT 10
        """, (since,)).fetchall()
        for r in rows:
            by_endpoint.append({
                "endpoint": r["endpoint"],
                "calls":    r["calls"],
                "cost_usd": round(r["cost_usd"] or 0.0, 4),
            })

        # Serie diaria (últimos `days` días)
        daily = []
        rows = conn.execute("""
            SELECT substr(ts,1,10)    AS day,
                   COUNT(*)           AS calls,
                   SUM(input_tokens)  AS input_tokens,
                   SUM(output_tokens) AS output_tokens,
                   SUM(cost_usd)      AS cost_usd
            FROM token_usage WHERE ts >= ?
            GROUP BY day ORDER BY day ASC
        """, (since,)).fetchall()
        for r in rows:
            daily.append({
                "day":           r["day"],
                "calls":         r["calls"],
                "input_tokens":  r["input_tokens"]  or 0,
                "output_tokens": r["output_tokens"] or 0,
                "cost_usd":      round(r["cost_usd"] or 0.0, 4),
            })

        # Últimas 20 llamadas
        recent = []
        rows = conn.execute("""
            SELECT ts, provider, model, endpoint, input_tokens, output_tokens, cost_usd
            FROM token_usage ORDER BY ts DESC LIMIT 20
        """).fetchall()
        for r in rows:
            recent.append(dict(r))

        conn.close()

    return {
        "period_days":  days,
        "calls":        calls,
        "input_tokens": input_total,
        "output_tokens": output_total,
        "total_tokens": input_total + output_total,
        "cost_usd":     round(cost_total, 4),
        "by_provider":  by_provider,
        "by_model":     by_model,
        "by_endpoint":  by_endpoint,
        "daily":        daily,
        "recent":       recent,
    }


# Inicializar la DB al importar el módulo
init_db()
