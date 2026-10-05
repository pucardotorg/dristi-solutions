"""
The one-time, per-computer setup the DSC token needs on this OS, behind one
interface for the app window:

  Linux  -- USB access for the user (udev rule; linux_setup.py)
  macOS  -- the token's smart-card reader driver (vendor installer; mac_setup.py)
  Windows-- nothing (the token library works as-is)

Only applies to the HYP2003/ePass2003 "castle" library that we bundle.
"""

import os

import linux_setup
import mac_setup


def _is_castle(module_path) -> bool:
    return bool(module_path) and "castle" in os.path.basename(module_path).lower()


def needs_setup(module_path) -> bool:
    if not _is_castle(module_path):
        return False
    if linux_setup.is_linux():
        return linux_setup.needs_usb_setup()
    if mac_setup.is_mac():
        return mac_setup.needs_driver_setup()
    return False


def run_setup():
    """Returns (ok, message)."""
    if mac_setup.is_mac():
        return mac_setup.run_driver_setup()
    return linux_setup.run_usb_setup()


def panel_text() -> str:
    if mac_setup.is_mac():
        return ("DSC token: one-time setup needed -- the token's driver is not installed "
                "on this Mac. Click 'Set up' to install it (asks for your Mac password).")
    return ("DSC token: one-time setup needed so this app can use the token on this "
            "computer. Click 'Set up' (asks for your computer password).")


def prompt_text() -> str:
    if mac_setup.is_mac():
        return ("This Mac needs the DSC token's driver, installed once.\n\n"
                "The macOS Installer will open: click Continue, Agree and Install, and "
                "enter your Mac password when asked. Then unplug and re-plug the token.\n\n"
                "Install it now?")
    return ("This computer needs a one-time setup before the DSC token can be used.\n\n"
            "You will be asked for your computer (login) password.\n\nSet it up now?")


def progress_text() -> str:
    if mac_setup.is_mac():
        return "DSC token: complete the driver installer that opened, then re-plug the token…"
    return "DSC token: setting up… enter your computer password if asked."


def status_lines():
    """Self-test lines for this OS's one-time setup."""
    if linux_setup.is_linux():
        return [f"[INFO] Linux USB access for DSC token: {linux_setup.usb_status()}"]
    if mac_setup.is_mac():
        return [f"[INFO] macOS token driver ({mac_setup.DRIVER_BUNDLE}): "
                f"{mac_setup.driver_status()}"]
    return []
