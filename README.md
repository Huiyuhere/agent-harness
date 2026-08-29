# Agent Harness

Agent Harness is a code-native design canvas for React applications. It imports
an application at an immutable Git SHA, renders its routes as frames, maps DOM
layers back to JSX/CSS, and records validated edits as reversible source
transactions. The source tree—not a canvas override—is the design truth.

## Current foundation

The first working slice includes:

- a resizable, collapsible project and route sidebar;
- isolated workspaces whose route frames, edits, brand tokens, and update times
  never leak into another workspace;
- an infinite pan/zoom canvas with route and saved-state frames;
- visibly distinct Edit, Preview Flow, and Graph modes: Edit selects and changes
  DOM content, Preview Flow exposes destination hotspots and pans to the linked
  frame, and Graph shows those route relationships;
- Design, Layers, Code, and Changes inspector views;
- working inline and inspector text editing with preserved spaces and line
  breaks, typography/layout controls, brand swatches, and a color-wheel picker;
- a shared Page → Navigation / Route content → editable-node hierarchy used by
  the canvas, Layers, Design, Code, and Changes views, including explicit CSS
  units (`px`, `rem`, `em`, and `%`);
- hierarchy-preserving page duplication and blank-page creation;
- prototype flow-gap detection: unresolved controls are logged with click
  counts and timestamps, then can generate and link a suggested next state;
- direct public GitHub repository inspection with Next.js and React
  Router/Wouter route discovery plus brand token extraction;
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

Private GitHub App installation, full repository archive execution, full DOM
instrumentation, real HMR validation against imported apps, encrypted R2 bundle
persistence, and explicit push/PR are the next integration milestones. Public
repository metadata, routes, and brand tokens can already be imported without
running dependency scripts. Private source remains disabled until hosted GitHub
App credentials and the production WebContainer feasibility gate are configured.

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
