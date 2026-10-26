"""
Sign through the Windows certificate store (Windows only).

Windows signing tools such as Capricorn do not use the token's PKCS#11 library:
they sign through the Windows certificate store, where the token vendor's driver
registers the token's certificate together with a key provider (a CAPI "CSP" or
CNG "KSP", e.g. "PROXKey CSP India V3.0"). The private key never leaves the
token; Windows hands the signing request to the vendor's provider.

This module does the same, as a fallback when no PKCS#11 library can read the
token (seen on a court PC: WatchData ProxKey's PKCS#11 library failed with
DeviceError while its CSP worked). Any token brand whose driver registers its
certificate in the store works this way.

  find_signing_certs()   store certificates usable for signing (hardware key,
                         valid now, signing key usage)
  is_present(cert)       is that certificate's token plugged in (no PIN needed)
  StoreKey(cert, pin)    open the key; .sign(digest, algorithm) -> signature
  StoreSigner            pyHanko Signer backed by a StoreKey
"""

import ctypes
import datetime
import hashlib
import threading
from ctypes import wintypes

from asn1crypto import algos, x509
from pyhanko.sign.signers import Signer
from pyhanko_certvalidator.registry import SimpleCertificateStore

# Key providers that keep keys in software (or the TPM), i.e. not a DSC token.
SOFTWARE_PROVIDERS = {
    "Microsoft Software Key Storage Provider",
    "Microsoft Platform Crypto Provider",
    "Microsoft Passport Key Storage Provider",
    "Microsoft Base Cryptographic Provider v1.0",
    "Microsoft Enhanced Cryptographic Provider v1.0",
    "Microsoft Strong Cryptographic Provider",
    "Microsoft Enhanced RSA and AES Cryptographic Provider",
    "Microsoft RSA SChannel Cryptographic Provider",
    "Microsoft Base DSS and Diffie-Hellman Cryptographic Provider",
    "Microsoft Enhanced DSS and Diffie-Hellman Cryptographic Provider",
    "Microsoft DH SChannel Cryptographic Provider",
}

_ENCODING = 0x00010001                 # X509_ASN_ENCODING | PKCS_7_ASN_ENCODING
_CERT_FIND_SHA1_HASH = 0x00010000
_CERT_KEY_PROV_INFO_PROP_ID = 2
_ACQUIRE_COMPARE_KEY = 0x00000004
_ACQUIRE_SILENT = 0x00000040
_ACQUIRE_ALLOW_NCRYPT = 0x00010000
_NCRYPT_KEY_SPEC = 0xFFFFFFFF          # CERT_NCRYPT_KEY_SPEC
_AT_SIGNATURE = 2
_PP_KEYEXCHANGE_PIN, _PP_SIGNATURE_PIN = 32, 33
_HP_HASHVAL = 2
_BCRYPT_PAD_PKCS1 = 0x00000002
_CALG = {"sha1": 0x8004, "sha256": 0x800C, "sha384": 0x800D, "sha512": 0x800E}
_CNG_ALG = {"sha1": "SHA1", "sha256": "SHA256", "sha384": "SHA384", "sha512": "SHA512"}


class _CERT_CONTEXT(ctypes.Structure):
    _fields_ = [("dwCertEncodingType", wintypes.DWORD),
                ("pbCertEncoded", ctypes.POINTER(ctypes.c_ubyte)),
                ("cbCertEncoded", wintypes.DWORD),
                ("pCertInfo", ctypes.c_void_p),
                ("hCertStore", ctypes.c_void_p)]


class _HASH_BLOB(ctypes.Structure):
    _fields_ = [("cbData", wintypes.DWORD), ("pbData", ctypes.c_void_p)]


class _KEY_PROV_INFO(ctypes.Structure):
    _fields_ = [("pwszContainerName", wintypes.LPWSTR),
                ("pwszProvName", wintypes.LPWSTR),
                ("dwProvType", wintypes.DWORD),
                ("dwFlags", wintypes.DWORD),
                ("cProvParam", wintypes.DWORD),
                ("rgProvParam", ctypes.c_void_p),
                ("dwKeySpec", wintypes.DWORD)]


class _PKCS1_PADDING_INFO(ctypes.Structure):
    _fields_ = [("pszAlgId", wintypes.LPCWSTR)]


_api = None


