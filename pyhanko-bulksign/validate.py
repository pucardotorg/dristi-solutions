"""Confirm a signed PDF really contains an embedded, intact PDF signature.

    python validate.py signed-out.pdf
"""
import sys

from pyhanko.pdf_utils.reader import PdfFileReader
from pyhanko.sign.validation import validate_pdf_signature

path = sys.argv[1] if len(sys.argv) > 1 else "signed-out.pdf"
r = PdfFileReader(open(path, "rb"))
sigs = r.embedded_signatures
print("embedded signatures:", len(sigs))
for s in sigs:
    st = validate_pdf_signature(s)
    print(" field   :", s.field_name)
    print(" signer  :", s.signer_cert.subject.human_friendly)
    print(" intact  :", st.intact, "| valid:", st.valid)
    print(" summary :", st.summary())
