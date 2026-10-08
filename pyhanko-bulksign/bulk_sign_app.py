"""
OnCourts Bulk Sign -- desktop app for court staff.

A tiny window so non-technical staff can run the bulk-sign agent without any
terminal or Python commands:

    1. Plug in the DSC token.
    2. Open this app, type the token PIN, click START.
    3. Do the bulk signing in the browser as usual.
    4. Click STOP when done (or just close the window).

It embeds the same FastAPI agent (app.py) and runs it on http://localhost:1620,
exactly what the court frontend's BULK_SIGN_URL points to. The token library is
found automatically (next to the exe, or the vendor's install folder); .env can
override it. Staff only ever enter the PIN. Signing always uses the DSC token.

Headless check (used by the CI build, and handy on a new machine):
    OncourtsBulkSign --selftest   -> selftest-result.txt next to the exe
"""

import logging
import os
import queue
import sys
import threading
import time

# Folders per OS/packaging (see app_paths): .env sits next to the exe, or inside
# the .app on macOS; relative writable files (test-cert.p12) go to DATA_DIR, so
# run from there -- including when launched by double-click.
from app_paths import DATA_DIR, SEARCH_DIRS, ensure_data_dir

os.chdir(ensure_data_dir())

try:
    from dotenv import load_dotenv

    # First found wins (load_dotenv never overrides): beside the app, then bundled.
    for _d in SEARCH_DIRS:
        load_dotenv(os.path.join(_d, ".env"))
except Exception:
    pass

HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "1620"))
SIGN_URL = f"http://{HOST}:{PORT}"

# Brand-ish palette (matches the court app's teal).
TEAL = "#007E7E"
RED = "#BB2C2F"
GREY = "#5a6b73"
BG = "#f4f6f8"
PANEL = "#eef5f5"


def _needs_os_setup(module_path) -> bool:
    """The per-computer setup this OS needs for the bundled token library
    (Linux: USB access; macOS: reader driver) is not done yet."""
    import os_setup

    return os_setup.needs_setup(module_path)