def _apis():
    """Load crypt32/advapi32/ncrypt with typed signatures (once)."""
    global _api
    if _api is not None:
        return _api
    c = ctypes.WinDLL("crypt32", use_last_error=True)
    a = ctypes.WinDLL("advapi32", use_last_error=True)
    n = ctypes.WinDLL("ncrypt")
    H = ctypes.c_size_t                      # HCRYPTPROV / HCRYPTHASH / NCRYPT handles
    P = ctypes.POINTER

    c.CertOpenSystemStoreW.argtypes = [ctypes.c_void_p, wintypes.LPCWSTR]
    c.CertOpenSystemStoreW.restype = ctypes.c_void_p
    c.CertCloseStore.argtypes = [ctypes.c_void_p, wintypes.DWORD]
    c.CertEnumCertificatesInStore.argtypes = [ctypes.c_void_p, ctypes.c_void_p]
    c.CertEnumCertificatesInStore.restype = ctypes.c_void_p
    c.CertFindCertificateInStore.argtypes = [ctypes.c_void_p, wintypes.DWORD, wintypes.DWORD,
                                             wintypes.DWORD, ctypes.c_void_p, ctypes.c_void_p]
    c.CertFindCertificateInStore.restype = ctypes.c_void_p
    c.CertFreeCertificateContext.argtypes = [ctypes.c_void_p]
    c.CertGetCertificateContextProperty.argtypes = [ctypes.c_void_p, wintypes.DWORD,
                                                    ctypes.c_void_p, P(wintypes.DWORD)]
    c.CertGetCertificateContextProperty.restype = wintypes.BOOL
    c.CryptAcquireCertificatePrivateKey.argtypes = [ctypes.c_void_p, wintypes.DWORD,
                                                    ctypes.c_void_p, P(H),
                                                    P(wintypes.DWORD), P(wintypes.BOOL)]
    c.CryptAcquireCertificatePrivateKey.restype = wintypes.BOOL

    a.CryptSetProvParam.argtypes = [H, wintypes.DWORD, ctypes.c_char_p, wintypes.DWORD]
    a.CryptSetProvParam.restype = wintypes.BOOL
    a.CryptCreateHash.argtypes = [H, ctypes.c_uint, H, wintypes.DWORD, P(H)]
    a.CryptCreateHash.restype = wintypes.BOOL
    a.CryptSetHashParam.argtypes = [H, wintypes.DWORD, ctypes.c_char_p, wintypes.DWORD]
    a.CryptSetHashParam.restype = wintypes.BOOL
    a.CryptSignHashW.argtypes = [H, wintypes.DWORD, wintypes.LPCWSTR, wintypes.DWORD,
                                 ctypes.c_void_p, P(wintypes.DWORD)]
    a.CryptSignHashW.restype = wintypes.BOOL
    a.CryptDestroyHash.argtypes = [H]
    a.CryptReleaseContext.argtypes = [H, wintypes.DWORD]

    n.NCryptSetProperty.argtypes = [H, wintypes.LPCWSTR, ctypes.c_char_p, wintypes.DWORD,
                                    wintypes.DWORD]
    n.NCryptSetProperty.restype = ctypes.c_long
    n.NCryptSignHash.argtypes = [H, ctypes.c_void_p, ctypes.c_char_p, wintypes.DWORD,
                                 ctypes.c_void_p, wintypes.DWORD, P(wintypes.DWORD),
                                 wintypes.DWORD]
    n.NCryptSignHash.restype = ctypes.c_long
    n.NCryptFreeObject.argtypes = [H]
    n.NCryptFreeObject.restype = ctypes.c_long
    _api = (c, a, n)
    return _api


def _err(what: str, code=None) -> RuntimeError:
    code = ctypes.get_last_error() if code is None else code
    code &= 0xFFFFFFFF
    text = ctypes.FormatError(code).strip() if code else ""
    return RuntimeError(f"{what} failed (0x{code:08X}{': ' + text if text else ''})")


def _open_store():
    c, _, _ = _apis()
    store = c.CertOpenSystemStoreW(None, "MY")
    if not store:
        raise _err("Opening the Windows certificate store")
    return store


def _cert_der(ctx) -> bytes:
    cc = ctypes.cast(ctx, ctypes.POINTER(_CERT_CONTEXT)).contents
    return ctypes.string_at(cc.pbCertEncoded, cc.cbCertEncoded)


