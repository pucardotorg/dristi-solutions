"""
Bulk re-edit orders that are PENDING_BULK_E-SIGN.

For each orderNumber in scripts/ordernumbers.txt:
  1. POST /order/v1/search                            -> fetch current order
  2. Read new itemText from scripts/texts/{orderNumber}.html
     (if missing: write a starter file and wait for the user to edit it
      in their own editor — no in-terminal vi)
  3. POST /order-management/v1/_updateOrder
        workflow.action = SAVE_DRAFT
        itemText        = new text
     (moves status PENDING_BULK_E-SIGN -> DRAFT_IN_PROGRESS)
  4. GET  /egov-pdf/order?...                         -> generate PDF bytes
  5. POST /filestore/v1/files (multipart)             -> upload PDF, get fileStoreId
  6. POST /order-management/v1/_updateOrder
        workflow.action          = SUBMIT_BULK_E-SIGN
        documents[0].fileStore   = new fileStoreId
  7. Write scripts/results/{orderNumber}.before.json, .after.json, .diff.txt

Services are assumed to be reachable via individual port-forwards on localhost.
"""

import argparse
import difflib
import json
import logging
import sys
import time
from copy import deepcopy
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import requests

# order service (handles /order/v1/search) — in-pod port 9091
DEFAULT_ORDER_HOST = "http://localhost:9091"
# order-management service (handles /order-management/v1/_updateOrder) — in-pod port 8080
DEFAULT_ORDER_MANAGEMENT_HOST = "http://localhost:8080"
DEFAULT_PDF_HOST = "http://localhost:8086"
DEFAULT_FILESTORE_HOST = "http://localhost:8083"
DEFAULT_TENANT_ID = "kl"
DEFAULT_ORDER_FILE = str(Path(__file__).parent / "ordernumbers.txt")
DEFAULT_REQUEST_INFO_FILE = str(Path(__file__).parent / "request_info.json")
REQUEST_INFO_SAMPLE_FILE = str(Path(__file__).parent / "request_info.sample.json")
DEFAULT_TEXT_DIR = str(Path(__file__).parent / "texts")
TEXT_FILE_EXTENSIONS = (".html", ".htm", ".txt")
DEFAULT_RESULTS_DIR = str(Path(__file__).parent / "results")

ORDER_SEARCH_PATH = "/order/v1/search"
ORDER_UPDATE_PATH = "/order-management/v1/_updateOrder"
PDF_ORDER_PATH = "/egov-pdf/order"
FILESTORE_PATH = "/filestore/v1/files"

ORDER_PREVIEW_KEY = "new-order-generic"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)


def build_request_info(template: dict[str, Any]) -> dict[str, Any]:
    """Return a fresh RequestInfo derived from the file-loaded template.
    A new msgId is generated per call; everything else (apiId, authToken,
    userInfo, plainAccessRequest) is copied verbatim."""
    info = deepcopy(template)
    info["msgId"] = f"{int(time.time() * 1000)}|en_IN"
    return info


def load_request_info(path: str) -> dict[str, Any]:
    """Load the full RequestInfo JSON from the given file and validate it.

    Returns the parsed RequestInfo dict.
    Raises FileNotFoundError / ValueError / json.JSONDecodeError with messages
    that explain exactly what to fix.
    """
    p = Path(path).expanduser()
    if not p.exists():
        raise FileNotFoundError(
            f"RequestInfo file not found: {p}\n"
            f"        Create it with the JSON payload you'd send under the "
            f"\"RequestInfo\" key of a working curl request "
            f"(apiId, authToken, userInfo, msgId, plainAccessRequest).\n"
            f"        A template is available at {REQUEST_INFO_SAMPLE_FILE}; "
            f"copy it to {DEFAULT_REQUEST_INFO_FILE} and fill in your "
            f"authToken / userInfo, then re-run."
        )

    with open(p, encoding="utf-8") as fh:
        try:
            data = json.load(fh)
        except json.JSONDecodeError as exc:
            raise json.JSONDecodeError(
                f"{p} is not valid JSON: {exc.msg}", exc.doc, exc.pos
            ) from exc

    if not isinstance(data, dict):
        raise ValueError(
            f"{p} must contain a JSON object, got {type(data).__name__}"
        )

    # Some users may save the full request envelope { "RequestInfo": {...} } —
    # unwrap that for convenience.
    if "RequestInfo" in data and isinstance(data["RequestInfo"], dict):
        data = data["RequestInfo"]

    missing = [k for k in ("authToken", "userInfo") if not data.get(k)]
    if missing:
        raise ValueError(
            f"{p} is missing required field(s): {', '.join(missing)}. "
            f"Make sure authToken and userInfo are both populated."
        )

    user_info = data["userInfo"]
    if not isinstance(user_info, dict):
        raise ValueError(f"{p}: userInfo must be a JSON object")

    # Friendly summary so the user can verify the right actor/token are loaded.
    token = data["authToken"]
    log.info(
        "RequestInfo loaded from %s — apiId=%s authToken=%s...(len=%d) "
        "userInfo.uuid=%s userInfo.userName=%s roles=%d",
        p, data.get("apiId"),
        token[:6] if isinstance(token, str) else "?",
        len(token) if isinstance(token, str) else 0,
        user_info.get("uuid"), user_info.get("userName"),
        len(user_info.get("roles") or []),
    )
    return data


