# Cahyo Architecture

Single-page architecture portfolio with an authenticated project/media CMS. The homepage contains Hero, Portfolio, About, Services and Contact. Project details open in the existing Base UI Drawer; legacy routes redirect to the homepage.

## Architecture

- Next.js 16.3.5 App Router, React 19, TypeScript, Tailwind CSS v4.
- Server page and structural sections fetch public Supabase data. The portfolio filter/drawer, header, contact form and Motion wrappers are client islands.
- Public queries use the publishable key and RLS, without session cookies. The homepage uses 60-second ISR. CMS actions invalidate `/` immediately.
- Supabase Auth handles sessions. `admin_profiles` membership, server guards and RLS authorize the CMS; an authenticated non-admin is not an admin.
- PostgreSQL owns projects, ordered media, settings, services, messages and admin membership. Storage owns the image bytes in the public `portfolio-images` bucket.
- Motion profiles: `full` = primary fine pointer + hover, `lite` = touch/coarse/no-hover, `reduced` = OS reduced motion. Cursor/parallax only run in full mode and accept mouse Pointer Events. Native cursor remains available. Coordinates use MotionValues; parallax bounds are cached at entry and invalidated on scrolling/resizing.

## Local setup

Use Node 22.13+ (the media unit test command uses Node type stripping) and npm.

```sh
npm ci
npm run dev
```

Create `.env.local` yourself; do not commit credentials:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=https://YOUR_PUBLIC_DOMAIN
```

The first two values are required. The image allowlist derives protocol, hostname and port from the Supabase URL, restricted to this bucket. Invalid origin configuration fails during startup/build. Set `NEXT_PUBLIC_SITE_URL` before building a deployment: it controls canonical metadata, sitemap and robots. The historical fallback is `https://cahyo-architecture.com`; local development can use `http://localhost:3000`.

Optional **process environment** for testing: `E2E_BASE_URL`, `TEMP_ADMIN_EMAIL`, `TEMP_ADMIN_PASSWORD`, `VERIFIED_SUPABASE_PROJECT_REF`. Do not put test passwords in source, reports, screenshots or shell command history. No service-role key is needed by the application.

## Recreate Supabase

1. Create the intended Supabase project. Copy its URL and publishable key into local/deployment environment settings.
2. Install/use the Supabase CLI, run `supabase init` if a local config does not exist, authenticate with `supabase login`, and link using `supabase link --project-ref YOUR_PROJECT_REF`.
3. **Before remote mutations**, compare `.env.local`'s URL ref, `supabase projects list`/linked target, and the Supabase MCP target when using MCP. Confirm the project is the intended Cahyo Architecture instance. Do not operate on another project just because credentials work.
4. Review `supabase db push --dry-run`, then apply migrations in timestamp order using `supabase db push`. The repository contains all application tables, RLS, triggers, cover uniqueness, media RPCs, bucket settings and object policies. Never reset a production database to apply these migrations.
5. Storage migration creates/updates `portfolio-images` as public, 20 MiB (`20971520` bytes), JPEG/PNG/WebP/AVIF. Supabase's project-wide Storage upload limit must be at least 20 MiB. The migration does not upload or delete any files.
6. Bootstrap the first admin as below, then populate settings/services/projects using CMS or reviewed SQL for the appropriate public tables. Database migrations do not seed portfolio content.

The isolated test (`npm run test:database`) replays all three migrations in PostgreSQL through PGlite with a minimal local substitute for Supabase's `auth`/`storage` schemas. It verifies SQL/RLS/rollback behavior; it is **not** a test of the hosted Storage service or proof that a remote migration was applied.

### Admin bootstrap

Create/invite the owner through Supabase Dashboard's **Authentication** UI or the supported Auth Admin API. Set the email/password through the Auth flow. Do not insert/update `auth.users` manually.

Copy that user's UUID and use the intended project's SQL editor, with its privileged database session, to create only the application membership:

```sql
insert into public.admin_profiles (user_id, display_name)
values ('REPLACE_WITH_AUTH_USER_UUID', 'Owner');
```

Visit `/admin/login`. The user must have both a valid Auth session and an `admin_profiles` row. Keep public signup disabled if no visitor accounts are required. Review Auth redirect URLs for the deployed hostname.

## CMS workflow and recovery

Create a draft project, supply real metadata, upload images, edit alt text/captions, select a cover and publish. All images remain available; the public cover falls back to the first ordered media item when no explicit cover exists.

Media move arrows support mouse, touch and keyboard. They change a pending order; **Simpan urutan** saves all IDs using one transaction. Cover selection is independent. Concurrent stale/mismatched lists fail instead of partially writing. Refresh and reorder again if another session changed the media list.

Upload validates MIME, nonempty size up to 20 MiB and readable nonzero dimensions. Paths have UUID filenames. A successful Storage upload followed by failed DB registration triggers compensation. The server first checks whether a row committed (the response may have been lost), then removes only an unreferenced object. Failed cleanup appears with its exact path and a retry control. Each selected file is isolated; the UI exits uploading state in `finally`.

Media deletion removes the DB row first. If that fails, the asset stays intact. Storage removal retries three times; remaining failures expose a cleanup retry path. This is **not atomic across Postgres and Storage**. If the tab/network closes during the operation, use the full authenticated audit to discover unreferenced files and review them before removing them through the Storage API. Do not delete Storage metadata rows directly. The retry action refuses to remove an asset that has a DB reference.

