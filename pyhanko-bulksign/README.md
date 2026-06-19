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
| `PKCS11_CERT_LABEL` / `PKCS11_KEY_LABEL` | object labels on the token (`pkcs11-tool --module <so> -O`) |
| `PKCS11_USER_PIN` | token PIN — prefer passing interactively via `run.sh` |
| `SIGNER_P12_PATH` / `SIGNER_P12_PASSWORD` | software-mode key file |
| `SIGN_STAMP_TEXT` | visible signature text (`%(signer)s`, `%(ts)s`) |
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
