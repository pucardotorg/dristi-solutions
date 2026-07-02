"""
Self-signed PKCS#12 (.p12) for SIGNER_MODE=software testing -- so the app can be
exercised WITHOUT a DSC token. The signature is cryptographically valid but
UNTRUSTED (self-signed); fine for verifying the flow and placement.

Used two ways:
  * imported  -> ensure_test_cert() auto-creates it on first START (software mode)
  * CLI       -> python gen_test_cert.py   (writes test-cert.p12, passphrase: test)
"""

import datetime
import os

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.x509.oid import NameOID


def ensure_test_cert(path: str = "test-cert.p12", passphrase: bytes = b"test") -> str:
    """Create a self-signed PKCS#12 at `path` if it does not already exist."""
    if os.path.exists(path):
        return path

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    name = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, "OnCourts Test Judge"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "OnCourts eCourts (TEST)"),
    ])
    now = datetime.datetime.utcnow()
    cert = (
        x509.CertificateBuilder()
        .subject_name(name)
        .issuer_name(name)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - datetime.timedelta(days=1))
        .not_valid_after(now + datetime.timedelta(days=825))
        .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
        .sign(key, hashes.SHA256())
    )
    blob = pkcs12.serialize_key_and_certificates(
        name=b"oncourts-test",
        key=key,
        cert=cert,
        cas=None,
        encryption_algorithm=serialization.BestAvailableEncryption(passphrase),
    )
    with open(path, "wb") as f:
        f.write(blob)
    return path


if __name__ == "__main__":
    out = ensure_test_cert()
    print(f"Ready: {out} (passphrase: test)")
