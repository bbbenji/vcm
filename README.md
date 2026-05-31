# Wirtualna Mata

Vue/Vite app for creating, sharing, and exporting virtual coding mats.

## Requirements

- Node.js 24 (`fnm use 24`)
- Bun 1.3.14

## Development

```sh
bun install
bun run dev
```

## Production Checks

```sh
bun run check
```

`bun run check` runs linting, Vue/TypeScript type-checking, unit tests, and a production Vite build.

## GitHub Pages

This repository is configured for GitHub Pages project hosting at `/vcm/`.

1. In GitHub, open Settings -> Pages.
2. Set Build and deployment -> Source to GitHub Actions.
3. Push to `master` or `main`, or run the deploy workflow manually.

The workflow in `.github/workflows/deploy.yml` builds `dist/` and deploys it with the official GitHub Pages artifact flow. If the site moves to a custom domain or a user/organization root page, set `VITE_BASE_PATH=/` for the build.
