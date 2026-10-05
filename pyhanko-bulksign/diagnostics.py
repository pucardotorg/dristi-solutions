"""
Why is the DSC token not found? Checks independent of the vendor library:

  usb_tokens()    is a HYP2003/ePass2003 token visible on USB at all?
                  (USB vendor IDs 096e = Feitian hardware, 2ccf = Hypersecu)
  pcsc_readers()  does the OS smart-card service (PC/SC) see it as a reader?
                  The Windows and macOS token libraries talk to the token
                  through PC/SC, so "on USB but no reader" means the OS lacks a
                  driver for it -- install the token's driver. (Linux libcastle
                  talks USB directly, so PC/SC is not checked there.)
"""

import os
import re
import subprocess
import sys

TOKEN_VENDOR_IDS = (0x096E, 0x2CCF)
IS_MAC = sys.platform == "darwin"
IS_WIN = os.name == "nt"


def _run(cmd, timeout=15):
    from linux_setup import _subprocess_env

    kwargs = {"creationflags": 0x08000000} if IS_WIN else {}  # no console window
    out = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout,
                         env=_subprocess_env(), **kwargs)
    return out.stdout


def usb_tokens():
    """List of 'VID:PID name' strings for plugged-in HYP2003-family tokens."""
    found = []
    if IS_MAC:
        # One "+-o" block per device; properties follow on their own lines.
        for block in _run(["ioreg", "-p", "IOUSB", "-l", "-w0"]).split("+-o ")[1:]:
            vid = re.search(r'"idVendor" = (\d+)', block)
            if vid and int(vid.group(1)) in TOKEN_VENDOR_IDS:
                pid = re.search(r'"idProduct" = (\d+)', block)
                name = block.split("@")[0].strip()
                found.append(f"{int(vid.group(1)):04x}:{int(pid.group(1)) if pid else 0:04x} {name}")
    elif IS_WIN:
        ps = ("Get-PnpDevice -PresentOnly | Where-Object { $_.InstanceId -match "
              "'VID_(096E|2CCF)' } | ForEach-Object { $_.InstanceId + ' ' + $_.FriendlyName }")
        found = [line.strip() for line in
                 _run(["powershell", "-NoProfile", "-Command", ps]).splitlines() if line.strip()]
    else:
        from linux_setup import plugged_token_devices

        found = plugged_token_devices()
    return found


def pcsc_readers():
    """(reader_names, error). Windows/macOS only; returns (None, reason) elsewhere."""
    import ctypes

    if IS_WIN:
        lib = ctypes.WinDLL("winscard")
        ctx_t, dword, long_t = ctypes.c_size_t, ctypes.c_uint32, ctypes.c_int32
        list_readers = lib.SCardListReadersA
    elif IS_MAC:
        lib = ctypes.CDLL("/System/Library/Frameworks/PCSC.framework/PCSC")
        ctx_t, dword, long_t = ctypes.c_int32, ctypes.c_uint32, ctypes.c_int32
        list_readers = lib.SCardListReaders
    else:
        return None, "not checked on Linux (token library uses USB directly)"

    lib.SCardEstablishContext.argtypes = [dword, ctypes.c_void_p, ctypes.c_void_p,
                                          ctypes.POINTER(ctx_t)]
    lib.SCardEstablishContext.restype = long_t
    list_readers.argtypes = [ctx_t, ctypes.c_char_p, ctypes.c_char_p, ctypes.POINTER(dword)]
    list_readers.restype = long_t
    lib.SCardReleaseContext.argtypes = [ctx_t]

    ctx = ctx_t()
    rv = lib.SCardEstablishContext(2, None, None, ctypes.byref(ctx))  # SCARD_SCOPE_SYSTEM
    if rv & 0xFFFFFFFF == 0x8010001D:  # SCARD_E_NO_SERVICE: no reader -> service idle
        return [], None
    if rv:
        return None, f"smart-card service error 0x{rv & 0xFFFFFFFF:08X}"
    try:
        size = dword(0)
        rv = list_readers(ctx, None, None, ctypes.byref(size))
        if rv & 0xFFFFFFFF == 0x8010002E:  # SCARD_E_NO_READERS_AVAILABLE
            return [], None
        if rv:
            return None, f"smart-card service error 0x{rv & 0xFFFFFFFF:08X}"
        buf = ctypes.create_string_buffer(size.value)
        rv = list_readers(ctx, None, buf, ctypes.byref(size))
        if rv:
            return None, f"smart-card service error 0x{rv & 0xFFFFFFFF:08X}"
        return [n.decode(errors="replace") for n in buf.raw[:size.value].split(b"\0") if n], None
    finally:
        lib.SCardReleaseContext(ctx)


def report_lines():
    """Self-test lines describing USB + PC/SC state."""
    lines = []
    try:
        usb = usb_tokens()
        lines.append("[INFO] HYP2003 token on USB: " + ("; ".join(usb) if usb else "not seen"))
    except Exception as e:  # noqa: BLE001
        lines.append(f"[INFO] HYP2003 token on USB: could not check ({e})")
    if IS_WIN or IS_MAC:
        try:
            readers, err = pcsc_readers()
            lines.append("[INFO] Smart-card readers seen by the OS: "
                         + (err if err else ("; ".join(readers) if readers else "none")))
        except Exception as e:  # noqa: BLE001
            lines.append(f"[INFO] Smart-card readers seen by the OS: could not check ({e})")
    return lines


def no_token_hint() -> str:
    """Plain-language next step when the token library reports no token."""
    try:
        usb = usb_tokens()
    except Exception:  # noqa: BLE001
        usb = None
    if usb == []:
        return ("The token is not visible on USB: re-plug it (try another USB port), "
                "then click Detect.")
    if IS_WIN or IS_MAC:
        try:
            readers, _ = pcsc_readers()
        except Exception:  # noqa: BLE001
            readers = None
        os_name = "macOS" if IS_MAC else "Windows"
        if readers == []:
            return (f"The token is plugged in, but {os_name} does not recognise it as a "
                    "smart-card reader. Install the HYP2003 driver from your CA / "
                    "Hypersecu once, re-plug the token, then click Detect.")
        if readers:
            return ("Smart-card reader found (" + "; ".join(readers) + ") but no token "
                    "in it was readable. Re-plug the token, then click Detect.")
    return "Re-plug the token, then click Detect."
