# Pre-prepared itemText files

`update_orders.py` looks in this directory for one file per orderNumber and
uses its contents as the new `itemText` for that order.

## File naming

For an order with `orderNumber = KL-CR-2024-001234`, create one of:

- `KL-CR-2024-001234.html` (preferred)
- `KL-CR-2024-001234.htm`
- `KL-CR-2024-001234.txt`

The first matching file is used.

## What goes inside

The full HTML body that should become `itemText`. Whatever you put in this
file is sent verbatim (a trailing newline is stripped). Prepare it in any
editor you like — VS Code, Sublime, browser-based HTML editor, etc.

## How the script behaves

**File present →** used silently. Log: `Using prepared text from ...`.

**File missing →** the script does NOT open vi/nano in the terminal. Instead:

1. It writes a starter file at `texts/{orderNumber}.html` containing the
   current itemText.
2. It pauses with a prompt like:

   ```
   ──────────────────────────────────────────────────────────────────────
     Order KL-... has no prepared text file.
     Starter file created with the current itemText:
       /.../scripts/texts/KL-....html

     1. Open that file in your editor (VS Code / Sublime / browser).
     2. Edit the HTML and SAVE.
     3. Come back here and press Enter to continue.
        (Type 's' + Enter to skip this order, 'q' + Enter to quit.)
   ──────────────────────────────────────────────────────────────────────
   Ready? [Enter=continue / s=skip / q=quit]:
   ```

3. You edit the file in your real editor, save it, return to the terminal,
   press Enter. The script re-reads the file and continues.

Pass `--require-prepared` to skip orders without a file rather than pausing.

## Up-front coverage summary

Before any HTTP calls, the script prints which orders have a file and which
will pause:

```
Prepared text coverage: 8/10 orders have a file in .../texts
2 order(s) have no prepared file (will pause so you can edit a starter file in your IDE): ORD-X, ORD-Y
```

so you can prepare everything in one shot before the run.
