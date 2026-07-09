"""
OnCourts Bulk Sign -- desktop app for court staff.

A tiny window so non-technical staff can run the bulk-sign agent without any
terminal or Python commands:

    1. Plug in the DSC token.
    2. Open this app, type the token PIN, click START.
    3. Do the bulk signing in the browser as usual.
    4. Click STOP when done (or just close the window).

It embeds the same FastAPI agent (app.py) and runs it on http://localhost:1620,
exactly what the court frontend's BULK_SIGN_URL points to. The token module path
and certificate labels come from .env (an admin sets that up once per machine);
staff only ever enter the PIN.
"""

import logging
import os
import queue
import sys
import threading
import time
import tkinter as tk
from tkinter import messagebox, scrolledtext, ttk

# Run from the app's own folder so .env (and, when running from source, app.py /
# pyhanko_signer.py) resolve -- including when launched by double-click or from a
# PyInstaller bundle. For a frozen build, the folder is where the executable lives
# (sys.executable), so staff drop a .env next to OncourtsBulkSign(.exe).
if getattr(sys, "frozen", False):
    APP_DIR = os.path.dirname(os.path.abspath(sys.executable))
else:
    APP_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(APP_DIR)

try:
    from dotenv import load_dotenv

    load_dotenv(os.path.join(APP_DIR, ".env"))
except Exception:
    pass

import uvicorn

HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "1620"))
MODE = os.environ.get("SIGNER_MODE", "software").lower()
SIGN_URL = f"http://{HOST}:{PORT}"

# Brand-ish palette (matches the court app's teal).
TEAL = "#007E7E"
RED = "#BB2C2F"
GREY = "#5a6b73"
BG = "#f4f6f8"


class _ThreadedServer(uvicorn.Server):
    """uvicorn server that can run off the main thread (no signal handlers)."""

    def install_signal_handlers(self):  # noqa: D401 - intentionally a no-op
        pass


class _QueueLogHandler(logging.Handler):
    def __init__(self, q: "queue.Queue[str]"):
        super().__init__()
        self.q = q

    def emit(self, record):
        try:
            self.q.put(self.format(record))
        except Exception:
            pass


class BulkSignApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.server = None
        self.thread = None
        self.log_queue: "queue.Queue[str]" = queue.Queue()

        root.title("OnCourts Bulk Sign")
        root.configure(bg=BG)
        root.geometry("520x580")
        root.minsize(480, 520)

        self._build_ui()
        self._setup_logging()
        self.root.after(150, self._drain_log)
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)
        if MODE == "pkcs11":
            # Read the token identity on launch (no PIN needed).
            self.root.after(300, self.detect_token)

    # ----- UI ---------------------------------------------------------------
    def _build_ui(self):
        wrap = tk.Frame(self.root, bg=BG, padx=22, pady=18)
        wrap.pack(fill="both", expand=True)

        tk.Label(wrap, text="OnCourts Bulk Sign", bg=BG, fg=TEAL,
                 font=("Segoe UI", 18, "bold")).pack(anchor="w")
        tk.Label(wrap, text="Sign court documents in bulk using your DSC token.",
                 bg=BG, fg=GREY, font=("Segoe UI", 10)).pack(anchor="w", pady=(0, 12))

        # DSC token panel (pkcs11 mode): shows the detected token cert + label,
        # read without a PIN, so staff can see/confirm the token identity.
        if MODE == "pkcs11":
            self.token_var = tk.StringVar(value="DSC token: checking…")
            tbox = tk.Frame(wrap, bg="#eef5f5", bd=1, relief="solid")
            tbox.pack(fill="x", pady=(0, 12))
            inner = tk.Frame(tbox, bg="#eef5f5", padx=10, pady=8)
            inner.pack(fill="x")
            tk.Label(inner, textvariable=self.token_var, bg="#eef5f5", fg="#1a2b34",
                     font=("Segoe UI", 9), justify="left", anchor="w").pack(
                side="left", fill="x", expand=True)
            self.detect_btn = tk.Button(inner, text="Detect", command=self.detect_token,
                                        bg="#dcebeb", fg=TEAL, relief="flat",
                                        font=("Segoe UI", 9, "bold"), cursor="hand2", padx=10)
            self.detect_btn.pack(side="right", anchor="n")

        # Status pill
        self.status_var = tk.StringVar(value="● Stopped")
        self.status_lbl = tk.Label(wrap, textvariable=self.status_var, bg=BG, fg=RED,
                                    font=("Segoe UI", 12, "bold"))
        self.status_lbl.pack(anchor="w", pady=(0, 14))

        # PIN row (pkcs11 only)
        self.pin_var = tk.StringVar()
        if MODE == "pkcs11":
            row = tk.Frame(wrap, bg=BG)
            row.pack(fill="x", pady=(0, 12))
            tk.Label(row, text="DSC token PIN", bg=BG, fg="#1a2b34",
                     font=("Segoe UI", 10, "bold")).pack(anchor="w")
            self.pin_entry = tk.Entry(row, textvariable=self.pin_var, show="•",
                                      font=("Segoe UI", 12), relief="solid", bd=1)
            self.pin_entry.pack(fill="x", ipady=5, pady=(4, 0))
            self.pin_entry.bind("<Return>", lambda e: self.start())
        else:
            tk.Label(wrap, text="Running in TEST (software) mode -- no PIN needed.",
                     bg=BG, fg=GREY, font=("Segoe UI", 10, "italic")).pack(anchor="w", pady=(0, 12))

        # Buttons
        btns = tk.Frame(wrap, bg=BG)
        btns.pack(fill="x", pady=(2, 12))
        self.start_btn = tk.Button(btns, text="START", command=self.start,
                                   bg=TEAL, fg="white", activebackground="#016a6a",
                                   activeforeground="white", relief="flat",
                                   font=("Segoe UI", 11, "bold"), padx=24, pady=8,
                                   cursor="hand2")
        self.start_btn.pack(side="left")
        self.stop_btn = tk.Button(btns, text="STOP", command=self.stop,
                                  bg=RED, fg="white", activebackground="#962023",
                                  activeforeground="white", relief="flat",
                                  font=("Segoe UI", 11, "bold"), padx=24, pady=8,
                                  cursor="hand2", state="disabled")
        self.stop_btn.pack(side="left", padx=(10, 0))

        # Activity log
        tk.Label(wrap, text="Activity", bg=BG, fg=GREY,
                 font=("Segoe UI", 9, "bold")).pack(anchor="w")
        self.log = scrolledtext.ScrolledText(wrap, height=9, font=("Consolas", 9),
                                             relief="solid", bd=1, state="disabled",
                                             bg="#ffffff", wrap="word")
        self.log.pack(fill="both", expand=True, pady=(4, 0))

        self._log(f"Ready. Mode: {MODE}. The browser will reach this app at {SIGN_URL}")

    # ----- logging ----------------------------------------------------------
    def _setup_logging(self):
        handler = _QueueLogHandler(self.log_queue)
        handler.setFormatter(logging.Formatter("%(asctime)s  %(message)s", "%H:%M:%S"))
        root_logger = logging.getLogger()
        root_logger.setLevel(logging.INFO)
        root_logger.addHandler(handler)
        # uvicorn loggers propagate to root once their own handlers are cleared.
        for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
            lg = logging.getLogger(name)
            lg.handlers.clear()
            lg.propagate = True

    def _drain_log(self):
        try:
            while True:
                line = self.log_queue.get_nowait()
                self.log.configure(state="normal")
                self.log.insert("end", line + "\n")
                self.log.see("end")
                self.log.configure(state="disabled")
        except queue.Empty:
            pass
        self.root.after(150, self._drain_log)

    def _log(self, msg: str):
        self.log_queue.put(msg)

    # ----- token detection --------------------------------------------------
    def detect_token(self):
        if MODE != "pkcs11":
            return
        self.detect_btn.configure(state="disabled")
        self.token_var.set("DSC token: checking…")
        threading.Thread(target=self._detect_worker, daemon=True).start()

    def _detect_worker(self):
        try:
            from pyhanko_signer import resolve_app_path

            module_path = resolve_app_path(os.environ.get("PKCS11_MODULE_PATH", ""))
            if not module_path:
                raise RuntimeError("PKCS11_MODULE_PATH is not set in .env")
            from token_utils import list_token_identities

            ids = list_token_identities(module_path)
            self.root.after(0, lambda: self._on_token_detected(ids, None))
        except Exception as e:  # noqa: BLE001 - show any failure in the panel
            err = str(e)  # `e` is cleared when the except block exits
            self.root.after(0, lambda: self._on_token_detected(None, err))

    def _on_token_detected(self, ids, err):
        self.detect_btn.configure(state="normal")
        if err is not None:
            self.token_var.set(f"DSC token: could not read — {err}")
            return
        if not ids:
            self.token_var.set("DSC token: none detected — plug it in, then click Detect.")
            return
        if len(ids) == 1:
            i = ids[0]
            cn = i.get("cn") or "(no common name)"
            self.token_var.set(f"DSC token: {cn}\nCertificate label: {i['cert_label']}")
        else:
            lines = "\n".join(
                f"  • {i.get('cn') or '(no CN)'}  [{i['cert_label']}]" for i in ids
            )
            self.token_var.set(
                f"DSC token: {len(ids)} certificates found — set PKCS11_CERT_LABEL in .env:\n{lines}"
            )

    # ----- start / stop -----------------------------------------------------
    def start(self):
        if self.server is not None:
            return
        if MODE == "pkcs11":
            pin = self.pin_var.get().strip()
            if not pin:
                messagebox.showwarning("PIN required", "Please enter your DSC token PIN.")
                return
            os.environ["PKCS11_USER_PIN"] = pin

        self.start_btn.configure(state="disabled")
        self._set_status("● Starting…", GREY)
        threading.Thread(target=self._start_worker, daemon=True).start()

    def _start_worker(self):
        try:
            if MODE == "software":
                # Zero-setup testing: make the self-signed cert if it's missing.
                from gen_test_cert import ensure_test_cert

                ensure_test_cert(
                    os.environ.get("SIGNER_P12_PATH", "test-cert.p12"),
                    os.environ.get("SIGNER_P12_PASSWORD", "test").encode("utf-8"),
                )
            if MODE == "pkcs11":
                self._log("Checking token and PIN…")
                from pyhanko_signer import validate_signer

                cn = validate_signer()
                self._log(f"Token OK{f' — {cn}' if cn else ''}.")

            from app import app

            config = uvicorn.Config(app, host=HOST, port=PORT, log_level="info",
                                    log_config=None)
            self.server = _ThreadedServer(config)
            self.thread = threading.Thread(target=self.server.run, daemon=True)
            self.thread.start()

            # Wait until uvicorn reports it has started (or the thread dies).
            for _ in range(100):
                if getattr(self.server, "started", False) or not self.thread.is_alive():
                    break
                time.sleep(0.1)

            if not getattr(self.server, "started", False):
                raise RuntimeError("Server failed to start (is port "
                                   f"{PORT} already in use?)")

            self.root.after(0, self._on_started)
        except Exception as e:  # noqa: BLE001 - surface any startup failure to the user
            os.environ.pop("PKCS11_USER_PIN", None)
            self.server = None
            self.thread = None
            # Capture as a string: the `except` var `e` is cleared when the block
            # exits, so a lambda referencing it later would NameError.
            err = str(e)
            self.root.after(0, lambda: self._on_start_failed(err))

    def _on_started(self):
        # Don't keep the PIN on screen once we're signing.
        self.pin_var.set("")
        self._set_status("● Running — ready to sign", TEAL)
        self.stop_btn.configure(state="normal")
        self._log(f"Running. Keep this window open and sign in the browser. ({SIGN_URL})")

    def _on_start_failed(self, err: Exception):
        self._set_status("● Stopped", RED)
        self.start_btn.configure(state="normal")
        self.stop_btn.configure(state="disabled")
        self._log(f"Could not start: {err}")
        messagebox.showerror("Could not start",
                             f"{err}\n\nCheck the token is plugged in and the PIN is correct.")

    def stop(self):
        if self.server is None:
            return
        self.stop_btn.configure(state="disabled")
        self._set_status("● Stopping…", GREY)
        self.server.should_exit = True
        threading.Thread(target=self._stop_worker, daemon=True).start()

    def _stop_worker(self):
        if self.thread is not None:
            self.thread.join(timeout=10)
        os.environ.pop("PKCS11_USER_PIN", None)
        self.server = None
        self.thread = None
        self.root.after(0, self._on_stopped)

    def _on_stopped(self):
        self._set_status("● Stopped", RED)
        self.start_btn.configure(state="normal")
        self.stop_btn.configure(state="disabled")
        self._log("Stopped.")

    def _set_status(self, text: str, color: str):
        self.status_var.set(text)
        self.status_lbl.configure(fg=color)

    # ----- window close -----------------------------------------------------
    def _on_close(self):
        if self.server is not None:
            if not messagebox.askokcancel(
                "Quit", "Signing service is running. Stop it and quit?"
            ):
                return
            self.server.should_exit = True
            if self.thread is not None:
                self.thread.join(timeout=10)
            os.environ.pop("PKCS11_USER_PIN", None)
        self.root.destroy()


def main():
    root = tk.Tk()
    try:
        ttk.Style().theme_use("clam")
    except Exception:
        pass
    BulkSignApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
