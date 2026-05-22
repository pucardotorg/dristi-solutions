"""
Script to process orders by order number.

Flow for each orderNumber:
  1. Fetch current ES document (before snapshot)
  2. Search the order via POST order/v1/search
  3. Forward each result to POST transformer/v1/script
  4. Wait for the indexer to propagate changes
  5. Fetch updated ES document (after snapshot)
  6. Diff before vs after and append a trace entry to the trace file
  7. Optionally write separate before/after JSONL files
"""

import argparse
import json
import logging
import sys
import time
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

import requests

# ---------------------------------------------------------------------------
# Configuration – override via CLI args or edit defaults below
# ---------------------------------------------------------------------------

DEFAULT_ORDER_HOST = "http://localhost:8085"
DEFAULT_TRANSFORMER_HOST = "http://localhost:8094"
DEFAULT_ES_HOST = "http://localhost:9200"
DEFAULT_TENANT_ID = "kl"

ORDER_SEARCH_PATH = "/order/v1/search"
TRANSFORMER_SCRIPT_PATH = "/transformer/v1/script"

ES_INDEX = "order-notification-view"
ES_ID_FIELD = "Data.orderNotification.id.keyword"

DEFAULT_ES_WAIT_SECONDS = 5
DEFAULT_TRACE_FILE = "order_migration_trace.jsonl"
DEFAULT_BEFORE_FILE = "order_migration_before.jsonl"
DEFAULT_AFTER_FILE = "order_migration_after.jsonl"

REQUEST_INFO = {
    "apiId": "Rainmaker",
    "authToken": "",
    "userInfo": {
        "id": 1,
        "userName": "SYSTEM",
        "name": "System",
        "type": "SYSTEM",
        "mobileNumber": "",
        "emailId": "",
        "roles": [
            {
                "id": 281,
                "name": "System user",
                "code": "SYSTEM",
                "tenantId": DEFAULT_TENANT_ID,
            }
        ],
        "tenantId": DEFAULT_TENANT_ID,
        "uuid": "40dceade-992d-4a8f-8243-19dda76a4171",
    },
    "msgId": "1685526824879|en_IN",
    "plainAccessRequest": {},
}

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Elasticsearch helpers
# ---------------------------------------------------------------------------


def fetch_es_document(
    es_host: str,
    order_number: str,
    es_user: str = "",
    es_password: str = "",
) -> dict[str, Any] | None:
    """
    Query order-notification-view for the given orderNumber.
    Returns the raw ES hit _source, or None if not found.
    """
    url = f"{es_host}/{ES_INDEX}/_search"
    payload = {
        "query": {
            "term": {
                ES_ID_FIELD: {"value": order_number}
            }
        }
    }

    kwargs: dict[str, Any] = {"json": payload, "timeout": 30}
    if es_user and es_password:
        kwargs["auth"] = (es_user, es_password)

    log.info("ES fetch [%s]: orderNumber=%s", url, order_number)
    try:
        response = requests.post(url, **kwargs)
    except requests.exceptions.ConnectionError as exc:
        log.error("ES connection error: %s", exc)
        return None

    if response.status_code != 200:
        log.error("ES query failed  status=%s  body=%s", response.status_code, response.text)
        return None

    data = response.json()
    hits = data.get("hits", {}).get("hits", [])
    if not hits:
        log.warning("ES: no document found for orderNumber=%s", order_number)
        return None

    if len(hits) > 1:
        log.warning("ES: %d hits for orderNumber=%s, using first", len(hits), order_number)

    return hits[0].get("_source")


# ---------------------------------------------------------------------------
# Diff helper
# ---------------------------------------------------------------------------


def _flatten(obj: Any, prefix: str = "") -> dict[str, Any]:
    """Recursively flatten a nested dict/list into dot-notation keys."""
    items: dict[str, Any] = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            full_key = f"{prefix}.{k}" if prefix else k
            items.update(_flatten(v, full_key))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            full_key = f"{prefix}[{i}]"
            items.update(_flatten(v, full_key))
    else:
        items[prefix] = obj
    return items


def diff_documents(
    before: dict[str, Any] | None,
    after: dict[str, Any] | None,
) -> list[dict[str, Any]]:
    """
    Return a list of change records:
      { "field": <dot-path>, "before": <old>, "after": <new> }
    Also reports fields added or removed.
    """
    flat_before = _flatten(before) if before else {}
    flat_after = _flatten(after) if after else {}

    all_keys = set(flat_before) | set(flat_after)
    changes: list[dict[str, Any]] = []

    for key in sorted(all_keys):
        old_val = flat_before.get(key, "<MISSING>")
        new_val = flat_after.get(key, "<MISSING>")
        if old_val != new_val:
            changes.append({"field": key, "before": old_val, "after": new_val})

    return changes


