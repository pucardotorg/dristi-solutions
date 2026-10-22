"""
Why is the DSC token not found? Checks independent of the vendor library:

  usb_tokens()    is a known DSC token visible on USB at all? (by USB vendor
                  ID: HYP2003/ePass2003 = Feitian/Hypersecu, ProxKey = WatchData)
  pcsc_readers()  does the OS smart-card service (PC/SC) see it as a reader?
                  The Windows and macOS token libraries talk to the token
                  through PC/SC, so "on USB but no reader" means the OS lacks a
                  driver for it -- install the token's driver. (Linux libcastle
                  talks USB directly, so PC/SC is not checked there.)
"""

import glob
import os
import re
import subprocess
import sys

# USB vendor ID -> token family, for messages.
TOKEN_VENDORS = {
    0x096E: "HYP2003/ePass2003 (Feitian)",
    0x2CCF: "HYP2003 (Hypersecu)",
    0x163C: "ProxKey (WatchData)",
}
TOKEN_VENDOR_IDS = tuple(TOKEN_VENDORS)
IS_MAC = sys.platform == "darwin"
IS_WIN = os.name == "nt"


def _run(cmd, timeout=15):
    from linux_setup import _subprocess_env

    kwargs = {"creationflags": 0x08000000} if IS_WIN else {}  # no console window
    out = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout,
                         env=_subprocess_env(), **kwargs)
    if out.returncode != 0:
        # A failed check must not read as "no token" (e.g. PowerShell blocked).
        raise RuntimeError((out.stderr or out.stdout or f"exit {out.returncode}").strip()[:200])
    return out.stdout


def usb_tokens():
    """'VID:PID family' strings for plugged-in known DSC tokens. Raises if the
    check itself could not run (callers report "could not check", not "none")."""
    found = []
    if IS_MAC:
        # One "+-o" block per device; properties follow on their own lines.
        for block in _run(["ioreg", "-p", "IOUSB", "-l", "-w0"]).split("+-o ")[1:]:
            vid = re.search(r'"idVendor" = (\d+)', block)
            if vid and int(vid.group(1)) in TOKEN_VENDORS:
                v = int(vid.group(1))
                pid = re.search(r'"idProduct" = (\d+)', block)
                found.append(f"{v:04x}:{int(pid.group(1)) if pid else 0:04x} "
                             f"{TOKEN_VENDORS[v]} ({block.split('@')[0].strip()})")
    elif IS_WIN:
        vids = "|".join(f"{v:04X}" for v in TOKEN_VENDORS)
        ps = ("Get-PnpDevice -PresentOnly | Where-Object { $_.InstanceId -match "
              f"'VID_({vids})' }} | ForEach-Object {{ $_.InstanceId + ' ' + $_.FriendlyName }}")
        for line in _run(["powershell", "-NoProfile", "-Command", ps]).splitlines():
            m = re.search(r"VID_([0-9A-F]{4})", line, re.I)
            if m:
                found.append(f"{TOKEN_VENDORS.get(int(m.group(1), 16), '?')}: {line.strip()}")
    else:
        for vid_file in glob.glob("/sys/bus/usb/devices/*/idVendor"):
            try:
                with open(vid_file) as fh:
                    v = int(fh.read().strip(), 16)
                if v in TOKEN_VENDORS:
                    with open(os.path.join(os.path.dirname(vid_file), "idProduct")) as fh:
                        found.append(f"{v:04x}:{fh.read().strip()} {TOKEN_VENDORS[v]}")
            except (OSError, ValueError):
                continue
    # Same device can appear several times (USB device + its interfaces).
    return sorted(set(found))


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
        lines.append("[INFO] Known DSC token on USB: " + ("; ".join(usb) if usb else "none seen"))
    except Exception as e:  # noqa: BLE001
        lines.append(f"[INFO] Known DSC token on USB: could not check ({e})")
    if IS_WIN or IS_MAC:
        try:
            readers, err = pcsc_readers()
            lines.append("[INFO] Smart-card readers seen by the OS: "
                         + (err if err else ("; ".join(readers) if readers else "none")))
        except Exception as e:  # noqa: BLE001
            lines.append(f"[INFO] Smart-card readers seen by the OS: could not check ({e})")
    return lines


def no_token_hint() -> str:
    """Plain-language next step when no token library found a token."""
    readers = None
    if IS_WIN or IS_MAC:
        try:
            readers, _ = pcsc_readers()
        except Exception:  # noqa: BLE001
            readers = None
    if readers:
        # The OS sees a token reader (its name usually shows the brand), but no
        # library we have could read it: that brand's driver is missing.
        return ("The computer sees a token reader (" + "; ".join(readers) + ") but none of "
                "the token libraries on this computer could read it. Install the driver "
                "for this token's brand (from your CA), re-plug the token, then click Detect.")
    try:
        usb = usb_tokens()
    except Exception:  # noqa: BLE001 - check failed: do not claim "not visible"
        usb = None
    if usb:
        os_name = "macOS" if IS_MAC else "Windows"
        if IS_WIN or IS_MAC:
            fix = ("Install the token driver once (macOS: the app's 'Set up' button, or the "
                   "token's macOS driver from your CA)" if IS_MAC else
                   "Install the token's driver from your CA once")
            return (f"The token is plugged in ({'; '.join(usb)}), but {os_name} does not "
                    f"recognise it as a smart-card reader. {fix}, re-plug the token, then "
                    "click Detect.")
        return "The token is plugged in but could not be read. Re-plug it, then click Detect."
    if usb == []:
        return ("No DSC token found on USB (looked for HYP2003/ePass2003 and ProxKey): "
                "re-plug it (try another USB port), then click Detect. Other brands need "
                "their driver installed.")
    return "Re-plug the token, then click Detect."
