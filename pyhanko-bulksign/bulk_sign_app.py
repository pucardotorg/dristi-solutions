"""
OnCourts Bulk Sign -- desktop app for court staff.

A tiny window so non-technical staff can run the bulk-sign agent without any
terminal or Python commands:

    1. Plug in the DSC token.
    2. Open this app, choose "DSC token" (or "Test mode" to try it without a
       token), type the token PIN, click START.
    3. Do the bulk signing in the browser as usual.
    4. Click STOP when done (or just close the window).

It embeds the same FastAPI agent (app.py) and runs it on http://localhost:1620,
exactly what the court frontend's BULK_SIGN_URL points to. The token library is
found automatically (next to the exe, or the vendor's install folder); .env can
override it. Staff only ever pick the mode and enter the PIN.

Headless check (used by the CI build, and handy on a new machine):
    OncourtsBulkSign --selftest   -> selftest-result.txt next to the exe
"""

import logging
import os
import queue
import sys
import threading
import time

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

HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "1620"))
SIGN_URL = f"http://{HOST}:{PORT}"

MODE_DSC = "pkcs11"
MODE_TEST = "software"
# The mode is chosen in the window; .env SIGNER_MODE only sets the default choice.
DEFAULT_MODE = MODE_TEST if os.environ.get("SIGNER_MODE", "").lower() == MODE_TEST else MODE_DSC

