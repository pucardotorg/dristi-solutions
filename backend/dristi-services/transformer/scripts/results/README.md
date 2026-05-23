# Per-order results

`update_orders.py` writes three files here per processed order:

| File                              | What it contains                                   |
| --------------------------------- | -------------------------------------------------- |
| `{orderNumber}.before.json`       | Order as returned by `/order/v1/search`            |
| `{orderNumber}.after.json`        | Order as returned by the final `_updateOrder` call |
| `{orderNumber}.diff.txt`          | Unified diff (before vs. after, pretty JSON)       |

The `before.json` is written right after the order is fetched, so it exists
even if a later step fails. `after.json` and `diff.txt` are only written when
the final `SUBMIT_BULK_E-SIGN` update succeeds.

The actual JSON/diff files are gitignored — they contain live order data.