def safe_request(method: str, url: str, **kwargs) -> requests.Response | None:
    """requests wrapper that converts network failures into clear log messages.

    Returns None on any network-level failure; otherwise returns the Response
    (caller still needs to check response.status_code)."""
    try:
        return requests.request(method, url, **kwargs)
    except requests.exceptions.ConnectionError as exc:
        parsed = urlparse(url)
        host = parsed.hostname or url
        port = parsed.port
        hint = ""
        if host in ("localhost", "127.0.0.1") and port:
            hint = (
                f"  Hint: nothing is listening on {host}:{port}. "
                f"Did you run the port-forward for this service?\n"
                f"        e.g. kubectl port-forward svc/<service> {port}:<svc-port>"
            )
        log.error("Cannot connect to %s\n%s", url, hint)
        log.debug("ConnectionError detail: %s", exc)
        return None
    except requests.exceptions.Timeout:
        log.error("Request to %s timed out (timeout=%ss)", url, kwargs.get("timeout"))
        return None
    except requests.exceptions.RequestException as exc:
        log.error("Request to %s failed: %s", url, exc)
        return None


def preflight_check(hosts: dict[str, str]) -> bool:
    """Quick TCP-level check that each configured host is reachable.

    Logs a clear error for each unreachable host. Returns True iff every host
    accepted a connection."""
    import socket
    ok = True
    for label, base_url in hosts.items():
        parsed = urlparse(base_url)
        host = parsed.hostname
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        if not host:
            log.error("[preflight] %s has no host: %s", label, base_url)
            ok = False
            continue
        try:
            with socket.create_connection((host, port), timeout=3):
                log.info("[preflight] %-10s OK   %s", label, base_url)
        except OSError as exc:
            hint = ""
            if host in ("localhost", "127.0.0.1"):
                hint = (
                    f"  -> nothing is listening on {host}:{port}. "
                    f"Start the port-forward for the {label} service."
                )
            log.error("[preflight] %-10s FAIL %s (%s)\n%s", label, base_url, exc, hint)
            ok = False
    return ok


def _json_lines(obj: Any) -> list[str]:
    return json.dumps(
        obj, indent=2, sort_keys=True, ensure_ascii=False, default=str
    ).splitlines(keepends=True)


def write_order_snapshot(results_dir: str, order_number: str, suffix: str,
                         order: dict[str, Any]) -> str:
    """Pretty-print and persist an order snapshot to
    {results_dir}/{order_number}.{suffix}.json. Returns the file path."""
    base = Path(results_dir).expanduser()
    base.mkdir(parents=True, exist_ok=True)
    target = base / f"{order_number}.{suffix}.json"
    with open(target, "w", encoding="utf-8") as fh:
        fh.writelines(_json_lines(order))
        fh.write("\n")
    return str(target)


def write_order_diff(results_dir: str, order_number: str,
                     before: dict[str, Any], after: dict[str, Any]) -> str:
    """Write a unified diff of before vs. after (pretty-printed JSON, sorted
    keys) to {results_dir}/{order_number}.diff.txt. Returns the file path."""
    base = Path(results_dir).expanduser()
    base.mkdir(parents=True, exist_ok=True)
    target = base / f"{order_number}.diff.txt"
    diff_lines = list(difflib.unified_diff(
        _json_lines(before), _json_lines(after),
        fromfile=f"{order_number}.before.json",
        tofile=f"{order_number}.after.json",
        n=3,
    ))
    with open(target, "w", encoding="utf-8") as fh:
        if diff_lines:
            fh.writelines(diff_lines)
        else:
            fh.write("(no changes between before and after)\n")
    return str(target)


