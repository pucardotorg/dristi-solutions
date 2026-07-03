# pyhanko-bulksign — PUCAR bulk-sign agent

A local signing agent that **replaces the proprietary Capricorn `pkiNetworkSign`
desktop agent** for bulk signing of court documents (orders, bail bonds, CTC,
witness depositions, …). Built on [pyHanko](https://github.com/MatthiasValvekens/pyHanko).

It is a **drop-in**: it speaks the exact same HTTP contract the court frontend
already uses against Capricorn at `localhost:1620`, so **no frontend or backend code
change is required** — only the `BULK_SIGN_URL` config is repointed at this agent.

> Status: productionized from the verified PoC at
> `compare-test/signing-alternatives/pyhanko-poc` (see its `POC-KNOWLEDGE.md`).
> Real-token signing verified on a Hypersecu HYP2003 DSC token via the vendor's
> `libcastle_v2.so` PKCS#11 module.

---

## Desktop app for court staff (no terminal / Python needed)

`bulk_sign_app.py` is a small window so non-technical staff never touch a command
line. It embeds the agent and shows: a **PIN box**, **START** / **STOP** buttons, a
status light, and an activity log.

**Daily use (staff):**
1. Plug in the DSC token.
2. Open **PUCAR Bulk Sign**.
3. Type the token **PIN** → click **START** (status turns green = "ready to sign").
4. Do the bulk signing in the browser as usual.
5. Click **STOP** (or close the window) when finished.

**One-time setup (admin/IT), two options:**

- *Option A — packaged executable (best for staff machines, no Python at all):*
  build once per OS → a **self-contained folder**, then copy that whole folder to
  each machine.
  ```bash
  # Linux  -> dist/linux/   (bundles the token .so if PKCS11_MODULE_SRC is set)
  PKCS11_MODULE_SRC=/path/to/vendor.so ./build_app.sh
  # Windows -> dist\windows\
  set PKCS11_MODULE_SRC=C:\path\to\vendor.dll && build_app.bat
  ```
  Each folder holds **everything**: the binary, `.env`, `court-seal.png`, and the
  vendor PKCS#11 module. `.env` refers to the module and seal by **bare filename**
  (resolved next to the exe), so nothing has machine-specific absolute paths. Copy
  the folder, double-click the binary. (PyInstaller is not a cross-compiler: build
  the Windows folder on Windows, the Linux folder on Linux.)

- *Option B — run from source (needs Python on the machine):*
  ```bash
  ./run_app.sh          # Linux/macOS  (needs: sudo apt install python3-tk)
  run_app.bat           # Windows      (python.org Python includes Tkinter)
  ```
  First launch auto-creates the venv and installs deps, then opens the window.
  For a double-click icon on Linux, copy `PucarBulkSign.desktop.example` →
  `PucarBulkSign.desktop`, set its `Exec=` path, and mark it "Allow Launching".

Either way the app listens on `http://localhost:1620` — the same `BULK_SIGN_URL`
the frontend already uses. STOP shuts the service down cleanly.

**Test vs token mode:** `.env` ships set to **TEST mode** (`SIGNER_MODE=software`,
no token — the app auto-creates a self-signed `test-cert.p12` on first START), so
you can try the whole build → double-click flow immediately. To use a real DSC
token, edit `.env`: set `SIGNER_MODE=pkcs11` and uncomment the `PKCS11_*` block
with this machine's module path + labels. The token PIN is never stored; the app
prompts for it.

**Finding the token labels (any new DSC pendrive):** you don't have to. In pkcs11
mode the app reads the token under the title and shows the certificate + label
(no PIN needed). Leave `PKCS11_CERT_LABEL`/`PKCS11_KEY_LABEL` **blank** in `.env`
and the app auto-uses a single-identity token — plug in a new pendrive and it works.
(Set the label explicitly only if a token carries several certificates.)

The sections below describe the underlying agent (HTTP contract, CLI run, config)
for developers; staff only need the app above.

---

## Windows setup

Same app, built for Windows. PyInstaller is not a cross-compiler, so the `.exe`
must be built **on Windows**.

**Prerequisites (Windows machine):**
1. Install the **DSC token vendor's Windows driver/middleware** (this is the key
   step). It provides the PC/SC driver *and* the **PKCS#11 `.dll`** (e.g. HyperPKI/
   `castle` for HYP2003; ePass2003 / WatchData / SafeNet have their own). Find the
   `.dll` afterwards (often `C:\Windows\System32\<vendor>.dll` or the vendor's
   install folder). OpenSC does **not** work with Indian-CA tokens.
2. Install **Python 3.10+** from python.org (includes Tkinter) — needed only to
   *build* the exe.