def _provider(ctx):
    """Key provider name linked to the certificate, or None (no private key)."""
    c, _, _ = _apis()
    size = wintypes.DWORD(0)
    if not c.CertGetCertificateContextProperty(ctx, _CERT_KEY_PROV_INFO_PROP_ID, None,
                                               ctypes.byref(size)):
        return None
    raw = ctypes.create_string_buffer(size.value)
    if not c.CertGetCertificateContextProperty(ctx, _CERT_KEY_PROV_INFO_PROP_ID, raw,
                                               ctypes.byref(size)):
        return None
    return ctypes.cast(raw, ctypes.POINTER(_KEY_PROV_INFO)).contents.pwszProvName or ""


def _signing_problem(cert: x509.Certificate):
    """Why this certificate cannot sign now, or None if it can."""
    now = datetime.datetime.now(datetime.timezone.utc)
    validity = cert["tbs_certificate"]["validity"]
    not_before, not_after = validity["not_before"].native, validity["not_after"].native
    if now > not_after:
        return f"expired on {not_after:%d-%m-%Y}"
    if now < not_before:
        return f"not valid until {not_before:%d-%m-%Y}"
    usage = cert.key_usage_value
    if usage is not None and not ({"digital_signature", "non_repudiation"} & set(usage.native)):
        return "not a signing certificate (encryption only)"
    if cert.public_key.algorithm != "rsa":
        return f"unsupported key type {cert.public_key.algorithm}"
    return None


def find_signing_certs(allow_software=False):
    """
    Store certificates with a private key, as dicts: name, provider, thumbprint
    (hex SHA-1), der, problem (None = usable for signing now). Hardware (token)
    providers only, unless allow_software (used by the CI test).
    """
    c, _, _ = _apis()
    store = _open_store()
    found, ctx = [], None
    try:
        while True:
            ctx = c.CertEnumCertificatesInStore(store, ctx)  # frees the previous one
            if not ctx:
                break
            provider = _provider(ctx)
            if provider is None or (provider in SOFTWARE_PROVIDERS and not allow_software):
                continue
            der = _cert_der(ctx)
            cert = x509.Certificate.load(der)
            found.append({
                "name": cert.subject.native.get("common_name", "") or "(no name)",
                "provider": provider,
                "thumbprint": hashlib.sha1(der).hexdigest(),
                "der": der,
                "problem": _signing_problem(cert),
            })
    finally:
        c.CertCloseStore(store, 0)
    return found


