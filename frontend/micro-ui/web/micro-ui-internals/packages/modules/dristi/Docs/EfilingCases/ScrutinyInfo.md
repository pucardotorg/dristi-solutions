# Code Documentation

This document explains the functionality, purpose, and usage of the provided code.

---

### `handleAddError`

#### Purpose:

- SrutinyInfo component is used to show inputs/sections marked by FSO

#### Code:

```javascript
function ScrutinyInfo({ config, t }) {
  return (
    <div style={{ backgroundColor: "#fce8e8", marginBottom: 8, padding: 6, borderRadius: 5 }}>
      <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "10px", marginBottom: 8 }}>
        <FSOErrorIcon />
        <div style={{ fontWeight: 700 }}>{t("CS_FSO_MARKED_ERROR")}</div>
      </div>
      {t(config.populators.scrutinyMessage)}
    </div>
  );
}
```