def _reveal_file(path):
    """Show the file in Finder / Explorer / the file manager (best effort)."""
    import subprocess

    try:
        from linux_setup import _subprocess_env

        if sys.platform == "darwin":
            cmd = ["open", "-R", path]
        elif os.name == "nt":
            cmd = ["explorer", f"/select,{path}"]
        else:
            cmd = ["xdg-open", os.path.dirname(path)]
        subprocess.Popen(cmd, env=_subprocess_env())
    except Exception:
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
    def __init__(self, root):
        import tkinter as tk

        self.tk = tk
        self.root = root
        self.server = None
        self.thread = None
        self.log_queue: "queue.Queue[str]" = queue.Queue()
        self._setup_offered = False

        root.title("OnCourts Bulk Sign")
        root.configure(bg=BG)
        root.geometry("540x640")
        root.minsize(500, 580)

        self._build_ui()
        self._setup_logging()
        self.root.after(150, self._drain_log)
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)
        self.detect_token()

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

        # DSC token panel (read without a PIN) + PIN box.
        self.dsc_frame = tk.Frame(wrap, bg=BG)
        self.dsc_frame.pack(fill="x")
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

    def _set_controls_running(self, running: bool):
        state = "disabled" if running else "normal"
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
        self.detect_btn.configure(text="Detect", command=self.detect_token, state="disabled")
        self.token_var.set("DSC token: checking…")
        threading.Thread(target=self._detect_worker, daemon=True).start()

    def _detect_worker(self):
        module_path = None
        try:
            from pyhanko_signer import prepare_module_dir, require_pkcs11_module

            module_path = require_pkcs11_module()
            if _needs_os_setup(module_path):
                self.root.after(0, self._on_setup_needed)
                return
            prepare_module_dir(module_path)
            from token_utils import list_token_identities_safe

            ids = list_token_identities_safe(module_path)
            hint = ""
            if not ids:
                import diagnostics

                hint = diagnostics.no_token_hint()
            self.root.after(0, lambda: self._on_token_detected(module_path, ids, None, hint))
        except Exception as e:  # noqa: BLE001 - show any failure in the panel
            err = str(e)  # `e` is cleared when the except block exits
            self.root.after(0, lambda: self._on_token_detected(module_path, None, err))

    def _on_token_detected(self, module_path, ids, err, hint=""):
        self.detect_btn.configure(state="normal")
        lib = f"\nLibrary: {module_path}" if module_path else ""
        if err is not None:
            self.token_var.set(f"DSC token: could not read — {err}")
            self._log(f"Token check failed: {err}")
            return
        if not ids:
            self.token_var.set(f"DSC token: none found. {hint or 'Plug it in, then click Detect.'}{lib}")
            if hint:
                self._log(f"No DSC token found: {hint}")
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

    # ----- one-time per-computer setup (Linux USB access / macOS driver) ----
    def _on_setup_needed(self):
        from tkinter import messagebox

        import os_setup

        self.token_var.set(os_setup.panel_text())
        self.detect_btn.configure(text="Set up", command=self.os_setup, state="normal")
        if not self._setup_offered:
            # Offer it automatically the first time; the button stays for later.
            self._setup_offered = True
            if messagebox.askyesno("One-time setup", os_setup.prompt_text()):
                self.os_setup()

    def os_setup(self):
        import os_setup

        self.detect_btn.configure(state="disabled")
        self.token_var.set(os_setup.progress_text())
        self._log("Running one-time DSC token setup…")
        threading.Thread(target=self._setup_worker, daemon=True).start()

    def _setup_worker(self):
        import os_setup

        try:
            ok, msg = os_setup.run_setup()
        except Exception as e:  # noqa: BLE001 - report, keep the button usable
            ok, msg = False, f"Setup failed: {e}"
        self.root.after(0, lambda: self._on_setup_done(ok, msg))

    def _on_setup_done(self, ok, msg):
        from tkinter import messagebox

        self._log(msg)
        if ok:
            messagebox.showinfo("Setup complete", msg)
            self.detect_token()
        else:
            self._on_setup_needed()
            messagebox.showwarning("Setup not completed", msg)

    # ----- start / stop -----------------------------------------------------
    def start(self):
        from tkinter import messagebox

        if self.server is not None:
            return
        pin = self.pin_var.get().strip()
        if not pin:
            messagebox.showwarning("PIN required", "Please enter your DSC token PIN.")
            return
        os.environ["PKCS11_USER_PIN"] = pin
        # Always the DSC token, whatever an old .env says (the signer and the
        # /health endpoint read the mode from the environment).
        os.environ["SIGNER_MODE"] = "pkcs11"

        self._set_controls_running(True)
        self.stop_btn.configure(state="disabled")
        self._set_status("● Starting…", GREY)
        threading.Thread(target=self._start_worker, daemon=True).start()

    def _start_worker(self):
        try:
            import uvicorn

            self._log("Checking token and PIN…")
            from pyhanko_signer import find_pkcs11_module, validate_signer

            if _needs_os_setup(find_pkcs11_module()[0]):
                raise RuntimeError("One-time DSC token setup is not done on this "
                                   "computer yet. Click 'Set up' in the token box first.")

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
        result_path = os.path.join(DATA_DIR, "selftest-result.txt")
        self._log(f"Report file: {result_path}")
        try:
            import selftest

            # Lines appear in the Activity box as each check runs.
            selftest.main(result_path, on_line=self._log)
            self._log(f"Saved to {result_path}")
            _reveal_file(result_path)
        except Exception as e:  # noqa: BLE001 - never leave the buttons disabled
            self._log(f"Self-test could not run: {e}")
        finally:
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

        code, _ = selftest.main(os.path.join(DATA_DIR, "selftest-result.txt"))
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
