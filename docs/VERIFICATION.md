# Verification — first iteration

10 November 2026 · Local Windows workspace `C:\Portfolio`

## Feature update 02 — photo orbit

11 November 2026. Added immediately after the constellation voyage and before Selected Work; the hero and `world.tsx` scene engine were not edited. The existing `next.config.ts` working-tree change predates this feature and was preserved.

The photo review found one source folder, `moksh photos/`, containing 68 supported images and two unsupported videos. Contact sheets were inspected locally. The initial gallery includes 50 photographs; the local config records 18 excluded logos, promotional graphics, social interface screenshots, or repeated versions. One sideways photograph is corrected only in its generated derivative. The originals are untouched and excluded from Git.

Checks completed:

- Six automated tests pass: existing content integrity/confidentiality tests plus orbit wrapping, desktop/mobile geometry, and every image's decode/dimensions/metadata. Geometry is checked at widths 320, 390, 759, 760, 1440, and 2400. This is mathematical coverage, not a substitute for browser visual testing.
- Every generated asset fully decodes; dimensions match the public manifest. All 50 have no EXIF, GPS-bearing EXIF, XMP, IPTC, or orientation metadata. Public filenames are opaque hashes. The 50 high-quality source derivatives total approximately 8 MB; Next Image serves smaller responsive versions.
- ESLint and strict TypeScript pass. The final production webpack build passed after interaction cleanup and asset changes. A restricted attempt encountered EPERM writing `.next/static/chunks`; the retry with process permissions passed after stopping the development server.
- The production homepage returned HTTP 200. All 50 original-size public derivatives and all 50 Next Image optimized variants returned HTTP 200 through the production server (100 successful image responses). A clean-checkout fixture without the private source directory successfully reused the generated manifest and all 50 derivatives.
- The browser displayed the original procedural hero with one canvas. Journey still exposes all eight constellation entry buttons. The new gallery's mounted images loaded with nonzero natural dimensions and occupied different true depths.
- Clicking Next Photograph changed the active index. Enter opened the centered photograph. ArrowRight in the viewer advanced it; Escape closed the dialog and returned focus to the final photograph without replacing the original content.

Browser verification limits: the in-app browser applied unexpected scaling (requested 1440×900 yielded a different logical viewport), and scrolled screenshots became blank. Its full-page capture also failed. A fallback browser attempt was stopped by the computer-use tool because it could not confidently determine the current browser URL; no further browser actions were attempted. There is no usable new gallery screenshot. Desktop art direction, actual pointer drag/inertia, touch swipes and vertical scrolling, browser reduced-motion behavior, mobile visual layout, and physical-device performance remain unverified. These are outstanding QA items, not passed checks. No deployment or publication was performed.

## Commands and results

| Command | Result |
| --- | --- |
| `npm.cmd install --no-audit --no-fund` | Dependencies installed; lockfile created. Restricted-network attempt was stopped and retried with network permission. |
| `npm.cmd run test` | 3 tests passed: content references, private-note exclusion, future-entry integration. |
| `npm.cmd run lint` | Passed with no errors or warnings after fixes. |
| `npm.cmd run typecheck` | Passed with strict TypeScript settings. |
| `npm.cmd run build` | Passed with webpack; `/`, not-found, and favicon prerendered. |
| `npm.cmd run dev` | Next.js 16.4.6 started on `http://127.0.0.1:3000`; page rendered in the local browser. |

The default Turbopack production build crashed while creating a PostCSS subprocess on this host, including after retry with process permissions. The supported `next build --webpack` path passed; the project’s build script records that choice. Turbopack development worked. An initial font import path error was fixed before successful browser and build verification.

Installed core versions: Next 16.4.6, React 19.3.1, R3F 9.8.2, Drei 10.7.9, Three 0.181.2, GSAP 3.15.1, Tailwind 4.3.5, TypeScript 5.9.3. The npm lockfile is the version authority.

## Browser observations

Verified using the local in-app Chromium browser. Responsive emulation included 1440×900 and 390×844 viewports, plus the default narrow desktop preview.

- Ivory hero with real procedural sphere, independent orbital satellites, fine geometry, sparse editorial text.
- Journey navigation reaches the dark, depth-separated constellation.
- All eight stars expose HTML buttons. ASHA, One Line, and Concrete Strength Prediction open their factual story surfaces.
- Selection changes the address to a stable story fragment and moves focus to the story heading.
- Escape returns to the constellation and restores focus to the relevant star.
- Explored naming and glow persist within the visit; reset removes the explored state.
- List view exposes all entries in a stable HTML reading surface.
- Mobile constellation labels fit horizontally; measured label targets are at least 44px high. Long project titles wrap within the mobile story surface.
- Production `npm start` served the built application, with no warnings or errors recorded in a fresh browser tab.
- Direct story fragments restore the selected entry after reload. Initial fragment navigation settles immediately at the constellation to keep the story readable and focus return reliable.
- Stillness preserves all eight HTML star targets. Keyboard selection and Escape return worked with motion paused.
- `?graphics=off` produced zero canvases and eight fallback entry controls; a direct Mock Parliament story and keyboard return worked without WebGL.
- Reverse scrolling with Page Up moved the production scene from midnight `rgb(8, 14, 32)` to an intermediate `rgb(56, 60, 72)` while withdrawing constellation labels, confirming that the passage reverses with native scroll.

Screenshots are saved under the ignored `artifacts/` folder. The preview capture tool developed scaling/scroll-offset issues after viewport emulation; the hero capture was cropped to the observed viewport. Earlier desktop constellation and mobile story layouts were visually inspected successfully. Final fallback and stillness checks also used DOM/accessibility state. This capture limitation is not treated as a complete visual certification of every fallback layout.

## Limits

No physical-device, Safari, Firefox, automated screen-reader, or hardware frame-rate certification. Shader budgets are bounded, but no 60fps guarantee is made. Repository descriptions use the owner’s supplied facts; no live project links or additional feature claims were inferred. Contact currently points only to the supplied GitHub identity. No owner-approved project imagery or long-form stories were supplied.

## What to inspect visually

1. Hero composition: relative heading/sphere scale, orbital delicacy, and negative space.
2. Slow and rapid scroll in both directions, especially around the warm-to-indigo passage.
3. Hover/focus brightness, selected-camera framing, and the return to the overview.
4. Small screens and any new long labels; use list view for a stable alternative.
5. Stillness, system reduced motion, and `?graphics=off`.
6. Copy and entry relationships before making the portfolio public.
