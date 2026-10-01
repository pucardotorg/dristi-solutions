"""
One-time Linux setup so a normal (non-root) user can use the DSC token.

The HYP2003 / ePass2003 PKCS#11 library (libcastle_v2.so) talks to the token
over USB directly -- it does NOT need pcscd. What it needs is write access to the
token's USB device node, which Linux gives only to root by default. The vendor's
own config.sh fixes this with a udev rule; we install the same rule, with a
graphical password prompt (pkexec) so staff never open a terminal.

Windows needs none of this (the built-in Smart Card service is used).
"""

import glob
import os
import shutil
import subprocess
import sys
import tempfile
import time

# USB vendor IDs from the vendor's config.sh: 096e = Feitian (HYP2003/ePass2003
# hardware), 2ccf = Hypersecu.
TOKEN_VENDOR_IDS = ("096e", "2ccf")
RULES_PATH = "/etc/udev/rules.d/60-oncourts-dsc-token.rules"
RULES = "".join(
    f'SUBSYSTEM=="usb", ATTR{{idVendor}}=="{v}", MODE="0666"\n' for v in TOKEN_VENDOR_IDS
)

_SETUP_SCRIPT = (
    'install -m 0644 "$1" "$2" && udevadm control --reload-rules && '
    + " && ".join(f"udevadm trigger --subsystem-match=usb --attr-match=idVendor={v}"
                  for v in TOKEN_VENDOR_IDS)
)


def is_linux() -> bool:
    return sys.platform.startswith("linux")


def plugged_token_devices():
    """USB device nodes (/dev/bus/usb/BBB/DDD) of plugged-in tokens."""
    devices = []
    for vid_file in glob.glob("/sys/bus/usb/devices/*/idVendor"):
        try:
            with open(vid_file) as fh:
                if fh.read().strip().lower() not in TOKEN_VENDOR_IDS:
                    continue
            base = os.path.dirname(vid_file)
            with open(os.path.join(base, "busnum")) as fh:
                bus = int(fh.read())
            with open(os.path.join(base, "devnum")) as fh:
                dev = int(fh.read())
            devices.append(f"/dev/bus/usb/{bus:03d}/{dev:03d}")
        except (OSError, ValueError):
            continue
    return devices


def _rules_installed() -> bool:
    # Ours, or the vendor's own config.sh rules.
    return os.path.exists(RULES_PATH) or bool(glob.glob("/etc/udev/rules.d/HYP2003_token*.rules"))


def needs_usb_setup() -> bool:
    """True if the current user cannot (or, with no token plugged in, will not
    be able to) open the DSC token over USB."""
    if not is_linux():
        return False
    devices = plugged_token_devices()
    if devices:
        return not all(os.access(d, os.R_OK | os.W_OK) for d in devices)
    return not _rules_installed()


def usb_status() -> str:
    """One-line description for the self-test report."""
    if not is_linux():
        return "not needed on this OS"
    devices = plugged_token_devices()
    if devices:
        ok = all(os.access(d, os.R_OK | os.W_OK) for d in devices)
        return f"token plugged in ({', '.join(devices)}), " + ("access OK" if ok else "NO ACCESS -- setup needed")
    return "rule installed" if _rules_installed() else "setup needed (no rule installed yet)"


def _subprocess_env():
    """Environment for system tools. A PyInstaller binary points LD_LIBRARY_PATH
    at its bundled libraries, which can break system programs like pkexec."""
    env = dict(os.environ)
    env.pop("PKCS11_USER_PIN", None)
    if getattr(sys, "frozen", False):
        orig = env.pop("LD_LIBRARY_PATH_ORIG", None)
        if orig is not None:
            env["LD_LIBRARY_PATH"] = orig
        else:
            env.pop("LD_LIBRARY_PATH", None)
    return env


# Same setup as a pasteable command (terminal fallback / admin instructions).
MANUAL_COMMAND = (
    "printf '%s\\n' " + " ".join(f"'{line}'" for line in RULES.splitlines())
    + f" | sudo tee {RULES_PATH} >/dev/null && sudo udevadm control --reload-rules"
    + " && sudo udevadm trigger --subsystem-match=usb"
)

_TERMINALS = (
    ("x-terminal-emulator", "-e"),
    ("gnome-terminal", "--"),
    ("konsole", "-e"),
    ("xfce4-terminal", "-x"),
    ("mate-terminal", "-x"),
    ("xterm", "-e"),
)


def run_usb_setup():
    """
    Install the udev rule as root. Uses pkexec (graphical password prompt) and
    falls back to a terminal running sudo. Returns (ok, message).
    """
    with tempfile.NamedTemporaryFile("w", prefix="oncourts-dsc-", suffix=".rules",
                                     delete=False) as fh:
        fh.write(RULES)
        rules_tmp = fh.name
    os.chmod(rules_tmp, 0o644)
    env = _subprocess_env()
    try:
        if shutil.which("pkexec"):
            proc = subprocess.run(
                ["pkexec", "/bin/sh", "-c", _SETUP_SCRIPT, "sh", rules_tmp, RULES_PATH],
                env=env, capture_output=True, text=True)
            if proc.returncode == 0:
                return True, "DSC token access set up."
            if proc.returncode == 126:
                return False, "Setup cancelled (password dialog was closed)."
            # 127 = no polkit agent / not authorised -> try a terminal instead.

        for term, flag in _TERMINALS:
            if shutil.which(term):
                inner = (MANUAL_COMMAND + " && echo && echo 'Done. You can close this window.'"
                         " || echo 'Setup failed.'; read -r -p 'Press Enter to close' _")
                subprocess.Popen([term, flag, "bash", "-c", inner], env=env)
                # Some terminals return at once (the window lives on), so wait
                # for the rule file rather than for the process (max 5 min).
                deadline = time.time() + 300
                while time.time() < deadline and not _rules_installed():
                    time.sleep(1)
                if _rules_installed():
                    return True, "DSC token access set up."
                return False, "Setup did not complete in the terminal."

        return False, ("Could not open a password prompt. Ask your administrator to "
                       "run this once in a terminal:\n\n" + MANUAL_COMMAND)
    finally:
        try:
            os.unlink(rules_tmp)
        except OSError:
            pass
