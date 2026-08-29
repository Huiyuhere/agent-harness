# Agent Harness

Agent Harness is a code-native design canvas for React applications. It imports
an application at an immutable Git SHA, renders its routes as frames, maps DOM
layers back to JSX/CSS, and records validated edits as reversible source
transactions. The source tree—not a canvas override—is the design truth.

## Current foundation

The first working slice includes:

- a resizable, collapsible project and route sidebar;
- an infinite pan/zoom canvas with route and saved-state frames;
- Edit, Prototype, and Graph interaction modes;
- Design, Layers, Code, and Changes inspector views;
- semantic source-change records with timestamps and inverse values;
- a persistent-style agent surface with frame context, progress, stop, copy,
  timestamps, and duration;
- typed JSX, CSS, and Tailwind source patch adapters with stale-hash checks;
- route discovery and inferred link edges;
- a scheduler that permits three read/analysis jobs while serializing source
  writes per repository;
- D1 schemas for projects, frames, states, graph edges, edits, sessions, jobs,
  memory, and artifact metadata;
- R2 binding declarations for encrypted patch bundles and frame artifacts;
- WebContainer isolation checks and a single-instance runtime boundary;
- a bounded OpenAI Responses API proxy that streams responses and only permits
  inspect/propose tools. The agent cannot apply or publish a patch.

GitHub App installation, repository archive import, full DOM instrumentation,
real HMR validation against imported apps, encrypted R2 bundle persistence, and
explicit push/PR are the next integration milestones. Their UI and security
boundaries are represented, but they remain disabled until hosted credentials
and the production WebContainer feasibility gate are configured.

## Safety model

- Imported dependencies never run before explicit project trust.
- GitHub credentials and OpenAI keys remain server-side.
- A GitHub App must be limited to selected repositories with Metadata read,
  Contents read/write, Pull Requests read/write, and no Workflows permission.
- Agent changes are proposals until the user approves a diff.
- Writers are serialized per repository. Up to three read-only jobs may run in
  parallel.
- Published source must never contain preview instrumentation attributes.
- Branch push and pull-request creation are separate explicit actions.

## Local development

Requires Node.js 22.13 or newer and pnpm.

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:3000` in desktop Chromium. The response includes
the COOP/COEP headers required by WebContainer.

Validation:

```bash
pnpm test
pnpm build
node --test tests/rendered-html.test.mjs
```

## Hosted configuration

Copy `.env.example` to `.env` for local secret names. Configure production
values through Sites; never commit `.env`.

- `OPENAI_API_KEY`
- `GITHUB_APP_ID`
- `GITHUB_APP_CLIENT_ID`
- `GITHUB_APP_CLIENT_SECRET`
- `GITHUB_APP_PRIVATE_KEY`
- `PATCH_ENCRYPTION_KEY`

The Site declares D1 as `DB` and R2 as `ARTIFACTS`. The production release must
pass these checks before imported code execution is enabled:

1. `crossOriginIsolated === true` in desktop Chromium.
2. A WebContainer boots with `credentialless` COEP.
3. Installation succeeds only after explicit trust.
4. The imported dev server renders in an origin-checked iframe.
5. `postMessage` traffic rejects unknown origins.
6. A private selected-repository archive can be reconstructed from a base SHA
   and ordered patch bundles.

## Supported first-release targets

- Vite React
- Next.js App Router and Pages Router
- React Router
- npm, pnpm, and Yarn projects
- JSX/TSX text and structure, inline styles, plain CSS, CSS Modules, and
  Tailwind tokens

Dynamic routes require named fixture parameters. CSS-in-JS, generated classes,
i18n-backed copy, and ambiguous structural edits use agent-assisted proposals
with approval instead of direct manipulation.

## License and attribution

Agent Harness is MIT licensed. Interaction concepts were informed by the
MIT-licensed [Design Canvas](https://github.com/Huiyuhere/design-canvas); see
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
