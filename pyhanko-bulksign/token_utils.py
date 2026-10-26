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


def describe_error(e: BaseException) -> str:
    """python-pkcs11 errors are classes per PKCS#11 return code and often carry no
    message (str(e) == ""), so always include the class name."""
    text = str(e).strip()
    if isinstance(e, RuntimeError) and type(e) is RuntimeError and text:
        return text  # our own messages already say what failed
    return f"{type(e).__name__}: {text}" if text else type(e).__name__


class TokenIdentity(TypedDict):
    token_label: str
    cert_label: str
    cert_id_hex: str
    cn: str
    slot_no: int   # index in lib.get_slots(); signing opens exactly this slot


# One caller at a time into each vendor library (token detection / self-test).
# Per library, so one library that hangs cannot block trying the others.
_LOCKS = {}
_LOCKS_GUARD = threading.Lock()


def _lock_for(module_path):
    with _LOCKS_GUARD:
        return _LOCKS.setdefault(module_path, threading.Lock())

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
        with _lock_for(module_path):
            return list_token_identities(module_path)

    return call_with_timeout(locked)


def find_token_module(candidates, prepare=None):
    """
    Try each candidate library until one sees a token (a computer can have
    several brands' libraries: the bundled HYP2003 one, an installed ProxKey
    driver, ...). Returns (module or None, identities, tried) where `tried` is a
    list of (module, identities-or-error-string) for every library attempted.
    """
    tried = []
    for path in candidates:
        try:
            if prepare:
                prepare(path)
            ids = list_token_identities_safe(path)
        except Exception as e:  # noqa: BLE001 - note it, try the next library
            tried.append((path, f"error: {describe_error(e)}"))
            continue
        tried.append((path, ids))
        if ids:
            return path, ids, tried
    return None, [], tried


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
    slot_errors = []

    try:
        slots = list(lib.get_slots())
    except Exception as e:  # noqa: BLE001
        raise RuntimeError(f"listing slots failed ({describe_error(e)})") from e

    # Ask each slot separately: some libraries (WatchData ProxKey) report several
    # reader slots, some of which fail with DeviceError -- python-pkcs11's
    # get_tokens() aborts on the first such slot, hiding the working one.
    for slot_no, slot in enumerate(slots):
        try:
            token = slot.get_token()
        except Exception as e:  # noqa: BLE001 - empty or broken slot: try the next
            if not isinstance(e, (pkcs11.exceptions.TokenNotPresent,
                                  pkcs11.exceptions.TokenNotRecognised)):
                slot_errors.append(f"slot {slot_no} ({slot.slot_description.strip()}): "
                                   f"{describe_error(e)}")
            continue
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
                        slot_no=slot_no,
                    ))
        except pkcs11.PKCS11Error as e:
            # A token that can't be opened publicly -> try the others, but report
            # it if nothing else is found (instead of a silent "no token").
            slot_errors.append(f"token '{token_label}': opening a session failed "
                               f"({describe_error(e)})")
            continue

    if not identities and slot_errors:
        raise RuntimeError("; ".join(slot_errors))
    return identities


def pick_identity(module_path: str, cert_label=None) -> TokenIdentity:
    """
    The identity to sign with: the one whose certificate label is `cert_label`,
    or the token's sole identity if no label is configured.

    Raises RuntimeError with an actionable message if no token is present or if
    the token holds several certificates and no label is set.
    """
    ids = list_token_identities(module_path)
    if not ids:
        raise RuntimeError("No DSC token detected -- plug it in and try again.")
    if cert_label:
        match = [i for i in ids if i["cert_label"] == cert_label]
        if not match:
            raise RuntimeError(f"No certificate labelled '{cert_label}' on the token "
                               "(PKCS11_CERT_LABEL in .env).")
        return match[0]
    if len(ids) > 1:
        opts = ", ".join(i["cert_label"] for i in ids if i["cert_label"])
        raise RuntimeError(
            "Multiple certificates on the token; set PKCS11_CERT_LABEL to one of: " + opts
        )
    return ids[0]