def read_prepared_text(text_dir: str, order_number: str) -> tuple[str, str] | None:
    """Look for a pre-prepared itemText file for this orderNumber.

    Searches {text_dir}/{order_number}.html / .htm / .txt in order.
    Returns (file_path, contents) on hit; None if no prepared file exists.
    """
    base = Path(text_dir).expanduser()
    if not base.exists():
        return None
    for ext in TEXT_FILE_EXTENSIONS:
        candidate = base / f"{order_number}{ext}"
        if candidate.exists():
            with open(candidate, encoding="utf-8") as fh:
                return str(candidate), fh.read().rstrip("\n")
    return None


def stub_and_wait_for_edit(text_dir: str, order_number: str,
                           current_item_text: str) -> str | None:
    """When no prepared file exists, write the current itemText as a starter
    file the user can open in their own editor (VS Code, etc.), then wait at
    the terminal until they press Enter. Re-reads the file and returns its
    contents.

    Returns None if the user chooses to skip the order.
    """
    base = Path(text_dir).expanduser()
    base.mkdir(parents=True, exist_ok=True)
    target = base / f"{order_number}.html"
    created = False
    if not target.exists():
        with open(target, "w", encoding="utf-8") as fh:
            fh.write(current_item_text or "")
        created = True

    print()
    print("─" * 70)
    print(f"  Order {order_number} has no prepared text file.")
    if created:
        print(f"  Starter file created with the current itemText:")
    else:
        print(f"  Found an existing file:")
    print(f"    {target}")
    print()
    print(f"  1. Open that file in your editor (VS Code / Sublime / browser).")
    print(f"  2. Edit the HTML and SAVE.")
    print(f"  3. Come back here and press Enter to continue.")
    print(f"     (Type 's' + Enter to skip this order, 'q' + Enter to quit.)")
    print("─" * 70)
    while True:
        try:
            choice = input("Ready? [Enter=continue / s=skip / q=quit]: ").strip().lower()
        except EOFError:
            choice = "q"
        if choice == "s":
            return None
        if choice == "q":
            raise KeyboardInterrupt()
        if choice in ("", "y", "yes"):
            break
        print("  Unknown choice. Press Enter to continue, or type 's' / 'q'.")

    try:
        with open(target, encoding="utf-8") as fh:
            return fh.read().rstrip("\n")
    except OSError as exc:
        log.error("Could not read %s back: %s", target, exc)
        return None


def search_order(order_host: str, tenant_id: str, order_number: str,
                 request_info: dict[str, Any]) -> dict[str, Any] | None:
    url = f"{order_host}{ORDER_SEARCH_PATH}"
    payload = {
        "RequestInfo": request_info,
        "criteria": {"tenantId": tenant_id, "orderNumber": order_number},
        "pagination": {"limit": 10, "offSet": 0},
    }
    log.info("Search order: %s", order_number)
    response = safe_request("POST", url, json=payload, timeout=30)
    if response is None:
        return None
    if response.status_code != 200:
        log.error("Search failed for %s (HTTP %s): %s",
                  order_number, response.status_code, response.text[:500])
        return None
    try:
        orders = response.json().get("list", [])
    except ValueError:
        log.error("Search response for %s was not valid JSON: %s",
                  order_number, response.text[:500])
        return None
    if not orders:
        log.warning("No order found for %s", order_number)
        return None
    if len(orders) > 1:
        log.warning("Multiple orders returned for %s, using first", order_number)
    return orders[0]


