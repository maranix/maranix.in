# maranix.in

A personal website built using a multi-package monorepo and a path-based micro-frontend architecture.

## Overview

The site is designed to keep the primary entry point lightweight while allowing different sub-sections to be developed independently using frameworks suited to their specific functions:

- **Landing page (`/`)**: Static HTML and CSS without client-side frameworks to minimize initial load time and dependency overhead.
- **Sub-sections (`/blog`, `/projects`, etc.)**: Modular applications developed in separate directories with dedicated build configurations and framework choices.
- **Shared packages**: Common utilities and style definitions shared across applications.

---

## Architecture

Routing is handled at the web server or reverse proxy level via subpaths:

```
maranix.in
├── /              -> apps/website (Static HTML / CSS)
├── /blog/*        -> apps/blog (Content / SSG module)
└── /projects/*    -> apps/projects (Interactive application module)
```

### Module Responsibilities

| Path          | Module            | Purpose                                                |
| :------------ | :---------------- | :----------------------------------------------------- |
| `/`           | `apps/website`    | Landing page, biography, and primary navigation links. |
| `/blog/*`     | `apps/blog`       | Articles, technical notes, and long-form content.      |
| `/projects/*` | `apps/projects`   | Interactive applications and project demonstrations.   |
| Shared        | `packages/styles` | Shared CSS reset, design tokens, and base styling.     |

---

## Toolchain

The repository uses **Vite+ (`vp`)** as the unified toolchain:

- **Package Manager**: pnpm (configured via `pnpm-workspace.yaml`)
- **Bundler**: Vite / Rolldown
- **Linter**: Oxlint
- **Formatter**: Oxfmt
- **Test Runner**: Vitest

---

## Repository Structure

```text
maranix.in/
├── apps/
│   └── website/          # Static landing page
├── packages/
│   └── styles/           # Shared CSS tokens, reset, and base styles
├── pnpm-workspace.yaml   # Monorepo workspace configuration
├── package.json          # Root scripts and dev dependencies
├── vite.config.ts        # Global Vite+ lint and format configuration
├── tsconfig.json         # Base TypeScript configuration
└── AGENTS.md             # Guidelines for automated agent workflows
```

---

## Getting Started

### Prerequisites

- Node.js `>= 22.18.0`
- Vite+ (`vp` CLI) or `pnpm`

### Installation

```bash
vp install
```

### Development

Run the primary landing page:

```bash
vp dev
```

Run a specific workspace application:

```bash
vp run website#dev
```

### Validation and Testing

```bash
# Check formatting, linting, and types
vp check

# Run unit tests across all packages
vp test

# Run full pre-commit pipeline (check, test, and build)
vp run ready
```

### Production Build

```bash
vp run -r build
```

---

## Deployment

The production build generates static assets in the output directory. Any standard static file host, CDN, or web server (e.g., Nginx, Caddy, Cloudflare, S3) can serve the site.

For modules utilizing client-side routing (SPAs), configure the server to rewrite subpath requests to the respective module's entrypoint:

- `/projects/*` -> `/projects/index.html`
- `/blog/*` -> `/blog/index.html`
- `/*` -> `/index.html`

---

## License

This project is licensed under the [MIT License](LICENSE).
