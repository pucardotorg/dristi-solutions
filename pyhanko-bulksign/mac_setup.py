"""
One-time macOS setup: install the HYP2003 token's smart-card reader driver.

The macOS token library (libcastle_v2.1.0.0.dylib) talks to the token through
the macOS smart-card service (PC/SC). macOS's built-in reader driver does not
recognise the HYP2003, so the vendor ships its own (ifd-FeiTccid.bundle); without
it the token is "plugged in but not a smart-card reader" (verified on an Intel
Mac: detected only after installing the vendor package).

We bundle the vendor's own signed installer package (the exact one tested) and
open it in the macOS Installer -- the normal, password-protected way to install
a driver -- instead of copying driver files ourselves.
"""

import os
import subprocess
import sys
import time

DRIVER_BUNDLE = "/usr/local/libexec/SmartCardServices/drivers/ifd-FeiTccid.bundle"
DRIVER_PKG = "HYP2003-India-driver.pkg"   # bundled by build_app_mac.sh


def is_mac() -> bool:
    return sys.platform == "darwin"


def driver_installed() -> bool:
    return os.path.isdir(DRIVER_BUNDLE)


def needs_driver_setup() -> bool:
    return is_mac() and not driver_installed()


def driver_status() -> str:
    if not is_mac():
        return "not needed on this OS"
    return "installed" if driver_installed() else "NOT installed -- setup needed"


def _bundled_pkg():
    from app_paths import find_file

    p = find_file(DRIVER_PKG)
    return p if os.path.isfile(p) else None


def run_driver_setup(wait_s: int = 900):
    """Open the bundled vendor installer and wait until the driver appears.
    Returns (ok, message)."""
    pkg = _bundled_pkg()
    if not pkg:
        return False, ("The token driver installer is not included in this copy of the app. "
                       "Install the HYP2003 macOS driver from your CA (HYP2003-MAC-iOS-"
                       "FIPS140-3.zip -> the .pkg inside), re-plug the token, click Detect.")
    from linux_setup import _subprocess_env

    try:
        subprocess.run(["open", pkg], check=True, env=_subprocess_env())
    except (OSError, subprocess.CalledProcessError) as e:
        return False, f"Could not open the driver installer: {e}"

    deadline = time.time() + wait_s
    while time.time() < deadline:
        if driver_installed():
            return True, ("Token driver installed. Unplug the DSC token, plug it back in, "
                          "then click Detect.")
        time.sleep(2)
    return False, ("The driver installer was not completed. Click 'Set up' to open it "
                   "again and follow its steps (Continue -> Agree -> Install).")
