# Maintenance mode

**Status: ON.** Every page redirects to [coming-soon.html](coming-soon.html).

Nothing was deleted. All the real pages are still in the repo and still
deployed — they are simply unreachable, because Vercel applies `redirects`
before it looks at the filesystem.

## Turning the site back on

Delete the `redirects` block from [vercel.json](vercel.json):

```json
"redirects": [
  {
    "source": "/:path((?!coming-soon|api/|assets/|favicon|robots).*)",
    "destination": "/coming-soon.html",
    "permanent": false
  }
],
```

Commit and push. That is the entire revert — one block, nothing else.

## What stays reachable while it is off

The redirect skips these prefixes, so they keep working:

| Path | Why |
| --- | --- |
| `/coming-soon.html` | the holding page itself — excluding it prevents a redirect loop |
| `/api/…` | lead capture and the CSV export keep working |
| `/assets/…` | the favicon and any images the holding page needs |
| `/favicon…`, `/robots.txt` | browser and crawler basics |

Everything else — `/`, `/index.html`, `/about.html`, every service page —
answers `307` to the holding page.

## A note on search rankings

The redirect is **temporary** (`"permanent": false` → HTTP 307), which tells
Google to keep the original URLs indexed rather than replacing them. The
holding page also carries `<meta name="robots" content="noindex, follow">` so
it does not get indexed in their place.

That combination is right for days or a couple of weeks. If the site will be
down for **months**, serve an HTTP `503` with a `Retry-After` header instead —
that is the signal Google actually wants for extended downtime, and it protects
rankings better than a redirect.