# ---------------------------------------------------------------------------
# Order service helpers
# ---------------------------------------------------------------------------


def search_order(order_host: str, tenant_id: str, order_number: str) -> list[dict[str, Any]]:
    """Call order/v1/search and return the list of matching Order objects."""
    url = f"{order_host}{ORDER_SEARCH_PATH}"
    payload = {
        "RequestInfo": REQUEST_INFO,
        "criteria": {
            "tenantId": tenant_id,
            "orderNumber": order_number,
        },
        "pagination": {
            "limit": 100,
            "offSet": 0,
        },
    }

    log.info("Order search: orderNumber=%s  url=%s", order_number, url)
    response = requests.post(url, json=payload, timeout=30)

    if response.status_code != 200:
        log.error(
            "order/v1/search failed for orderNumber=%s  status=%s  body=%s",
            order_number,
            response.status_code,
            response.text,
        )
        return []

    data = response.json()
    orders: list[dict[str, Any]] = data.get("list", [])
    log.info("Found %d order(s) for orderNumber=%s", len(orders), order_number)
    return orders


def call_script(transformer_host: str, order: dict[str, Any]) -> bool:
    """Forward a single Order to the transformer /v1/script endpoint."""
    url = f"{transformer_host}{TRANSFORMER_SCRIPT_PATH}"
    payload = {
        "RequestInfo": REQUEST_INFO,
        "order": order,
    }

    order_number = order.get("orderNumber", "<unknown>")
    log.info("Calling /v1/script: orderNumber=%s  url=%s", order_number, url)
    response = requests.post(url, json=payload, timeout=60)

    if response.status_code == 200:
        log.info("/v1/script success: orderNumber=%s", order_number)
        return True

    log.error(
        "/v1/script failed: orderNumber=%s  status=%s  body=%s",
        order_number,
        response.status_code,
        response.text,
    )
    return False


# ---------------------------------------------------------------------------
# Trace file helpers
# ---------------------------------------------------------------------------


def _append_jsonl(file_path: str, record: Any) -> None:
    with open(file_path, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(record, default=str) + "\n")


def write_trace(
    trace_file: str,
    before_file: str | None,
    after_file: str | None,
    order_number: str,
    before: dict[str, Any] | None,
    after: dict[str, Any] | None,
    script_success: bool,
) -> None:
    changes = diff_documents(before, after)
    timestamp = datetime.now(timezone.utc).isoformat()

    trace_record = {
        "timestamp": timestamp,
        "orderNumber": order_number,
        "scriptSuccess": script_success,
        "esDocumentFound": {
            "before": before is not None,
            "after": after is not None,
        },
        "changedFieldCount": len(changes),
        "diff": changes,
    }

    _append_jsonl(trace_file, trace_record)
    log.info(
        "Trace written: orderNumber=%s  changed_fields=%d  file=%s",
        order_number,
        len(changes),
        trace_file,
    )

    if before_file:
        _append_jsonl(before_file, {"timestamp": timestamp, "orderNumber": order_number, "snapshot": before})
    if after_file:
        _append_jsonl(after_file, {"timestamp": timestamp, "orderNumber": order_number, "snapshot": after})

    if changes:
        log.info("Changes for orderNumber=%s:", order_number)
        for change in changes:
            log.info("  %-60s  %s  ->  %s", change["field"], change["before"], change["after"])
    else:
        log.info("No changes detected in ES for orderNumber=%s", order_number)


# ---------------------------------------------------------------------------
# Main processing
# ---------------------------------------------------------------------------