**Build + configure:**
1. Get the code on the machine (clone the repo + `git checkout pyhanko-bulk-sign-poc`,
   or copy the `pyhanko-bulksign\` folder).
2. In `pyhanko-bulksign\`, point `PKCS11_MODULE_SRC` at the vendor `.dll` and build:
   ```
   set PKCS11_MODULE_SRC=C:\Windows\System32\<vendor-pkcs11>.dll
   build_app.bat
   ```
   → a self-contained **`dist\windows\`** with `PucarBulkSign.exe`, `.env`,
   `court-seal.png`, and the vendor `.dll` copied in.
3. Edit **`dist\windows\.env`** — everything is a **bare filename** (no absolute paths):
   ```
   SIGNER_MODE=pkcs11
   PKCS11_MODULE_PATH=<vendor-pkcs11>.dll   # the file now sitting in this folder
   PKCS11_CERT_LABEL=                        # blank -> auto-detect
   PKCS11_KEY_LABEL=
   SIGN_STAMP_IMAGE=court-seal.png
   SIGN_STAMP_OPACITY=0.3
   ```
4. Copy the whole **`dist\windows\`** folder to each machine. Double-click the exe →
   the DSC-token panel shows the label → PIN → **START** → bulk-sign in the browser.

**Windows gotchas:** module path is the **`.dll`** (not the Linux `.so`); SmartScreen
may warn on the unsigned exe ("More info → Run anyway"); allow the firewall prompt for
`localhost:1620`; install the token driver before first run.

---

## How it fits the existing bulk-sign flow

Nothing about the court app's flow changes. For reference, the unchanged path is:

```
BulkESignView.js (browser, court domain)
   │  for each selected order:
   │    POST  BULK_SIGN_URL  (= http://localhost:1620)
   │    body: application/x-www-form-urlencoded   response=<pkiNetworkSign XML>
   ▼
pyhanko-bulksign agent (this service, on the signing machine)
   │    parse XML -> base64 PDF + (page, cood=x,y, size=w,h)
   │    pyHanko signs with the DSC token (PKCS#11), visible signature at those coords
   ▼
   <response><status>ok</status><data>BASE64 signed PDF</data><error/></response>
   │
BulkESignView.js -> orderManagementService.updateSignedOrders(...)  (unchanged)
```

The XML request is produced by `order-management` `BSSService.createOrderToSignRequest`
(`/v1/_getOrdersToSign`); the signed result is consumed by `/v1/_updateSignedOrders`.
Both are unchanged.

Because the DSC token is physical, this agent **must run on the machine where the
token is plugged in** (the judge's PC) — exactly like Capricorn. The browser reaches
it at `http://localhost:1620` (a cross-origin request the agent allows via CORS).

---

## The contract (identical to Capricorn)

**Request** — `POST /`, `application/x-www-form-urlencoded`, field `response` = the
`pkiNetworkSign` XML: `<pdf>{<page>, <cood>x,y, <size>w,h}</pdf>` + base64 `<data>`.

**Response** — `application/xml`, read by the frontend's `parseXml(data, …)`:
```xml
<response><status>ok</status><data>BASE64_SIGNED_PDF</data><error></error></response>
<response><status>failed</status><data></data><error>message</error></response>
```
`status` ≠ `failed` ⇒ the order is marked signed.

---

## Run it

Prereqs: Python 3.10+. For real signing: the DSC token + its **vendor** PKCS#11
library (OpenSC does **not** work with Indian-CA personalized tokens — see
POC-KNOWLEDGE.md).

```bash
cp .env.example .env          # fill in PKCS11_MODULE_PATH + PKCS11_CERT_LABEL/KEY_LABEL

# Real DSC token (prompts for the PIN, never stored):
./run.sh                      # Linux/macOS
run.bat                       # Windows (judges' machines)

# Software mode for testing without a token (self-signed cert):
./run.sh software
```

Verify end-to-end (agent running):
```bash
./.venv/bin/python test_client.py        # -> signed-out.pdf
./.venv/bin/python validate.py signed-out.pdf
```

---

## Production cutover

1. Install + run this agent on each signing machine, listening on `:1620`
   (replacing the Capricorn agent).
2. Point the frontend at it by setting `BULK_SIGN_URL` in the environment's
   `globalConfigs.js` to `http://localhost:1620` (the in-code fallback is already
   `http://localhost:1620`, so for local-agent deployments no change may be needed).
3. Restrict `CORS_ALLOW_ORIGINS` in `.env` to the court web origin(s).

---

## Configuration (`.env`)

| Var | Meaning |
|---|---|
| `SIGNER_MODE` | `pkcs11` (DSC token, prod) or `software` (test `.p12`) |
| `PKCS11_MODULE_PATH` | path to the token vendor's PKCS#11 `.so`/`.dll` |
| `PKCS11_CERT_LABEL` / `PKCS11_KEY_LABEL` | token object labels; **blank = auto-detect** a single-identity token (shown under the app title) |
| `PKCS11_USER_PIN` | token PIN — prefer passing interactively via `run.sh` |
| `SIGNER_P12_PATH` / `SIGNER_P12_PASSWORD` | software-mode key file |
| `SIGN_STAMP_TEXT` | visible signature text (`%(signer)s`, `%(ts)s`) |
| `SIGN_STAMP_IMAGE` / `SIGN_STAMP_OPACITY` | seal image (bare filename resolved next to the exe/.env; default `court-seal.png`) + opacity 0..1 |
| `HOST` / `PORT` | bind address (default `127.0.0.1:1620`) |
| `CORS_ALLOW_ORIGINS` | allowed browser origin(s); `*` for local testing |

---

## Known items still owed before full production (from POC-KNOWLEDGE.md)

- **Coordinate y-axis**: this agent maps `cood=x,y` + `size=w,h` → pyHanko box
  `(x, y, x+w, y+h)` (origin bottom-left). Verify against a **real order PDF** that
  the signature lands where the `Signature` placeholder is; if `e-sign-svc
  /_getLocation` uses a top-left origin, flip `y` in `pyhanko_signer.sign_pdf_bytes`.
- **Trusted chain (CCA roots)**: signatures are cryptographically intact but show as
  `UNTRUSTED` until the India CCA root + CA intermediates are loaded into a validation
  context. Trust-store config, not a code change.
- **RFC-3161 timestamp (TSA) / PAdES-LTV**: currently uses the local clock; add a TSA
  for long-term validity.
- **Per-request token session**: each request opens/logs-in/closes a PKCS#11 session.
  Fine for current bulk volumes; can be pooled if needed. The PIN is entered once at
  agent startup, so bulk signing does not re-prompt per order.