class StoreKey:
    """The token's private key for one store certificate, via its key provider."""

    def __init__(self, cert_info, pin=None, silent=False):
        c, _, n = _apis()
        self._store = _open_store()
        thumb = bytes.fromhex(cert_info["thumbprint"])
        buf = ctypes.create_string_buffer(thumb, len(thumb))
        blob = _HASH_BLOB(len(thumb), ctypes.cast(buf, ctypes.c_void_p))
        self._ctx = c.CertFindCertificateInStore(self._store, _ENCODING, 0, _CERT_FIND_SHA1_HASH,
                                                 ctypes.byref(blob), None)
        if not self._ctx:
            c.CertCloseStore(self._store, 0)
            raise _err("Finding the certificate in the Windows store")
        self.der = _cert_der(self._ctx)
        self.cert = x509.Certificate.load(self.der)
        self.key_bytes = (self.cert.public_key.bit_size + 7) // 8

        handle, spec, free = ctypes.c_size_t(0), wintypes.DWORD(0), wintypes.BOOL(0)
        flags = _ACQUIRE_COMPARE_KEY | _ACQUIRE_ALLOW_NCRYPT | (_ACQUIRE_SILENT if silent else 0)
        if not c.CryptAcquireCertificatePrivateKey(self._ctx, flags, None, ctypes.byref(handle),
                                                   ctypes.byref(spec), ctypes.byref(free)):
            e = _err("Opening the token's key (is the token plugged in?)")
            self._release_cert()
            raise e
        self._handle, self._spec, self._free = handle.value, spec.value, bool(free.value)
        self.is_cng = self._spec == _NCRYPT_KEY_SPEC
        self._lock = threading.Lock()  # one signing request at a time per key
        if pin:
            self._set_pin(pin)

    def _set_pin(self, pin: str):
        """Give the PIN to the provider so it does not prompt for every document.
        Not every provider accepts this; if not, it shows its own PIN dialog."""
        _, a, n = _apis()
        if self.is_cng:
            data = (pin + "\0").encode("utf-16-le")
            rc = n.NCryptSetProperty(self._handle, "SmartCardPin", data, len(data), 0)
            self.pin_set = rc == 0
        else:
            param = _PP_SIGNATURE_PIN if self._spec == _AT_SIGNATURE else _PP_KEYEXCHANGE_PIN
            data = pin.encode("ascii", "ignore") + b"\0"
            self.pin_set = bool(a.CryptSetProvParam(self._handle, param, data, 0))

    def sign(self, digest: bytes, digest_algorithm: str) -> bytes:
        """RSA PKCS#1 v1.5 signature of an already computed digest (big-endian)."""
        with self._lock:
            return self._sign(digest, digest_algorithm.lower().replace("-", ""))

    def _sign(self, digest: bytes, algo: str) -> bytes:
        _, a, n = _apis()
        if self.is_cng:
            pad = _PKCS1_PADDING_INFO(_CNG_ALG[algo])
            size = wintypes.DWORD(0)
            rc = n.NCryptSignHash(self._handle, ctypes.byref(pad), digest, len(digest), None, 0,
                                  ctypes.byref(size), _BCRYPT_PAD_PKCS1)
            if rc:
                raise _err("Signing with the token", rc)
            out = ctypes.create_string_buffer(size.value)
            rc = n.NCryptSignHash(self._handle, ctypes.byref(pad), digest, len(digest), out,
                                  size.value, ctypes.byref(size), _BCRYPT_PAD_PKCS1)
            if rc:
                raise _err("Signing with the token", rc)
            return out.raw[:size.value]

        h = ctypes.c_size_t(0)
        if not a.CryptCreateHash(self._handle, _CALG[algo], 0, 0, ctypes.byref(h)):
            raise _err(f"Preparing a {algo.upper()} signature (CryptCreateHash)")
        try:
            if not a.CryptSetHashParam(h.value, _HP_HASHVAL, digest, 0):
                raise _err("Setting the document hash")
            size = wintypes.DWORD(0)
            if not a.CryptSignHashW(h.value, self._spec, None, 0, None, ctypes.byref(size)):
                raise _err("Signing with the token")
            out = ctypes.create_string_buffer(size.value)
            if not a.CryptSignHashW(h.value, self._spec, None, 0, out, ctypes.byref(size)):
                raise _err("Signing with the token")
        finally:
            a.CryptDestroyHash(h.value)
        # CryptoAPI returns the signature little-endian; PDF/CMS needs big-endian.
        return out.raw[:size.value][::-1]

    def _release_cert(self):
        c, _, _ = _apis()
        if getattr(self, "_ctx", None):
            c.CertFreeCertificateContext(self._ctx)
            self._ctx = None
        if getattr(self, "_store", None):
            c.CertCloseStore(self._store, 0)
            self._store = None

    def close(self):
        _, a, n = _apis()
        if getattr(self, "_free", False) and self._handle:
            if self.is_cng:
                n.NCryptFreeObject(self._handle)
            else:
                a.CryptReleaseContext(self._handle, 0)
        self._handle = 0
        self._release_cert()


def is_present(cert_info) -> bool:
    """True if the certificate's token is plugged in (opens the key silently,
    no PIN needed; fails when the token is absent)."""
    try:
        StoreKey(cert_info, silent=True).close()
        return True
    except Exception:  # noqa: BLE001
        return False


class StoreSigner(Signer):
    """pyHanko signer whose key operations go to a StoreKey (RSA PKCS#1 v1.5)."""

    def __init__(self, key: StoreKey):
        self._key = key
        super().__init__(
            signing_cert=key.cert,
            cert_registry=SimpleCertificateStore.from_certs([key.cert]),
            signature_mechanism=algos.SignedDigestAlgorithm({"algorithm": "sha256_rsa"}),
        )

    async def async_sign_raw(self, data: bytes, digest_algorithm: str, dry_run=False) -> bytes:
        if dry_run:
            return bytes(self._key.key_bytes)
        digest = hashlib.new(digest_algorithm, data).digest()
        return self._key.sign(digest, digest_algorithm)
