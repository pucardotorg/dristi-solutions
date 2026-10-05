"""
Where the app's files live, per OS / packaging.

  APP_DIR      the folder the user sees: next to the exe (Windows/Linux), the
               folder containing OncourtsBulkSign.app (macOS), or the source dir.
  SEARCH_DIRS  where .env, court-seal.png and the token library are looked up:
               APP_DIR first (lets an admin drop files beside the app), then --
               macOS only -- the files bundled INSIDE the .app. macOS may run a
               downloaded app from a hidden read-only copy ("App Translocation")
               that has none of the files beside it, so the .app carries its own.
  DATA_DIR     writable folder for the test certificate and self-test report:
               APP_DIR, except macOS where it is ~/Library/Application Support/
               OnCourts Bulk Sign (the .app may be read-only).
"""

import os
import sys

FROZEN = getattr(sys, "frozen", False)
IS_MAC = sys.platform == "darwin"

if FROZEN:
    _exe_dir = os.path.dirname(os.path.abspath(sys.executable))
    # .../OncourtsBulkSign.app/Contents/MacOS -> the folder holding the .app
    if IS_MAC and _exe_dir.endswith(os.path.join(".app", "Contents", "MacOS")):
        APP_DIR = os.path.dirname(os.path.dirname(os.path.dirname(_exe_dir)))
    else:
        APP_DIR = _exe_dir
else:
    APP_DIR = os.path.dirname(os.path.abspath(__file__))

# Files bundled inside the macOS .app (PyInstaller's sys._MEIPASS).
BUNDLE_DIR = getattr(sys, "_MEIPASS", None) if (FROZEN and IS_MAC) else None

SEARCH_DIRS = [APP_DIR] + ([BUNDLE_DIR] if BUNDLE_DIR else [])

if FROZEN and IS_MAC:
    DATA_DIR = os.path.join(os.path.expanduser("~"), "Library", "Application Support",
                            "OnCourts Bulk Sign")
else:
    DATA_DIR = APP_DIR


def ensure_data_dir() -> str:
    os.makedirs(DATA_DIR, exist_ok=True)
    return DATA_DIR


def find_file(name: str) -> str:
    """First existing `name` in SEARCH_DIRS; else the APP_DIR path (for messages)."""
    for d in SEARCH_DIRS:
        p = os.path.join(d, name)
        if os.path.exists(p):
            return p
    return os.path.join(APP_DIR, name)
