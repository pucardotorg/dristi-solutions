"""
Read DSC-token identities (certificate label + Common Name) WITHOUT a PIN.

Certificates on a PKCS#11 token are *public* objects, so they can be listed in a
no-login session -- the same information `pkcs11-tool --module <lib> -O` prints.
This lets the desktop app show the token's labels under the title and auto-use a
single-identity token, so staff never have to hand-find PKCS11_CERT_LABEL for a
new DSC pendrive.

Works the same on Linux (.so), Windows (.dll) and macOS (.dylib).
"""

import threading
from typing import List, TypedDict

import pkcs11
from asn1crypto import x509
from pkcs11 import Attribute, ObjectClass


class TokenIdentity(TypedDict):
    token_label: str
    cert_label: str
    cert_id_hex: str
    cn: str


# One caller at a time into the vendor library (token detection / self-test).
TOKEN_LOCK = threading.Lock()

TOKEN_TIMEOUT_S = 30


def call_with_timeout(fn, *args, timeout=TOKEN_TIMEOUT_S):
    """Run fn(*args) on a helper thread; raise TimeoutError if it does not return,
    so a stuck vendor library cannot freeze the caller."""
    result = {}

    def run():
        try:
            result["value"] = fn(*args)
        except BaseException as e:  # noqa: BLE001 - re-raised in the caller
            result["error"] = e

    t = threading.Thread(target=run, daemon=True)
    t.start()
    t.join(timeout)
    if t.is_alive():
        raise TimeoutError(f"the DSC token library did not respond within {timeout} s "
                           "(re-plug the token; if it repeats, restart the app)")
    if "error" in result:
        raise result["error"]
    return result["value"]


def list_token_identities_safe(module_path: str) -> List[TokenIdentity]:
    """list_token_identities() with the lock and a timeout."""
    def locked():
        with TOKEN_LOCK:
            return list_token_identities(module_path)

    return call_with_timeout(locked)


def list_token_identities(module_path: str) -> List[TokenIdentity]:
    """
    Enumerate certificate identities on every token reachable through the given
    PKCS#11 module. Returns [] if no token is present. Raises if the module cannot
    be loaded (e.g. wrong path / not a PKCS#11 library).
    """
    try:
        lib = pkcs11.lib(module_path)
    except Exception as e:  # noqa: BLE001 - OS loader errors come in many types
        raise RuntimeError(
            f"Could not load the DSC token library {module_path}: {e}\n"
            "The token's driver may not be installed, the library may need other "
            "vendor files next to it, or it may be 32-bit (this app is 64-bit)."
        ) from e
    identities: List[TokenIdentity] = []

    for token in lib.get_tokens():
        token_label = (token.label or "").strip()
        try:
            # No user_pin -> public session; enough to read certificates.
            with token.open() as session:
                for cert in session.get_objects({Attribute.CLASS: ObjectClass.CERTIFICATE}):
                    try:
                        label = cert[Attribute.LABEL]
                    except Exception:
                        label = ""
                    try:
                        cert_id = bytes(cert[Attribute.ID]).hex()
                    except Exception:
                        cert_id = ""
                    cn = ""
                    try:
                        der = bytes(cert[Attribute.VALUE])
                        cn = x509.Certificate.load(der).subject.native.get("common_name", "") or ""
                    except Exception:
                        pass
                    identities.append(TokenIdentity(
                        token_label=token_label,
                        cert_label=label or "",
                        cert_id_hex=cert_id,
                        cn=cn,
                    ))
        except pkcs11.PKCS11Error:
            # A token slot that can't be opened publicly -> skip it.
            continue

    return identities


def detect_single_cert_label(module_path: str) -> str:
    """
    Return the cert_label of the token's sole identity.

    Raises RuntimeError with an actionable message if no token is present or if
    the token holds more than one certificate (caller must then set the label).
    """
    ids = list_token_identities(module_path)
    if not ids:
        raise RuntimeError("No DSC token detected -- plug it in and try again.")
    if len(ids) > 1:
        opts = ", ".join(i["cert_label"] for i in ids if i["cert_label"])
        raise RuntimeError(
            "Multiple certificates on the token; set PKCS11_CERT_LABEL to one of: " + opts
        )
    return ids[0]["cert_label"]