def update_order(order_management_host: str, tenant_id: str, order: dict[str, Any],
                 request_info: dict[str, Any]) -> dict[str, Any] | None:
    """Call _updateOrder on the order-management service. Returns the updated
    order from the response, or None on failure."""
    url = f"{order_management_host}{ORDER_UPDATE_PATH}"
    params = {"tenantId": tenant_id, "_": str(int(time.time() * 1000))}
    payload = {"order": order, "RequestInfo": request_info}
    action = order.get("workflow", {}).get("action")
    log.info("Update order %s (action=%s)", order.get("orderNumber"), action)
    response = safe_request("POST", url, params=params, json=payload, timeout=60)
    if response is None:
        return None
    if response.status_code != 200:
        log.error("Update failed for %s (HTTP %s, action=%s): %s",
                  order.get("orderNumber"), response.status_code, action,
                  response.text[:500])
        return None
    try:
        body = response.json()
    except ValueError:
        log.error("Update response for %s was not valid JSON: %s",
                  order.get("orderNumber"), response.text[:500])
        return None
    return body.get("order") or body.get("orders", [None])[0]


def generate_order_pdf(pdf_host: str, tenant_id: str, order: dict[str, Any],
                       request_info: dict[str, Any]) -> bytes | None:
    url = f"{pdf_host}{PDF_ORDER_PATH}"
    params = {
        "tenantId": tenant_id,
        "orderId": order["id"],
        "cnrNumber": order.get("cnrNumber", ""),
        "qrCode": "false",
        "courtId": order.get("courtId", ""),
        "orderPreviewKey": ORDER_PREVIEW_KEY,
    }
    payload = {"RequestInfo": request_info}
    log.info("Generate PDF for %s", order.get("orderNumber"))
    response = safe_request("POST", url, params=params, json=payload, timeout=120)
    if response is None:
        return None
    if response.status_code != 200:
        log.error("PDF generation failed for %s (HTTP %s): %s",
                  order.get("orderNumber"), response.status_code, response.text[:500])
        return None
    if not response.content:
        log.error("PDF generation for %s returned empty body", order.get("orderNumber"))
        return None
    return response.content


def upload_to_filestore(filestore_host: str, tenant_id: str, pdf_bytes: bytes,
                       auth_token: str) -> str | None:
    url = f"{filestore_host}{FILESTORE_PATH}"
    filename = f"{ORDER_PREVIEW_KEY}_{int(time.time() * 1000)}.pdf"
    files = {"file": (filename, pdf_bytes, "application/pdf")}
    data = {"tenantId": tenant_id, "module": "DRISTI"}
    headers = {"auth-token": auth_token}
    log.info("Upload PDF to filestore (%d bytes)", len(pdf_bytes))
    response = safe_request("POST", url, files=files, data=data, headers=headers, timeout=60)
    if response is None:
        return None
    if response.status_code not in (200, 201):
        log.error("Filestore upload failed (HTTP %s): %s",
                  response.status_code, response.text[:500])
        return None
    try:
        body = response.json()
    except ValueError:
        log.error("Filestore response was not valid JSON: %s", response.text[:500])
        return None
    files_list = body.get("files") or []
    if not files_list:
        log.error("Filestore response had no files: %s", body)
        return None
    file_store_id = files_list[0].get("fileStoreId")
    if not file_store_id:
        log.error("Filestore response missing fileStoreId: %s", body)
        return None
    return file_store_id


