# Polyglot Suite Portal

The landing page and navigation directory for the **Polyglot Suite** monorepo.

> [!IMPORTANT]
> **AI-Generated Documentation Notice**  
> **Human Review Status:** `To be reviewed`  
> This documentation was generated with AI assistance and may contain inaccuracies. Please verify with the codebase and primary sources.

---

## Overview

The **Suite Portal** is a lightweight, static SvelteKit application that serves as the root entry point (`dist/index.html`) for the entire Polyglot Suite. It provides:
- A directory of all active text readers, lexical search engines, and linguistic tools.
- Dynamic URL resolution across local development, GitHub Pages, and production VPS environments.
- Integration links for external tools, such as the Gospel Synoptic Viewer.
- Backward-compatible redirect pages for historical standalone reader URLs.

---

## Configuration (`src/lib/portal.json`)

The portal directory is driven by `src/lib/portal.json`. Each entry defines metadata, badges, and routing flags:

```json
{
  "appsEnabled": [
    "polyglot-bible-reader",
    "biblical-lexeme-explorer",
    "ancient-corpora-reader",
    "synoptic-viewer"
  ],
  "appsInfo": {
    "polyglot-bible-reader": {
      "title": "Polyglot Bible Reader",
      "description": "...",
      "tags": ["Hebrew MT (WLC)", "Greek LXX", "..."],
      "slug": "bible",
      "externalApp": false
    },
    "synoptic-viewer": {
      "title": "Synoptic Viewer",
      "description": "...",
      "tags": ["NT", "Gospels", "Synopsis"],
      "slug": "synopsis",
      "externalApp": true,
      "url": "https://synopsis.texts.faith"
    }
  }
}
```

### Routing & URL Resolution

At build time, `src/routes/+page.server.ts` computes the destination URL for each application card:
1. **External Applications (`externalApp: true`)**: Uses the external URL directly (e.g., `https://synopsis.texts.faith`).
2. **Local Monorepo Readers (`externalApp: false`)**:
   - In GitHub Pages / static mode: defaults to the relative subpath (e.g., `/bible/`, `/corpora/`, `/lexemes/`).
   - In production VPS mode: reads environment overrides from `.env.deploy` (e.g., `PUBLIC_SUITE_BIBLE_APP_URL`) or falls back to relative subpaths.

---

## Legacy URL Redirects (`static/`)

To preserve existing scholarly citations and bookmarks from before the consolidation into Ancient Corpora Reader, `static/` contains static HTML meta-refresh forwarders:
- `static/philo/index.html` &rarr; redirects to `/corpora/philo/opif/1`
- `static/fathers/index.html` &rarr; redirects to `/corpora/af/1-clem/1`
- `static/josephus/index.html` &rarr; redirects to `/corpora/josephus/war/1`

These files are copied directly to `dist/` during static build, preventing HTTP 404 errors for legacy bookmarks.

---

## Development & Building

Run commands from the repository root:

```bash
# Start local development server (port 5170)
npm run dev:portal

# Run Svelte and TypeScript type checking
npm run check:portal

# Build static bundle for production distribution
npm run build:www:portal
```

### Staged VPS Deployment (`scripts/deploy_portal.sh`)

For production VPS hosting, `scripts/deploy_portal.sh` automates atomic releases:
```bash
# Deploy to staging directory
npm run deploy:portal

# Promote staging to active production web symlink
npm run deploy:portal:promote
# or shorthand:
npm run dpp

# Roll back to the previous release snapshot
npm run deploy:portal:rollback

# View deployment release history
npm run deploy:portal:history
```
