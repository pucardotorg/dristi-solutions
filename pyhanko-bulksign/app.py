"""
PUCAR bulk-sign agent -- Capricorn-compatible HTTP service backed by pyHanko.

Drop-in replacement for the proprietary Capricorn `pkiNetworkSign` desktop agent.
It runs locally on the signing machine (where the DSC token is plugged in) and
listens on the same port (1620). The court frontend's bulk-sign views
(BulkESignView.js and friends) post to `BULK_SIGN_URL` unchanged.

Contract (identical to Capricorn):

  Request  (application/x-www-form-urlencoded):
      response = <request> ... pkiNetworkSign XML with base64 PDF + coords ... </request>

  Response (application/xml) -- read by the frontend's parseXml(data, "status"|"data"|"error"):
      <response><status>ok</status><data>BASE64_SIGNED_PDF</data><error></error></response>
      <response><status>failed</status><data></data><error>message</error></response>

The frontend loops over selected orders and calls this once per order, so each
request signs exactly one PDF.

Run:
    uvicorn app:app --host 127.0.0.1 --port 1620
(see run.sh / run.bat which set the signer env and prompt for the token PIN)
"""

import base64
import logging
import os
import xml.etree.ElementTree as ET

try:
    # Optional: load non-secret config from a local .env if present.
    from dotenv import load_dotenv

    load_dotenv()
except Exception:  # pragma: no cover - dotenv is optional
    pass

from fastapi import FastAPI, Form
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from pyhanko_signer import sign_pdf_bytes

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("pyhanko-bulksign")

app = FastAPI(title="PUCAR pyHanko bulk-sign agent")

# The browser runs on the court web domain but posts to http://localhost:1620,
# i.e. a cross-origin request. CORS headers are required for the JS to read the
# response. (form-urlencoded is a CORS-"simple" request, so no preflight.)
_allowed = os.environ.get("CORS_ALLOW_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _allowed.split(",")] if _allowed != "*" else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _text(root: ET.Element, tag: str, default: str = "") -> str:
    el = root.find(f".//{tag}")
    return el.text.strip() if el is not None and el.text else default


def _build_response(status: str, data_b64: str = "", error: str = "") -> Response:
    root = ET.Element("response")
    ET.SubElement(root, "status").text = status
    ET.SubElement(root, "data").text = data_b64
    ET.SubElement(root, "error").text = error
    return Response(content=ET.tostring(root, encoding="unicode"), media_type="application/xml")


@app.get("/health")
def health():
    return {"status": "UP", "mode": os.environ.get("SIGNER_MODE", "software")}


@app.post("/")
async def sign(response: str = Form(...)):
    """`response` is the pkiNetworkSign XML produced by order-management BSSService."""
    try:
        req = ET.fromstring(response)

        data_b64 = _text(req, "data")
        if not data_b64:
            return _build_response("failed", error="no <data> (base64 pdf) in request")

        pdf_bytes = base64.b64decode(data_b64)

        page = int(_text(req, "page", "1") or "1")
        cood = _text(req, "cood", "0,0")          # "x,y"
        size = _text(req, "size", "150,40")        # "w,h"
        x, y = (float(v) for v in cood.split(","))
        w, h = (float(v) for v in size.split(","))
        txn = _text(req, "txn")

        log.info("sign txn=%s page=%s coord=(%s,%s) size=(%s,%s) pdf=%d bytes",
                 txn or "-", page, x, y, w, h, len(pdf_bytes))

        # pyHanko's sync sign_pdf calls asyncio.run() internally, which cannot run
        # inside FastAPI's event loop -> offload to a worker thread.
        signed = await run_in_threadpool(sign_pdf_bytes, pdf_bytes, page, x, y, w, h)

        return _build_response("ok", data_b64=base64.b64encode(signed).decode("ascii"))

    except Exception as e:  # noqa: BLE001 - report any failure to the client as Capricorn does
        log.exception("signing failed")
        return _build_response("failed", error=str(e))
