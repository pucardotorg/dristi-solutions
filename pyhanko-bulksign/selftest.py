"""
Self-test: proves this build works on THIS computer, without the browser.

  1. Signing engine -- signs a sample PDF in TEST mode through the real HTTP agent
     (same request the court app sends) and checks the signature is intact.
  2. DSC token -- finds the token's PKCS#11 library, loads it, and lists the
     certificates on any plugged-in token (no PIN needed). Informational: a
     missing token does not fail the test.

Run from the app ("Self-test" button) or headless:
    OncourtsBulkSign --selftest     -> writes selftest-result.txt, exit code 0/1
"""

import base64
import io
import logging
import os
import platform
import socket
import sys
import tempfile
import threading
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET


def _free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def _check_signing(report):
    import uvicorn

    from app import ThreadedServer, app
    from gen_test_cert import ensure_test_cert
    from pyhanko.pdf_utils.reader import PdfFileReader
    from pyhanko.sign.validation import validate_pdf_signature
    from test_client import build_pki_network_sign_xml, make_sample_pdf

    tmp = tempfile.mkdtemp(prefix="oncourts-selftest-")
    saved = {k: os.environ.get(k) for k in ("SIGNER_MODE", "SIGNER_P12_PATH", "SIGNER_P12_PASSWORD")}
    os.environ.update(SIGNER_MODE="software",
                      SIGNER_P12_PATH=ensure_test_cert(os.path.join(tmp, "selftest.p12"), b"test"),
                      SIGNER_P12_PASSWORD="test")
    port = _free_port()
    server = ThreadedServer(uvicorn.Config(app, host="127.0.0.1", port=port,
                                           log_level="warning", log_config=None))
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    try:
        for _ in range(100):
            if server.started or not thread.is_alive():
                break
            time.sleep(0.1)
        if not server.started:
            raise RuntimeError("local HTTP agent did not start")

        body = urllib.parse.urlencode({"response": build_pki_network_sign_xml(make_sample_pdf())})
        req = urllib.request.Request(
            f"http://127.0.0.1:{port}/", data=body.encode("ascii"),
            headers={"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            out = ET.fromstring(resp.read())
        if (out.findtext("status") or "").strip() != "ok":
            raise RuntimeError(f"agent returned failure: {out.findtext('error')}")

        signed = base64.b64decode(out.findtext("data") or "")
        # A self-signed test cert is reported as UNTRUSTED (expected); silence that.
        pyhanko_log = logging.getLogger("pyhanko")
        level = pyhanko_log.level
        pyhanko_log.setLevel(logging.CRITICAL)
        try:
            sigs = PdfFileReader(io.BytesIO(signed)).embedded_signatures
            intact = len(sigs) == 1 and validate_pdf_signature(sigs[0]).intact
        finally:
            pyhanko_log.setLevel(level)
        if not intact:
            raise RuntimeError("signed PDF does not carry one intact signature")
        report.append(f"[PASS] Signing engine: sample PDF signed and verified ({len(signed)} bytes)")
        return True
    finally:
        server.should_exit = True
        thread.join(timeout=10)
        for k, v in saved.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v


def _check_token(report):
    from pyhanko_signer import find_pkcs11_module, prepare_module_dir

    import diagnostics
    import linux_setup

    if linux_setup.is_linux():
        report.append(f"[INFO] Linux USB access for DSC token: {linux_setup.usb_status()}")
    # Before touching the vendor library, so these are recorded even if it hangs.
    report.extend(diagnostics.report_lines())
    path, searched = find_pkcs11_module()
    if not path:
        report.append("[INFO] DSC token library: not found (only needed for real signing). Looked in:")
        report.extend(f"         {p}" for p in searched)
        return
    report.append(f"[INFO] DSC token library: {path}")
    prepare_module_dir(path)
    from token_utils import list_token_identities_safe

    ids = list_token_identities_safe(path)
    if not ids:
        report.append("[INFO] Library loaded OK; no token found. " + diagnostics.no_token_hint())
    for i in ids:
        report.append(f"[PASS] Token '{i['token_label']}': {i['cn'] or '(no CN)'}  [label: {i['cert_label']}]")


class _Report(list):
    """Report lines, also streamed to a file (flushed per line), a callback and
    stdout as they are produced -- a check that hangs still leaves the lines
    before it on screen and on disk."""

    def __init__(self, result_path=None, on_line=None):
        super().__init__()
        self._on_line = on_line
        self._fh = None
        if result_path:
            try:
                self._fh = open(result_path, "w", encoding="utf-8")
            except OSError:
                pass

    def append(self, line):
        super().append(line)
        if self._fh:
            self._fh.write(line + "\n")
            self._fh.flush()
        if self._on_line:
            self._on_line(line)
        try:
            print(line, flush=True)
        except Exception:  # windowed exe on Windows has no console
            pass

    def extend(self, lines):
        for line in lines:
            self.append(line)

    def close(self):
        if self._fh:
            self._fh.close()


def run_selftest(result_path=None, on_line=None):
    """Run all checks. Returns (ok, lines)."""
    report = _Report(result_path, on_line)
    report.append(f"OnCourts Bulk Sign self-test  {time.strftime('%Y-%m-%d %H:%M:%S')}")
    report.append(f"OS: {platform.platform()}  ({platform.machine()}, Python {platform.python_version()},"
                  f" {'packaged exe' if getattr(sys, 'frozen', False) else 'source'})")
    ok = True
    try:
        _check_signing(report)
    except Exception as e:  # noqa: BLE001 - report every failure
        ok = False
        report.append(f"[FAIL] Signing engine: {e}")
    try:
        _check_token(report)
    except Exception as e:  # noqa: BLE001
        report.append(f"[WARN] DSC token: {e}")
    report.append("RESULT: " + ("PASS" if ok else "FAIL"))
    report.close()
    return ok, list(report)


def main(result_path: str, on_line=None):
    """Run, streaming the report to `result_path` (and `on_line`, stdout).
    Returns (exit_code, lines)."""
    ok, lines = run_selftest(result_path, on_line)
    return (0 if ok else 1), lines