# Brand-ish palette (matches the court app's teal).
TEAL = "#007E7E"
RED = "#BB2C2F"
GREY = "#5a6b73"
BG = "#f4f6f8"
PANEL = "#eef5f5"


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
    def __init__(self, root):
        import tkinter as tk

        self.tk = tk
        self.root = root
        self.server = None
        self.thread = None
        self.log_queue: "queue.Queue[str]" = queue.Queue()
        self.mode_var = tk.StringVar(value=DEFAULT_MODE)

        root.title("OnCourts Bulk Sign")
        root.configure(bg=BG)
        root.geometry("540x640")
        root.minsize(500, 580)

        self._build_ui()
        self._setup_logging()
        self.root.after(150, self._drain_log)
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)
        self._on_mode_changed()

    @property
    def mode(self) -> str:
        return self.mode_var.get()

    # ----- UI ---------------------------------------------------------------
    def _build_ui(self):
        tk = self.tk
        from tkinter import scrolledtext

        wrap = tk.Frame(self.root, bg=BG, padx=22, pady=18)
        wrap.pack(fill="both", expand=True)

        tk.Label(wrap, text="OnCourts Bulk Sign", bg=BG, fg=TEAL,
                 font=("Segoe UI", 18, "bold")).pack(anchor="w")
        tk.Label(wrap, text="Sign court documents in bulk using your DSC token.",
                 bg=BG, fg=GREY, font=("Segoe UI", 10)).pack(anchor="w", pady=(0, 12))

        # Mode choice: real DSC token, or test mode with a built-in test certificate.
        tk.Label(wrap, text="Signing mode", bg=BG, fg="#1a2b34",
                 font=("Segoe UI", 10, "bold")).pack(anchor="w")
        modes = tk.Frame(wrap, bg=BG)
        modes.pack(fill="x", pady=(2, 10))
        self.mode_radios = []
        for value, label in ((MODE_DSC, "DSC token (real signing)"),
                             (MODE_TEST, "Test mode (no token, test certificate)")):
            rb = tk.Radiobutton(modes, text=label, value=value, variable=self.mode_var,
                                command=self._on_mode_changed, bg=BG,
                                activebackground=BG, font=("Segoe UI", 10), anchor="w")
            rb.pack(anchor="w")
            self.mode_radios.append(rb)

        # Mode-specific area: rebuilt on mode change, kept above the status pill.
        self.mode_area = tk.Frame(wrap, bg=BG)
        self.mode_area.pack(fill="x")

        # DSC widgets (shown in DSC mode). Token panel is read without a PIN.
        self.dsc_frame = tk.Frame(self.mode_area, bg=BG)
        self.token_var = tk.StringVar(value="DSC token: checking…")
        tbox = tk.Frame(self.dsc_frame, bg=PANEL, bd=1, relief="solid")
        tbox.pack(fill="x", pady=(0, 12))
        inner = tk.Frame(tbox, bg=PANEL, padx=10, pady=8)
        inner.pack(fill="x")
        tk.Label(inner, textvariable=self.token_var, bg=PANEL, fg="#1a2b34",
                 font=("Segoe UI", 9), justify="left", anchor="w",
                 wraplength=380).pack(side="left", fill="x", expand=True)
        self.detect_btn = tk.Button(inner, text="Detect", command=self.detect_token,
                                    bg="#dcebeb", fg=TEAL, relief="flat",
                                    font=("Segoe UI", 9, "bold"), cursor="hand2", padx=10)
        self.detect_btn.pack(side="right", anchor="n")

        self.pin_var = tk.StringVar()
        tk.Label(self.dsc_frame, text="DSC token PIN", bg=BG, fg="#1a2b34",
                 font=("Segoe UI", 10, "bold")).pack(anchor="w")
        self.pin_entry = tk.Entry(self.dsc_frame, textvariable=self.pin_var, show="•",
                                  font=("Segoe UI", 12), relief="solid", bd=1)
        self.pin_entry.pack(fill="x", ipady=5, pady=(4, 12))
        self.pin_entry.bind("<Return>", lambda e: self.start())

        # Test-mode note (shown in test mode).
        self.test_frame = tk.Frame(self.mode_area, bg=BG)
        tk.Label(self.test_frame,
                 text="TEST mode: signs with a built-in test certificate (shown as\n"
                      "untrusted in Adobe). Use only to check the setup.",
                 bg=BG, fg=GREY, font=("Segoe UI", 10, "italic"),
                 justify="left").pack(anchor="w", pady=(0, 12))

        # Status pill
        self.status_var = tk.StringVar(value="● Stopped")
        self.status_lbl = tk.Label(wrap, textvariable=self.status_var, bg=BG, fg=RED,
                                   font=("Segoe UI", 12, "bold"))
        self.status_lbl.pack(anchor="w", pady=(0, 14))

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
        self.selftest_btn = tk.Button(btns, text="Self-test", command=self.selftest,
                                      bg="#dcebeb", fg=TEAL, relief="flat",
                                      font=("Segoe UI", 10, "bold"), padx=12, pady=8,
                                      cursor="hand2")
        self.selftest_btn.pack(side="right")

        # Activity log
        tk.Label(wrap, text="Activity", bg=BG, fg=GREY,
                 font=("Segoe UI", 9, "bold")).pack(anchor="w")
        self.log = scrolledtext.ScrolledText(wrap, height=9, font=("Consolas", 9),
                                             relief="solid", bd=1, state="disabled",
                                             bg="#ffffff", wrap="word")
        self.log.pack(fill="both", expand=True, pady=(4, 0))

        self._log(f"Ready. The browser will reach this app at {SIGN_URL}")

    def _on_mode_changed(self):
        self.dsc_frame.pack_forget()
        self.test_frame.pack_forget()
        if self.mode == MODE_DSC:
            self.dsc_frame.pack(fill="x")
            self.detect_token()
        else:
            self.test_frame.pack(fill="x")

    def _set_controls_running(self, running: bool):
        state = "disabled" if running else "normal"
        for rb in self.mode_radios:
            rb.configure(state=state)
        self.selftest_btn.configure(state=state)
        self.start_btn.configure(state=state)
        self.stop_btn.configure(state="normal" if running else "disabled")

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
        if self.mode != MODE_DSC:
            return
        self.detect_btn.configure(state="disabled")
        self.token_var.set("DSC token: checking…")
        threading.Thread(target=self._detect_worker, daemon=True).start()

    def _detect_worker(self):
        module_path = None
        try:
            from pyhanko_signer import prepare_module_dir, require_pkcs11_module

            module_path = require_pkcs11_module()
            prepare_module_dir(module_path)
            from token_utils import list_token_identities

            ids = list_token_identities(module_path)
            self.root.after(0, lambda: self._on_token_detected(module_path, ids, None))
        except Exception as e:  # noqa: BLE001 - show any failure in the panel
            err = str(e)  # `e` is cleared when the except block exits
            self.root.after(0, lambda: self._on_token_detected(module_path, None, err))

    def _on_token_detected(self, module_path, ids, err):
        self.detect_btn.configure(state="normal")
        lib = f"\nLibrary: {module_path}" if module_path else ""
        if err is not None:
            self.token_var.set(f"DSC token: could not read — {err}")
            self._log(f"Token check failed: {err}")
            return
        if not ids:
            self.token_var.set(f"DSC token: none detected — plug it in, then click Detect.{lib}")
            return
        if len(ids) == 1:
            i = ids[0]
            cn = i.get("cn") or "(no common name)"
            self.token_var.set(f"DSC token: {cn}\nCertificate label: {i['cert_label']}{lib}")
        else:
            lines = "\n".join(
                f"  • {i.get('cn') or '(no CN)'}  [{i['cert_label']}]" for i in ids
            )
            self.token_var.set(
                f"DSC token: {len(ids)} certificates found — set PKCS11_CERT_LABEL in .env:\n{lines}{lib}"
            )

    # ----- start / stop -----------------------------------------------------
    def start(self):
        from tkinter import messagebox

        if self.server is not None:
            return
        mode = self.mode
        if mode == MODE_DSC:
            pin = self.pin_var.get().strip()
            if not pin:
                messagebox.showwarning("PIN required", "Please enter your DSC token PIN.")
                return
            os.environ["PKCS11_USER_PIN"] = pin
        # The signer and the /health endpoint read the mode from the environment.
        os.environ["SIGNER_MODE"] = mode

        self._set_controls_running(True)
        self.stop_btn.configure(state="disabled")
        self._set_status("● Starting…", GREY)
        threading.Thread(target=self._start_worker, args=(mode,), daemon=True).start()

    def _start_worker(self, mode):
        try:
            import uvicorn

            if mode == MODE_TEST:
                # Zero-setup testing: make the self-signed cert if it's missing.
                from gen_test_cert import ensure_test_cert

                ensure_test_cert(
                    os.environ.get("SIGNER_P12_PATH", "test-cert.p12"),
                    os.environ.get("SIGNER_P12_PASSWORD", "test").encode("utf-8"),
                )
                self._log("TEST mode: using the built-in test certificate.")
            else:
                self._log("Checking token and PIN…")
                from pyhanko_signer import validate_signer

                cn = validate_signer()
                self._log(f"Token OK{f' — {cn}' if cn else ''}.")

            from app import ThreadedServer, app

            config = uvicorn.Config(app, host=HOST, port=PORT, log_level="info",
                                    log_config=None)
            self.server = ThreadedServer(config)
            self.thread = threading.Thread(target=self.server.run, daemon=True)
            self.thread.start()

            # Wait until uvicorn reports it has started (or the thread dies).
            for _ in range(100):
                if getattr(self.server, "started", False) or not self.thread.is_alive():
                    break
                time.sleep(0.1)

            if not getattr(self.server, "started", False):
                raise RuntimeError(f"Server failed to start. Is port {PORT} already in use "
                                   "(for example by Capricorn)? Close it and try again.")

            self.root.after(0, lambda: self._on_started(mode))
        except Exception as e:  # noqa: BLE001 - surface any startup failure to the user
            os.environ.pop("PKCS11_USER_PIN", None)
            self.server = None
            self.thread = None
            # Capture as a string: the `except` var `e` is cleared when the block
            # exits, so a lambda referencing it later would NameError.
            err = str(e)
            self.root.after(0, lambda: self._on_start_failed(err))

    def _on_started(self, mode):
        # Don't keep the PIN on screen once we're signing.
        self.pin_var.set("")
        label = "TEST mode" if mode == MODE_TEST else "DSC token"
        self._set_status(f"● Running ({label}) — ready to sign", TEAL)
        self.stop_btn.configure(state="normal")
        self._log(f"Running. Keep this window open and sign in the browser. ({SIGN_URL})")

    def _on_start_failed(self, err: str):
        from tkinter import messagebox

        self._set_status("● Stopped", RED)
        self._set_controls_running(False)
        self._log(f"Could not start: {err}")
        messagebox.showerror("Could not start", err)

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
        self._set_controls_running(False)
        self._log("Stopped.")

    def _set_status(self, text: str, color: str):
        self.status_var.set(text)
        self.status_lbl.configure(fg=color)

    # ----- self-test --------------------------------------------------------
    def selftest(self):
        if self.server is not None:
            return
        self._set_controls_running(True)
        self.stop_btn.configure(state="disabled")
        self._log("Running self-test…")
        threading.Thread(target=self._selftest_worker, daemon=True).start()

    def _selftest_worker(self):
        import selftest

        result_path = os.path.join(APP_DIR, "selftest-result.txt")
        _, lines = selftest.main(result_path)
        for line in lines:
            self._log(line)
        self._log(f"Saved to {result_path}")
        self.root.after(0, lambda: self._set_controls_running(False))

    # ----- window close -----------------------------------------------------
    def _on_close(self):
        from tkinter import messagebox

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
    if "--selftest" in sys.argv:
        import selftest

        code, _ = selftest.main(os.path.join(APP_DIR, "selftest-result.txt"))
        sys.exit(code)

    import tkinter as tk
    from tkinter import ttk

    root = tk.Tk()
    try:
        ttk.Style().theme_use("clam")
    except Exception:
        pass
    BulkSignApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
