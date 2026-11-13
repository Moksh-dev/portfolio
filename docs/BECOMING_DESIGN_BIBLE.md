# BECOMING — Design bible

Version 01 · 10 November 2026

Feature update 02 · 11 November 2026 — Personal photo orbit

## Intent

A personal portfolio for Moksh Goel, a first-year Computer Science Engineering student specializing in AI/ML at VIT Chennai. Visitors discover work, learning, community, and earlier explorations through relationships. There is no chronological résumé, numerical personal-progress measure, or fixed endpoint.

## Authoritative hero

No approved screenshot or supplied visual asset existed in the empty workspace. The owner’s written reference is authoritative for this iteration:

- Warm pale ivory, editorial serif typography, sparse navigation, fine independent orbits.
- A softly lit procedural sphere to the right; personal introduction to the left.
- Negative space, delicate particles, a few inherited amber details.
- “Moksh Goel”, “still becoming.”, and “ideas / experiments / everything in between”.

On narrow screens, the sphere sits above and to the right of the introduction. The image is a reference direction, not a bitmap background: sphere lighting and texture are procedural, and orbital geometry is real 3D.

Preserve this warm composition in later sessions. If the owner supplies the approved screenshot, compare and adjust toward it before introducing unrelated visual concepts.

## Palette

| Role | Token |
| --- | --- |
| Hero / selected work | `#F4F0E8` |
| Contact parchment | `#EDE8DD` |
| Hero ink | `#292C31` |
| Amber detail | `#A38B60` |
| Constellation atmosphere | `#080E20` |
| Main stellar labels | `#C4CCDF` |
| Secondary stellar labels | `#909DB7` |
| Warm project star | `#E4BD87` |
| Cool star | `#B5C8F3` |

No neon rainbow, purple SaaS gradients, red romantic theme, unrelated mountains, or excessive glass surfaces. Grain is a fine procedural SVG texture, kept subordinate to the typography and scene.

## Typography

Instrument Serif for large headings, project names, and the quiet One Line story introduction. Inter for UI, metadata, facts, and constellation labels. Both are locally hosted. Headings use normal weight, tight tracking, and calm line heights. Small navigation and labels use ordinary sentence case; do not introduce widely spaced uppercase typography or cursive labels.

Maintain visible focus and 44px minimum interaction targets even where text is visually restrained. Recheck long titles at narrow widths whenever content changes.

## Copy rules

All autobiographical content belongs in the typed content model. Keep it sparse, factual, and natural. Projects, roles, relationships, and small details carry the identity.

Never invent achievements, dates, project specifics, statistics, personal anecdotes, quotes, intimate experiences, images, or private reflections. Do not add corporate introductions, personality labels, motivational paragraphs, “passionate developer” phrasing, or “This isn’t X, it’s Y” formulas.

Project A.S.H.A. is an ongoing Technical Lead contribution to an anti-human-trafficking awareness initiative; website work is distinct from volunteer tools still at the concept stage. One Line is a small Flask/SQLite anonymous-thought application. Concrete Strength Prediction is an introductory supervised regression exploration. Never inflate it into industrial research. Club tenure is 2026–27. Exhibition project specifics are unknown and must remain unspecified. Debate participation is not an award.

Completed, ongoing, and exploratory states describe entries; they are not personal-development scores. Unknown dates remain omitted. Use only supplied contact destinations. Currently, contact links to GitHub.

## Spatial composition

The constellation uses intentional, irregular 3D positions and depth. ASHA carries inherited amber; One Line is quieter and cool; concrete and community use blue-white. Smaller foundations remain smaller. Relationships are editorial connections, not assertions that one achievement caused another.

Labels are HTML buttons projected from 3D positions. They remain readable and keyboard accessible. Star cores also have enlarged pointer targets. The same entry and relationship data power the HTML/SVG alternative and list view.

Avoid generic card grids, floating rectangles, dashboard patterns, regular circular menus, and arbitrary panels. The work index uses open editorial rows and fine rules. Stories occupy the scene’s left-hand negative space while the camera approaches a selected star on the right. Mobile uses the available width and a subtle navy readability scrim.

## Scroll choreography

The document scroll is native. A 320svh section provides a sticky 100svh world. ScrollTrigger maps the available 220svh of travel to a normalized position. Reversing scroll reverses the entire journey.

1. **Rest:** Ivory world, slowly rotating noise-shaded sphere, independent satellites and dust. Text enters with restrained vertical fades.
2. **Departure:** Typography moves upward and fades. Camera approaches, with subtle cursor parallax; independent orbits expand and tilt in depth.
3. **Passage:** Ivory interpolates through indigo into navy. The same particle buffer expands from orbital coordinates into distant stars. The sphere recedes. A thin warm horizon passes through the scene. “A few things, connected.” briefly occupies the passage.
4. **Arrival:** The constellation moves forward from depth and expands to its resting composition. Labels become available after arrival.
5. **Rest again:** Slow compound rotation, small stellar drift, and restrained pulses continue with no scroll input.

GSAP owns the scroll measurement and DOM CSS variables. R3F owns WebGL transforms, camera travel, and shader uniforms. CSS owns DOM entrance and hover transitions. Do not animate one property with multiple animation libraries. Motion was deliberately not added as a second JavaScript animation engine.

Selection eases the actual perspective camera toward a star; the star and its relationships stay in the living scene. The article is semantic HTML, not a generic modal. Escape and Back restore the overview and focus. URL fragments support direct story access and browser history.

## Exploration motif

Explored entries live in an in-memory `Set`. They retain a warmer, stronger halo and accessible “previously explored” naming. Connections brighten when both endpoints have been explored. Hover/focus emphasizes relevant connections. Reset clears the set and announces the change. There is no progress meter, completion percentage, or requirement to visit every point.