def process_order_numbers(
    order_numbers: list[str],
    order_host: str,
    transformer_host: str,
    es_host: str,
    es_user: str,
    es_password: str,
    tenant_id: str,
    es_wait: int,
    trace_file: str,
    before_file: str | None,
    after_file: str | None,
    dry_run: bool = False,
) -> None:
    total = len(order_numbers)

    for idx, order_number in enumerate(order_numbers, start=1):
        order_number = order_number.strip()
        if not order_number:
            continue

        log.info("--- [%d/%d] orderNumber=%s ---", idx, total, order_number)

        # --- Step 1: fetch before snapshot ---
        before = fetch_es_document(es_host, order_number, es_user, es_password)

        # --- Step 2: fetch order from order service ---
        orders = search_order(order_host, tenant_id, order_number)
        if not orders:
            log.warning("No orders found for orderNumber=%s – skipping", order_number)
            write_trace(trace_file, before_file, after_file, order_number, before, None, False)
            continue

        # --- Step 3: call /v1/script for each returned order ---
        script_success = False
        for order in orders:
            if dry_run:
                log.info("[DRY-RUN] Would POST /v1/script: %s", json.dumps(order, indent=2))
                script_success = True
            else:
                ok = call_script(transformer_host, order)
                if ok:
                    script_success = True

        # --- Step 4: wait for indexer ---
        if not dry_run and script_success:
            log.info("Waiting %ds for indexer to propagate…", es_wait)
            time.sleep(es_wait)

        # --- Step 5: fetch after snapshot ---
        after = fetch_es_document(es_host, order_number, es_user, es_password) if not dry_run else None

        # --- Step 6: write trace ---
        write_trace(trace_file, before_file, after_file, order_number, before, after, script_success)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Search orders by orderNumber, call transformer /v1/script, "
            "and record before/after ES snapshots with a diff."
        )
    )

    # Input
    parser.add_argument(
        "order_numbers",
        nargs="*",
        help="Order numbers to process (space-separated). Use --file for bulk input.",
    )
    parser.add_argument("--file", "-f", help="Text file with one orderNumber per line.")

    # Service hosts
    parser.add_argument("--order-host", default=DEFAULT_ORDER_HOST,
                        help=f"Order service base URL (default: {DEFAULT_ORDER_HOST})")
    parser.add_argument("--transformer-host", default=DEFAULT_TRANSFORMER_HOST,
                        help=f"Transformer service base URL (default: {DEFAULT_TRANSFORMER_HOST})")
    parser.add_argument("--es-host", default=DEFAULT_ES_HOST,
                        help=f"Elasticsearch base URL (default: {DEFAULT_ES_HOST})")

    # Auth
    parser.add_argument("--auth-token", default="", help="Auth token for RequestInfo")
    parser.add_argument("--es-user", default="elastic", help="ES username (default: elastic)")
    parser.add_argument("--es-password", default="", help="ES password")

    # Tenant
    parser.add_argument("--tenant-id", default=DEFAULT_TENANT_ID,
                        help=f"Tenant ID (default: {DEFAULT_TENANT_ID})")

    # ES wait
    parser.add_argument("--es-wait", type=int, default=DEFAULT_ES_WAIT_SECONDS,
                        help=f"Seconds to wait after /v1/script before fetching after-snapshot (default: {DEFAULT_ES_WAIT_SECONDS})")

    # Output files
    parser.add_argument("--trace-file", default=DEFAULT_TRACE_FILE,
                        help=f"Append-only JSONL trace file (default: {DEFAULT_TRACE_FILE})")
    parser.add_argument("--before-file", default=DEFAULT_BEFORE_FILE,
                        help=f"Append-only JSONL file for before snapshots (default: {DEFAULT_BEFORE_FILE}). Pass empty string to disable.")
    parser.add_argument("--after-file", default=DEFAULT_AFTER_FILE,
                        help=f"Append-only JSONL file for after snapshots (default: {DEFAULT_AFTER_FILE}). Pass empty string to disable.")

    # Behaviour
    parser.add_argument("--dry-run", action="store_true",
                        help="Search + fetch ES before, but do NOT call /v1/script or fetch ES after")

    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    REQUEST_INFO["authToken"] = args.auth_token

    order_numbers: list[str] = list(args.order_numbers)

    if args.file:
        try:
            with open(args.file, encoding="utf-8") as fh:
                file_numbers = [line.strip() for line in fh if line.strip()]
            log.info("Loaded %d order numbers from %s", len(file_numbers), args.file)
            order_numbers.extend(file_numbers)
        except FileNotFoundError:
            log.error("File not found: %s", args.file)
            sys.exit(1)

    if not order_numbers:
        log.error("No order numbers provided. Pass them as positional args or use --file.")
        sys.exit(1)

    process_order_numbers(
        order_numbers=order_numbers,
        order_host=args.order_host.rstrip("/"),
        transformer_host=args.transformer_host.rstrip("/"),
        es_host=args.es_host.rstrip("/"),
        es_user=args.es_user,
        es_password=args.es_password,
        tenant_id=args.tenant_id,
        es_wait=args.es_wait,
        trace_file=args.trace_file,
        before_file=args.before_file or None,
        after_file=args.after_file or None,
        dry_run=args.dry_run,
    )
