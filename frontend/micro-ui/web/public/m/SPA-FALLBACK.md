# Mobile PWA — SPA fallback config

The PWA at `/m/` is a Next.js static export. Dynamic routes (`/m/cases/:filingNumber`,
`/m/hearing/:hearingId`) don't have pre-rendered HTML — they need the web server to
serve `/m/index.html` for any path under `/m/*` that isn't an existing file.

## Production (nginx)

```
location /m/ {
  try_files $uri $uri/ /m/index.html;
}
```

## Production (Apache .htaccess)

```
RewriteEngine On
RewriteBase /m/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

## Local dev (react-scripts)

`react-scripts start` doesn't easily support per-path fallback. For local testing,
navigate to `/m/` (the landing page) and use in-app navigation rather than
cold-loading a dynamic URL. The dynamic route placeholders
(`/m/cases/__placeholder__/index.html`, etc.) exist as Next.js build artifacts —
ignore them.

If full deep-link testing is needed locally, you can add a `setupProxy.js` middleware
that returns `/m/index.html` for unknown `/m/*` paths.