Cover selection uses `set_project_cover`: lock project/media, verify ownership, clear old cover and set new cover inside one transaction. The partial unique index remains in force. Apply the new migration **before deploying actions that call these RPCs**.

## SPA navigation and drawer

- Opening a card pushes `/?project=slug#projects`; Back closes and Forward reopens.
- Adjacent project navigation replaces the current entry. Direct links close by replacement instead of navigating away. History uses a merged `cahyoPortfolio` namespace.
- Portfolio cards are server-rendered HTML. No `useSearchParams` bailout. Initial URL detection runs after hydration. React's inline streaming runtime places streamed server HTML before external application bundles hydrate; completely disabled JavaScript can leave streamed content hidden.
- Mobile: explicit 48%/94% snap state, a fixed flex frame using `dvh` with `vh` fallback, a 44px drag area and one bounded `.drawer-content` scroll owner. Padding accounts for the translated portion at the lower snap and for the bottom safe area. Handle button also permits keyboard expansion/collapse.
- Desktop: fixed right canvas, independently scrolling body. Base UI owns modality, gestures, focus trap and Escape. Its `finalFocus` ref returns to the exact original card even after adjacent navigation. The content carries `data-base-ui-swipe-ignore`, so touch scrolling does not drag the sheet.
- Gallery: all non-cover images once, natural proportions, single column mobile, paired/full-width editorial grid desktop. No fixed crops or index-based animation delay.
- Footer uses direct section anchors; header scrolling honors reduced motion. Core content and images do not depend on a network-detection abstraction. Images use native/Next lazy loading; complete gallery data is available regardless of connection type.
- Canonical metadata and the sitemap point to the homepage. Query parameters are UI state. Legacy redirects remain temporary while rollout verification is incomplete; switch to permanent only after the deployment/URL decision is finalized.

## Verification

```sh
npx tsc --noEmit
npm run lint
npm run build
npm run test:media
npm run test:database
npx playwright install chromium webkit
npm run test:e2e
npm run audit
npm run test:roundtrip
```

E2E defaults to a production server at port 3100, starting `npm run start` automatically after you build. To use an existing server, set `E2E_BASE_URL`. It reads existing published projects and never mutates database content. At least two published projects and a long project with media are needed for the live matrix. Results/traces are ignored under `test-results/` and `playwright-report/`.

The browser matrix covers 320×568, 360×640, 375×667, 390×844, 393×852, 430×932, 667×375, 1024×768, 1280×800, 1440×900 and 1920×1080. Chromium uses native CDP touch input on mobile; WebKit uses keyboard scroll/expand because Playwright cannot synthesize native mobile WebKit touch drags/wheel. These are emulated browser tests, not physical iPhone/Android certification.

The audit is strictly read-only. It paginates DB and recursive Storage listings, checks published visibility, metadata, covers and asset reachability, and computes both orphan directions. With no admin credentials, draft references are unknown: unmatched Storage paths are candidates, not confirmed orphans. Exit 2 means incomplete full audit, exit 1 a failure, exit 0 all checks in the requested scope passed. `node scripts/audit-integration.mjs --public-only` intentionally limits scope. Empty sensitive-table reads are observational evidence, not proof of write-policy enforcement.

The roundtrip requires process-only admin credentials and `VERIFIED_SUPABASE_PROJECT_REF` obtained from independent target verification. It creates a uniquely named temporary project, uploads/registers images, verifies real visible/decoded drawer images and reordered gallery, then removes only those temporary records/assets in `finally`. It polls up to 150 seconds for each direct-DB change to pass through the 60-second ISR window. Missing credentials/target fail before mutation. Cleanup failures name the exact temporary ID/paths; investigate and retry cleanup before rerunning.

`scripts/seed-template-portfolio.mjs` is an explicit development helper, never part of install/dev/build. Existing slugs are skipped to protect owner edits. Template geometry/images and example descriptions are demonstrations, not authenticated built-project claims; replace them with owner-approved content before public launch.

## Deployment and security checklist

- Independently verify Supabase target; apply/review migrations before application rollout.
- Set public Supabase origin/key and real canonical site origin in build and runtime environments. Build-time public values require a rebuild when changed.
- Bootstrap only intended admins through Auth + `admin_profiles`; verify a non-admin cannot write projects/media/Storage.
- Run static checks, SQL tests, authenticated audit, real admin media roundtrip and browser matrix against the deployment.
- Public bucket assets are URL-readable, including unpublished-project assets if their URLs are known. Draft database RLS is not private file storage. Upload only material suitable for a public bucket.
- Never expose service-role secrets or passwords; do not manually modify `auth.users`. Public query failures throw to sanitized error boundaries rather than masquerading as an empty portfolio.
- Review console/image requests, keyboard focus, actual iPhone/Android gestures, safe areas and browser chrome resizing on devices. Emulation cannot certify all physical Safari behavior.
- Review all cleanup failures; migrations and tests never authorize deletion of owner-created content.

Reference APIs: [Base UI Drawer](https://base-ui.com/react/components/drawer), [Supabase bucket configuration](https://supabase.com/docs/guides/storage/buckets/creating-buckets). Installed Next.js documentation is under `node_modules/next/dist/docs/`; read it before changing framework conventions.
