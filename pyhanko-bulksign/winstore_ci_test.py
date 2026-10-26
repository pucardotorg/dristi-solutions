"""
CI test (Windows runner) for Windows certificate-store signing (winstore.py).

Creates two temporary self-signed certificates in CurrentUser\\My -- one with a
CryptoAPI provider (the kind DSC token CSPs such as "PROXKey CSP India V3.0"
are) and one with a CNG key storage provider -- then signs a PDF through each
via winstore.StoreSigner and checks the signature is intact and valid. This
exercises the real Windows signing calls, including CryptoAPI's little-endian
signature byte order. The certificates are removed afterwards.

    python winstore_ci_test.py      (Windows only; exit code 0 = pass)
"""

import io
import logging
import subprocess
import sys

PROVIDERS = {
    "CryptoAPI": '-Provider "Microsoft Enhanced RSA and AES Cryptographic Provider" -KeySpec Signature',
    "CNG": '-Provider "Microsoft Software Key Storage Provider"',
}


def _ps(command: str) -> str:
    out = subprocess.run(["powershell", "-NoProfile", "-Command", command],
                         capture_output=True, text=True, check=True)
    return out.stdout.strip()


def main() -> int:
    import winstore
    from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
    from pyhanko.pdf_utils.reader import PdfFileReader
    from pyhanko.sign import signers
    from pyhanko.sign.validation import validate_pdf_signature
    from test_client import make_sample_pdf

    logging.getLogger("pyhanko").setLevel(logging.CRITICAL)  # self-signed = untrusted
    ok = True
    for kind, args in PROVIDERS.items():
        thumb = _ps(f'(New-SelfSignedCertificate -Subject "CN=OnCourts CI {kind}" '
                    f'-CertStoreLocation Cert:\\CurrentUser\\My -KeyAlgorithm RSA -KeyLength 2048 '
                    f'-KeyUsage DigitalSignature {args} -NotAfter (Get-Date).AddDays(2)).Thumbprint')
        try:
            certs = {c["thumbprint"].upper(): c
                     for c in winstore.find_signing_certs(allow_software=True)}
            info = certs.get(thumb.upper())
            if info is None:
                raise RuntimeError("certificate not listed by find_signing_certs()")
            if info["problem"]:
                raise RuntimeError(f"unexpected problem: {info['problem']}")
            if not winstore.is_present(info):
                raise RuntimeError("is_present() returned False")
            key = winstore.StoreKey(info)
            try:
                w = IncrementalPdfFileWriter(io.BytesIO(make_sample_pdf()))
                out = io.BytesIO()
                signers.PdfSigner(signers.PdfSignatureMetadata(field_name="Signature"),
                                  signer=winstore.StoreSigner(key)).sign_pdf(w, output=out)
            finally:
                key.close()
            sig = PdfFileReader(io.BytesIO(out.getvalue())).embedded_signatures[0]
            status = validate_pdf_signature(sig)
            if not (status.intact and status.valid):
                raise RuntimeError(f"signature not valid: {status.summary()}")
            print(f"[PASS] {kind}: {info['provider']} (CNG key: {key.is_cng}) -- "
                  f"signed PDF verified ({status.summary()})")
        except Exception as e:  # noqa: BLE001
            ok = False
            print(f"[FAIL] {kind}: {e}")
        finally:
            _ps(f"Remove-Item Cert:\\CurrentUser\\My\\{thumb} -DeleteKey")
    print("RESULT:", "PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
