# BECOMING

Moksh Goel’s personal portfolio. An ivory orbital composition becomes a midnight constellation through a reversible, scroll-controlled camera journey.

## Run locally

Requires Node.js 20.9 or newer and npm. Developed and verified with Node.js 24.18.0.

```powershell
cd C:\Portfolio
npm install
npm run dev
```

Open **http://127.0.0.1:3000**. On Windows, use `npm.cmd` if PowerShell blocks the `npm.ps1` launcher.

Production:

```powershell
npm run build
npm start
```

No environment variables, database, account, or API keys are required. Fonts are bundled locally with their OFL licenses. The application makes no third-party font or media requests. Nothing has been deployed or published.

## The experience

- A procedural shaded sphere, five fine orbital curves, independent satellites, and drifting particles.
- Native scrolling through a 320svh section; its viewport stays sticky for 220svh. No wheel interception or scroll locking.
- One React Three Fiber canvas carries the camera, orbital expansion, particle redistribution, horizon, and depth-separated constellation. GSAP ScrollTrigger supplies the scroll position; R3F owns all 3D transforms.
- Eight selectable entries, accessible HTML labels, camera travel, integrated editorial stories, related-entry navigation, and direct links such as `/#story/one-line`.
- Explored stars retain a glow. Connections between explored entries brighten. Reset clears the visit’s in-memory exploration state.
- A three-project editorial work index and a GitHub contact destination. No fabricated email or LinkedIn address.
- A stillness control and system reduced-motion support. Without WebGL2, CSS orbital artwork and an HTML/SVG constellation retain access to all stories.

## Controls

Scroll or choose **Journey / Follow the orbit**. Select a star or its label. Use **Back to the constellation**, **Escape**, or browser Back. Related entries can be followed from a story. **View as list** provides a stable reading order. **Reset** clears explored highlights. **Ambient motion** switches to stillness. System reduced-motion preferences take priority over the toggle.

Use `http://127.0.0.1:3000/?graphics=off` to explicitly exercise the non-WebGL alternative. This uses the same content, selection, reset, and story engine.

## Source map

| File | Responsibility |
| --- | --- |
| `src/content/portfolio.ts` | All owner information, entry facts, statuses, relationships, and visual positions; public-payload projection |
| `src/lib/world.ts` | Deterministic geometry helpers and deduplicated relationship edges |
| `src/components/world.tsx` | Canvas, procedural GLSL materials, camera interpolation, particles, orbits, stars, WebGL failure boundary |
| `src/components/becoming.tsx` | Scroll lifecycle, semantic HTML, navigation, exploration state, stories, fallback and reading view |
| `src/app/globals.css` | Tokens, editorial layout, responsive rules, fallback artwork, focus and motion styles |
| `src/app/layout.tsx` | Local fonts, metadata, semantic document root |
| `src/app/page.tsx` | Server entry point; strips private editorial notes before passing data to the client |
| `src/app/icon.svg` | Original orbital favicon |
| `tests/content.test.ts` | Content integrity, private-note exclusion, renderer-independent extension |
| `docs/BECOMING_DESIGN_BIBLE.md` | Design and content source of truth for later work |
| `docs/VERIFICATION.md` | Checks, browser observations, limits, and visual review guidance |

## Add an experience

Add a typed `PortfolioEntry` in `src/content/portfolio.ts`, with a unique ID, factual copy, explicit status, existing related IDs, and an intentional 3D position. The rendering engine automatically creates its star, accessible label, connections, story, and list entry. Entries with `kind: "project"` also join Selected Work.

Unknown dates and source links can be omitted. Media is optional and must be supplied and approved; none is fabricated. Longer copy belongs only in `approvedNarrative`. `privateEditorialNotes` is removed by `publicEntries()` on the server and must never be imported as runtime content in a client component.

## Personal photo gallery

**In between.** sits immediately after the constellation's `voyage` section and before Selected Work. It uses the owner's `moksh photos/` folder. The hero and constellation scene engine are unchanged.

- Drag horizontally or swipe to rotate; vertical touch scrolling remains native. Use the previous/next buttons, or focus a photo and use Left/Right. Home/End reach the first/last photo. Click a photograph or press Enter to focus and open it.
- The viewer supports arrow keys, previous/next buttons, touch swipes, Escape, and a close button. Closing returns keyboard focus to the photograph. The viewer uses the actual image's proportions with no cropping.
- Slow Orbit pauses automatic movement. The existing Stillness switch and the system reduced-motion preference also stop ambient gallery motion. Reduced mode keeps manual navigation and removes camera tilt, animated assembly, and viewer travel.

To add photos, put JPG, JPEG, PNG, WebP, or AVIF files inside `moksh photos/` (subfolders work), then run `npm run gallery:sync`. Development and production builds also synchronize automatically. Remove a source photo to remove its generated asset on the next sync, or add its relative filename to `exclude` in `scripts/gallery.config.json` to keep the original but omit it from the website. The same config controls featured order, optional verified alt text, and orientation corrections. New images receive neutral alt text until a description is supplied. Review new material before publishing; automatic discovery cannot judge whether a newly added file is an interface screenshot or logo.

The generator never writes to the source folder. It creates bounded, metadata-stripped WebP derivatives under `public/gallery/` with opaque content IDs, and a public manifest at `src/content/photos.json`. Original filenames, exclusions, and source-folder paths stay out of the client manifest. The initial review discovered 68 supported images and included 50 photographs, excluding 18 graphics, screenshots, or repeated versions. Two videos are unsupported and are not included. Generated files are tracked so the gallery works on hosting without needing the originals; keep the private source folder local.

## Checks

```powershell
npm run test
npm run lint
npm run typecheck
npm run build
```

The production build explicitly uses Next.js’s webpack compiler. The default Turbopack production compiler crashed on this Windows host while starting a PostCSS worker; webpack completed successfully. Development uses Turbopack and was verified locally. The lockfile pins the installed dependency graph; use `npm ci` for repeatable clean installation.

## Scope and limitations

This is the first working iteration. No CMS, uploads, backend, analytics, or persistence is included. Exploration resets on reload. Contact currently goes to the supplied GitHub profile. The approved hero screenshot was unavailable, so the supplied written direction is the composition reference. Story media and longer narratives await owner-approved material. Browser testing covers desktop and mobile viewport emulation on this machine; it does not establish physical-device or cross-browser performance guarantees.