## Accessibility and alternatives

- Native links, buttons, headings, definition lists, skip link, visible focus, live reset announcements.
- Star labels, reading order, story facts, and repository destinations remain HTML.
- System reduced motion and the manual stillness toggle disable ambient frame loops and lengthy DOM transitions. Reduced mode switches spatial poses instead of traveling through them.
- Without WebGL2 or after context loss/render failure, CSS sphere/orbits and HTML/SVG stars provide a functional alternative. `?graphics=off` exercises it directly.
- View as list replaces spatial labels with an ordered reading surface; all stories remain available.
- No audio, autoplay video, imported model, or external media download.

## Performance boundaries

- DPR is capped at 1.5.
- Sphere: 64 × 48 segments; satellites and star cores use low-resolution geometry.
- Atmospheric dust: 680 desktop points / 300 narrow-screen points in one draw call.
- Five curves with 241 vertices each; sparse relationship lines sampled at 33 points.
- Per-frame geometry changes use typed arrays and refs; they do not set React state.
- Reduced motion uses demand rendering. Resource disposal, context listeners, scroll listeners, keyboard listeners, and ScrollTrigger cleanup are scoped to their owners.
- Deterministic seeds keep positions stable between visits and simplify fallback comparison.

These are implementation budgets, not measured frame-rate claims. Validate on target hardware before promising a frame rate. Avoid postprocessing bloom; radial shader halos supply restrained light with less render overhead.

## Extending the content

Add entries without editing the scene engine. Supported fields: stable ID, title/short title, category, kind, date, description, labeled factual details, related IDs, source link, status, optional approved narrative, optional media, private editorial notes, and visual position/color/size/label alignment.

The server passes only `PublicEntry` values. Never bypass `publicEntries()`. The tests enforce confidentiality and relationship integrity. Private editorial notes are not permission to publish a narrative.

Future work can add genuine project screenshots, owner-approved writing, new projects, school leadership, campus responsibilities, collaborations, and unfinished experiments. Add a real contact address only when supplied. Preserve the first iteration’s restraint.

## Visual review priorities

Review the hero’s balance at wide and narrow sizes; scrub and reverse the passage; inspect label collisions at intermediate sizes; open every story; check long titles, focus return, reading mode, stillness, and `?graphics=off`. Keep the atmosphere alive without letting motion compete with reading.

## In between — an orbit of moments

Inserted directly after the constellation voyage, before Selected Work. The approved world, hero, ScrollTrigger, and R3F animations remain intact. Section numbering is now 03 photographs, 04 selected work, 05 contact. Instrument Serif and Inter retain their existing roles; the heading is “In between.” with the supplied “a few moments, kept close.” label. No personal narrative, dates, relationships, or event captions are inferred.

The environment begins in the constellation's exact midnight navy. Sparse stellar traces disperse as native scrolling carries the viewer toward a quieter slate atmosphere. Each photograph independently assembles from depth, with an orderly delay based on its distance from the front. The section has no pin, wheel interception, or extra scroll track. Its own traces provide continuity without modifying the existing constellation animation.

Photos travel on a tilted elliptical path using CSS perspective and individual translate3d/rotateY transforms. This is real DOM geometry, with independently oriented images rather than a parent cylinder or flat strip. A virtual window of at most 11 image elements recycles at the invisible back of the path so larger collections retain a bounded rendering and loading budget. Desktop shows a broad arc; mobile uses a smaller radius, larger angular separation, and at most five visible photographs. Every frame is natural aspect ratio, never cover-cropped. Soft shadows sit directly behind photographs, with no decorative card chrome.

One controller owns rotation: pointer drag takes priority, release projects a bounded velocity into a damped snap, explicit navigation settles to an exact photo, hover/focus suspend the automatic orbit, and gentle automatic movement resumes after an idle interval. Native scroll adds a reversible small rotation only when other interactions do not own the scene. Automatic motion advances approximately one photograph every 29 seconds. Long Home/End jumps reposition directly rather than spinning through the collection. Only transform and opacity are written each animation frame; React state changes only as the nearest index changes. Intersection and document visibility stop offscreen frame work; ResizeObserver handles layout changes without per-frame measurements.

Selection first centers the photograph and lowers the surrounding images' prominence. The native modal dialog then expands the same image from its measured bounds, using the Web Animations API. Escape/close contracts back when still viewing that image; after navigating in the viewer, closing returns to the final selected photo. The dialog supplies focus containment; body scrolling is restored on cleanup and focus returns without a page jump. Previous/next, arrow keys, Home/End, a roving photo focus target, native buttons, and touch swipes retain access to the collection. Unknown image contents use neutral descriptions. Failed images retain a readable fallback and all navigation.

Reduced motion removes automatic rotation, cursor tilt, assembly travel, and image expansion. Manual navigation becomes immediate, preserving the same controls. The existing global Stillness preference also applies. The new gallery does not require WebGL and remains functional with `?graphics=off`.

Photographic content is separate from the renderer. `scripts/sync-gallery.mjs` discovers supported images recursively inside `moksh photos/`; `scripts/gallery.config.json` records local exclusions, optional factual alt descriptions, orientation fixes, and a small featured sequence. Originals remain unchanged and are ignored by Git. Metadata-free, max-1800px WebP derivatives use anonymous content IDs; the public JSON exposes only ID, asset URL, dimensions, and alt text. Neither EXIF/GPS/XMP nor original camera filenames are shipped. Next Image supplies responsive optimized resolutions; the viewer loads on demand. See README for add/remove instructions. New photos need an editorial review before publication because the generator intentionally does not infer screenshot or logo content.