def process_one(order_number: str, order_host: str, order_management_host: str,
                pdf_host: str, filestore_host: str, tenant_id: str,
                request_info_template: dict[str, Any],
                text_dir: str, require_prepared: bool,
                results_dir: str) -> bool:
    request_info = build_request_info(request_info_template)
    auth_token = request_info["authToken"]

    order = search_order(order_host, tenant_id, order_number, request_info)
    if not order:
        return False

    before_snapshot = deepcopy(order)
    before_path = write_order_snapshot(results_dir, order_number, "before", before_snapshot)
    log.info("Wrote before snapshot: %s", before_path)

    current_item_text = order.get("itemText") or ""

    prepared = read_prepared_text(text_dir, order_number)
    if prepared is not None:
        prepared_path, new_item_text = prepared
        log.info("Using prepared text from %s (%d chars)",
                 prepared_path, len(new_item_text))
    else:
        if require_prepared:
            log.error(
                "No prepared itemText file for %s in %s "
                "(looked for %s). Skipping.",
                order_number, text_dir,
                "/".join(f"{order_number}{ext}" for ext in TEXT_FILE_EXTENSIONS),
            )
            return False
        edited = stub_and_wait_for_edit(text_dir, order_number, current_item_text)
        if edited is None:
            log.warning("Skipped %s at user request", order_number)
            return False
        new_item_text = edited

    if new_item_text == current_item_text:
        log.info("itemText unchanged for %s — continuing anyway", order_number)

    # ---- Step 1: SAVE_DRAFT with new itemText ----
    first_payload = deepcopy(order)
    first_payload["itemText"] = new_item_text
    first_payload["workflow"] = {"action": "SAVE_DRAFT", "documents": [{}]}

    updated = update_order(order_management_host, tenant_id, first_payload, request_info)
    if not updated:
        return False

    # ---- Step 2: regenerate PDF ----
    pdf_bytes = generate_order_pdf(pdf_host, tenant_id, updated, request_info)
    if not pdf_bytes:
        return False

    # ---- Step 3: upload PDF ----
    new_file_store_id = upload_to_filestore(filestore_host, tenant_id, pdf_bytes, auth_token)
    if not new_file_store_id:
        return False
    log.info("New fileStoreId: %s", new_file_store_id)

    # ---- Step 4: final update with new fileStore + SUBMIT_BULK_E-SIGN ----
    final_payload = deepcopy(updated)
    final_payload["itemText"] = new_item_text

    documents = final_payload.get("documents") or []
    unsigned_set = False
    for doc in documents:
        if doc.get("documentType") == "UNSIGNED":
            doc["fileStore"] = new_file_store_id
            unsigned_set = True
            break
    if not unsigned_set:
        if documents:
            documents[0]["fileStore"] = new_file_store_id
        else:
            final_payload["documents"] = [{
                "documentType": "UNSIGNED",
                "fileStore": new_file_store_id,
                "isActive": True,
                "additionalDetails": {"name": "Order.pdf"},
            }]

    final_payload["workflow"] = {"action": "SUBMIT_BULK_E-SIGN", "documents": [{}]}

    final = update_order(order_management_host, tenant_id, final_payload, request_info)
    if not final:
        return False

    # Re-fetch via /order/v1/search so the "after" snapshot reflects the
    # persisted state (audit fields, server-side derived data, etc.) and the
    # diff is apples-to-apples with the "before" snapshot (which also came
    # from search).
    after_snapshot = search_order(order_host, tenant_id, order_number, request_info)
    if after_snapshot is None:
        log.warning(
            "Final update succeeded for %s but re-fetch via search failed; "
            "falling back to the update response for the after snapshot.",
            order_number,
        )
        after_snapshot = final

    after_path = write_order_snapshot(results_dir, order_number, "after", after_snapshot)
    diff_path = write_order_diff(results_dir, order_number, before_snapshot, after_snapshot)
    log.info("Wrote after snapshot: %s", after_path)
    log.info("Wrote diff:           %s", diff_path)

    log.info("Done %s — final status=%s", order_number, after_snapshot.get("status"))
    return True


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", "-f", default=DEFAULT_ORDER_FILE,
                        help=f"File with one orderNumber per line (default: {DEFAULT_ORDER_FILE})")
    parser.add_argument("--order-host", default=DEFAULT_ORDER_HOST,
                        help=f"order service base URL — handles /order/v1/search "
                             f"(default: {DEFAULT_ORDER_HOST}; in-pod port 9091)")
    parser.add_argument("--order-management-host", default=DEFAULT_ORDER_MANAGEMENT_HOST,
                        help=f"order-management service base URL — handles "
                             f"/order-management/v1/_updateOrder "
                             f"(default: {DEFAULT_ORDER_MANAGEMENT_HOST}; in-pod port 8080)")
    parser.add_argument("--pdf-host", default=DEFAULT_PDF_HOST,
                        help=f"egov-pdf base URL (default: {DEFAULT_PDF_HOST})")
    parser.add_argument("--filestore-host", default=DEFAULT_FILESTORE_HOST,
                        help=f"filestore base URL (default: {DEFAULT_FILESTORE_HOST})")
    parser.add_argument("--tenant-id", default=DEFAULT_TENANT_ID)
    parser.add_argument(
        "--request-info-file",
        default=DEFAULT_REQUEST_INFO_FILE,
        help=f"Path to a JSON file containing the full RequestInfo "
             f"(apiId, authToken, userInfo, msgId, plainAccessRequest). "
             f"Default: {DEFAULT_REQUEST_INFO_FILE}. A template lives at "
             f"{REQUEST_INFO_SAMPLE_FILE}.",
    )
    parser.add_argument(
        "--text-dir",
        default=DEFAULT_TEXT_DIR,
        help=f"Directory of pre-prepared itemText files. For each order, the "
             f"script looks for {{orderNumber}}.html (also .htm, .txt) here "
             f"and uses its contents as the new itemText. "
             f"Default: {DEFAULT_TEXT_DIR}",
    )
    parser.add_argument(
        "--require-prepared",
        action="store_true",
        help="Fail (skip the order) when no prepared text file exists for "
             "an orderNumber, instead of writing a starter file and pausing "
             "for you to edit it.",
    )
    parser.add_argument(
        "--results-dir",
        default=DEFAULT_RESULTS_DIR,
        help=f"Directory to write per-order snapshots and diffs into: "
             f"{{orderNumber}}.before.json, .after.json, .diff.txt. "
             f"Default: {DEFAULT_RESULTS_DIR}",
    )
    parser.add_argument(
        "--skip-preflight",
        action="store_true",
        help="Skip the up-front connectivity check on each host.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    try:
        with open(args.file, encoding="utf-8") as fh:
            order_numbers = [line.strip() for line in fh if line.strip()]
    except FileNotFoundError:
        log.error("Order numbers file not found: %s", args.file)
        sys.exit(1)

    if not order_numbers:
        log.error("No order numbers in %s", args.file)
        sys.exit(1)

    try:
        request_info_template = load_request_info(args.request_info_file)
    except (FileNotFoundError, ValueError, json.JSONDecodeError) as exc:
        log.error("Could not load RequestInfo:\n        %s", exc)
        sys.exit(1)

    order_host = args.order_host.rstrip("/")
    order_management_host = args.order_management_host.rstrip("/")
    pdf_host = args.pdf_host.rstrip("/")
    filestore_host = args.filestore_host.rstrip("/")
    text_dir = args.text_dir

    # Up-front coverage check so the user can fix missing files before any
    # processing happens.
    if Path(text_dir).expanduser().exists():
        prepared_hits = []
        prepared_misses = []
        for order_number in order_numbers:
            if read_prepared_text(text_dir, order_number) is not None:
                prepared_hits.append(order_number)
            else:
                prepared_misses.append(order_number)
        log.info("Prepared text coverage: %d/%d orders have a file in %s",
                 len(prepared_hits), len(order_numbers), text_dir)
        if prepared_misses:
            log.warning(
                "%d order(s) have no prepared file%s: %s",
                len(prepared_misses),
                " (will be skipped due to --require-prepared)" if args.require_prepared
                else " (will pause so you can edit a starter file in your IDE)",
                ", ".join(prepared_misses),
            )
    else:
        log.warning(
            "Text directory %s does not exist — for every order the script "
            "will write a starter file there and pause for you to edit it. "
            "Tip: prepare %s/{orderNumber}.html in advance to skip the pauses.",
            text_dir, text_dir,
        )

    if not args.skip_preflight:
        log.info("Running preflight connectivity check...")
        hosts = {
            "order": order_host,
            "order-management": order_management_host,
            "pdf": pdf_host,
            "filestore": filestore_host,
        }
        if not preflight_check(hosts):
            log.error(
                "Preflight failed — one or more services are not reachable. "
                "Start the relevant port-forwards and try again "
                "(or pass --skip-preflight to bypass)."
            )
            sys.exit(2)

    log.info("Processing %d order(s) from %s", len(order_numbers), args.file)

    succeeded: list[str] = []
    failed: list[str] = []
    for idx, order_number in enumerate(order_numbers, start=1):
        log.info("--- [%d/%d] %s ---", idx, len(order_numbers), order_number)
        try:
            ok = process_one(
                order_number,
                order_host,
                order_management_host,
                pdf_host,
                filestore_host,
                args.tenant_id,
                request_info_template,
                text_dir,
                args.require_prepared,
                args.results_dir,
            )
        except KeyboardInterrupt:
            log.warning("Interrupted by user — stopping")
            break
        except Exception:
            log.exception("Unhandled error processing %s", order_number)
            ok = False
        (succeeded if ok else failed).append(order_number)

    log.info("Summary: %d succeeded, %d failed", len(succeeded), len(failed))
    if succeeded:
        log.info("Succeeded orderNumbers: %s", ", ".join(succeeded))
    if failed:
        log.error("Failed orderNumbers: %s", ", ".join(failed))


if __name__ == "__main__":
    main()
