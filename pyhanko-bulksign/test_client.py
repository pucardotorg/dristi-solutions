"""
End-to-end test that mimics the court frontend (BulkESignView.js) -> bulk-sign agent.

1. Builds a valid one-page PDF.
2. Wraps it in the exact `pkiNetworkSign` XML order-management BSSService produces
   (command/ts/txn/certificate/file/pdf{page,cood,size}/data).
3. POSTs it url-encoded as `response=<xml>` to the agent (like the browser does).
4. Parses the <status>/<data> response and writes signed-out.pdf.

Usage (agent running on :1620):
    python test_client.py
    python validate.py signed-out.pdf
"""

import base64
import xml.etree.ElementTree as ET

import requests

AGENT_URL = "http://localhost:1620/"


def make_sample_pdf() -> bytes:
    """Build a valid one-page A4 PDF using pyHanko's own writer."""
    import io
    from pyhanko.pdf_utils import generic
    from pyhanko.pdf_utils.generic import pdf_name
    from pyhanko.pdf_utils.writer import PageObject, PdfFileWriter

    w = PdfFileWriter()

    content = generic.StreamObject(
        stream_data=b"BT /F1 18 Tf 72 760 Td (PUCAR test order document) Tj ET"
    )
    content_ref = w.add_object(content)

    font = generic.DictionaryObject({
        pdf_name("/Type"): pdf_name("/Font"),
        pdf_name("/Subtype"): pdf_name("/Type1"),
        pdf_name("/BaseFont"): pdf_name("/Helvetica"),
    })
    resources = generic.DictionaryObject({
        pdf_name("/Font"): generic.DictionaryObject({pdf_name("/F1"): font})
    })

    page = PageObject(contents=content_ref, media_box=(0, 0, 595, 842), resources=resources)
    w.insert_page(page)

    buf = io.BytesIO()
    w.write(buf)
    return buf.getvalue()


def build_pki_network_sign_xml(pdf_bytes: bytes) -> str:
    root = ET.Element("request")
    ET.SubElement(root, "command").text = "pkiNetworkSign"
    ET.SubElement(root, "ts").text = "2026-06-19T12:00:00+05:30"
    ET.SubElement(root, "txn").text = "test-txn-0001"
    cert = ET.SubElement(root, "certificate")
    for cn in ("CN", "O", "OU", "T", "E", "SN", "CA"):
        ET.SubElement(cert, "attribute", {"name": cn})
    ET.SubElement(cert, "attribute", {"name": "TC"}).text = "SG"
    ET.SubElement(cert, "attribute", {"name": "AP"}).text = "1"
    f = ET.SubElement(root, "file")
    ET.SubElement(f, "attribute", {"name": "type"}).text = "pdf"
    pdf = ET.SubElement(root, "pdf")
    ET.SubElement(pdf, "page").text = "1"
    ET.SubElement(pdf, "cood").text = "350,60"     # lower-left x,y
    ET.SubElement(pdf, "size").text = "180,50"      # width,height
    ET.SubElement(pdf, "dateformat").text = "dd-MMM-yyyy"
    ET.SubElement(root, "data").text = base64.b64encode(pdf_bytes).decode("ascii")
    return ET.tostring(root, encoding="unicode")


def main():
    xml = build_pki_network_sign_xml(make_sample_pdf())
    resp = requests.post(
        AGENT_URL,
        data={"response": xml},
        headers={"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"},
        timeout=60,
    )
    print("HTTP", resp.status_code)
    out = ET.fromstring(resp.text)
    status = (out.findtext("status") or "").strip()
    print("status =", status)
    if status == "failed":
        print("error  =", out.findtext("error"))
        return
    signed = base64.b64decode((out.findtext("data") or "").strip())
    with open("signed-out.pdf", "wb") as fh:
        fh.write(signed)
    print(f"OK: wrote signed-out.pdf ({len(signed)} bytes)")


if __name__ == "__main__":
    main()
