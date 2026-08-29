# Arya Color — Implementation Plan

## 1. Product objective

Build an original, landscape-first color-by-number web app that feels as enjoyable and responsive as the reference iPad app while remaining simple, family-friendly, and free of accounts, advertising, subscriptions, and social features.

The first release is for independent use by a seven-year-old on a 13-inch iPad Pro with Apple Pencil Pro and fingers. It will be hosted as a static site on GitHub Pages and can be added to the iPad Home Screen.

## 2. Version-one scope

### Included

- A simple gallery containing 15 original pixel-art pictures.
- Three pictures unlocked initially; every picture remains visible in the gallery.
- Small, medium, and large difficulty levels.
- One, two, or three stars awarded for completing small, medium, or large pictures.
- New pictures unlocked at cumulative star milestones. Stars are never spent.
- Multiple unfinished pictures with automatic local save and resume.
- A numbered square grid with one selected numbered color at a time.
- Correct cells fill; wrong taps have no effect or feedback.
- Tap and continuous drag painting with Apple Pencil or one finger.
- Two-finger pan and pinch-zoom.
- A magnifying loupe while painting.
- Manually choosing the next color after completing a color.
- Completed color swatches faded with a checkmark.
- Unlimited hints that automatically fill one remaining cell for the selected color.
- Optional coloring sounds, controlled by a persistent sound setting.
- A fast coloring time-lapse after completion.
- Rainbow confetti and Rose, the pink axolotl, in the completion celebration.
- A Home Screen web-app experience with original icons and branding.

### Explicitly deferred

- Photo import or camera access.
- An in-app picture creator.
- Accounts, profiles, cloud sync, or remote backups.
- Community features, publishing, likes, comments, or moderation.
- Search and a large content catalog.
- Coins, consumable hints, boosters, streaks, quests, or daily rewards.
- Guaranteed offline use.
- Multiplayer or turn tracking.

## 3. Product defaults to validate through playtesting

These are starting values, not permanent commitments:

- Small: roughly 20–24 cells wide, 3–6 colors, and 2–5 minutes.
- Medium: roughly 32–40 cells wide, 6–10 colors, and about 7–12 minutes.
- Large: roughly 48–64 cells wide, 10–16 colors, and about 15–25 minutes.
- Empty/transparent cells are not colorable and do not receive numbers.
- Sound starts enabled and can be disabled from a small settings panel.
- A hint fills one cell belonging to the currently selected color and is included in the completion replay.
- Completing a picture awards stars only once; replaying it cannot generate more stars.
- Portrait orientation presents a friendly rotate-device prompt while retaining access to navigation.

## 4. Recommended technical foundation

### Application stack

- React and TypeScript for the gallery, menus, palette, progress, and celebration UI.
- Vite for local development and static production builds.
- HTML Canvas 2D for the coloring board, grid, numbers, and loupe.
- Pointer Events for Pencil, touch, and mouse input.
- IndexedDB for puzzle progress, completion history, star state, and settings.
- CSS variables and ordinary CSS for an original visual system; no large component framework.
- Vitest and React Testing Library for logic and interface tests.
- Playwright for browser-level flows, supplemented by mandatory testing on the physical iPad.

React should own the application shell, but not thousands of individual grid cells. The board will be a canvas controlled by a focused rendering and gesture module. This keeps the UI maintainable without paying the performance cost of representing each pixel as a DOM element.

### Repository setup

The workspace is currently empty and is not yet a Git repository. Initial setup should include:

- Git initialization and a standard ignore file.
- A Vite React/TypeScript project.
- Strict TypeScript settings.
- Formatting, linting, unit-test, production-build, and preview commands.
- A GitHub Actions check that runs tests and builds the app.
- A separate GitHub Pages deployment workflow from the main branch.

## 5. Application architecture

Suggested source organization:

```text
src/
  app/             application shell, navigation, and global state
  gallery/         gallery cards, locks, stars, and progress display
  game/            play screen and game-session coordination
  canvas/          renderer, transforms, hit testing, gestures, and loupe
  content/         artwork definitions, catalog, and validation
  progression/     rewards and unlock calculations
  persistence/     IndexedDB schema, migrations, and save queue
  celebration/     replay, confetti, and Rose presentation
  audio/           sound loading, playback, and setting
  components/      shared controls and dialogs
  styles/          tokens, typography, layout, and accessibility
public/
  artwork/         thumbnails and any derived artwork assets
  audio/           short original sound assets
  icons/           Home Screen icons and Rose/app branding
tools/
  artwork/         development-only conversion and validation utilities
```

The app only needs two primary views:

1. **Gallery:** choose, continue, or inspect a visible locked picture.
2. **Coloring:** paint the selected picture and return to the gallery.

Use hash-based view URLs, or equivalent internal state that does not require server rewrites, so reloading on GitHub Pages cannot produce a missing-page error.

## 6. Core data design

### Artwork definition

Each authored picture should have a versioned static definition containing:

- Stable ID, title, category, difficulty, and accessibility description.
- Grid width and height.
- Palette entries with stable numeric IDs and colors.
- A compact row-major array mapping each cell to a palette entry or transparency.
- Star reward and cumulative unlock threshold.
- Thumbnail and content-version metadata.

Runtime code should validate every artwork definition before exposing it in the gallery. Validation must catch invalid palette references, duplicate IDs, missing assets, unreachable unlock thresholds, and grids outside supported limits.

### Saved progress

Store the following separately from immutable artwork definitions:

- Artwork ID and content version.
- Filled-cell bitset or compact boolean array.
- Ordered list of newly filled cell indexes for the completion replay.
- Started, updated, and completed timestamps.
- Completion and one-time star-award flags.

Save changes with a short debounce during painting and flush immediately when the page becomes hidden. Request persistent browser storage when appropriate, while recognizing that local browser data is not a guaranteed backup.

### Derived progression

Derive total stars from uniquely completed pictures rather than maintaining an unrelated editable balance. A picture is unlocked when its threshold is less than or equal to that total, with the first three definitions using a threshold of zero.

## 7. Canvas and interaction design

### Rendering

- Render using logical board coordinates and scale the backing canvas for the device pixel ratio.
- Maintain one transform describing pan and zoom; invert it for hit testing.
- Clamp zoom and pan so the picture cannot become lost off-screen.
- Draw only visible cells when profiling shows that full redraws are too expensive.
- Cache static grid geometry and number layout where useful.
- Hide or simplify numbers when cells are too small to read, restoring them as the user zooms.
- Begin with Canvas 2D; introduce WebGL only if real-device measurements demonstrate a need.

### Painting

- A Pencil contact starts painting immediately.
- The first finger enters a very short pending state so a second finger can turn the gesture into pan/zoom without coloring accidentally.
- A single-finger tap or drag after that pending decision paints normally.
- A second touch cancels pending painting and starts a two-finger transform gesture.
- While a Pencil is actively painting, incidental touch contacts are ignored to improve palm rejection.
- Use pointer capture so a drag remains stable when it crosses canvas boundaries.
- Interpolate between sampled cells during a fast drag so no matching squares are skipped.
- Fill a cell only when its required color matches the selected color and it is not already filled.

The finger decision delay should start around 60–100 milliseconds and be tuned on the physical iPad. It must be short enough that taps feel immediate but long enough to prevent the first touch of a pinch from painting.

### Loupe

Show a circular loupe offset above the active contact so it is not covered by a hand. It should reproduce the board beneath the contact at a higher scale and remain inside screen-safe bounds near the edges.

### Palette and hints

- Keep palette swatches large enough for a seven-year-old and scroll them horizontally when necessary.
- Do not automatically change selection when a color is completed.
- Mark completed swatches with both fading and a checkmark.
- Disable a completed swatch for painting while allowing it to remain visible.
- The hint button fills one unfilled cell for the selected color. If no unfinished color is selected, it asks the player to choose one without spending or consuming anything.

## 8. Gallery and progression design

- Present a clean grid of large picture cards with minimal reading required.
- Show completed artwork in full color.
- Show partial progress on started pictures and label the action as Continue.
- Show locked pictures clearly rather than concealing them.
- A lock overlay states the total-star milestone or how many more stars are needed.
- Keep the current total star count visible on the gallery.
- Provide one small settings entry for sound and a parent-confirmed reset-progress action.
- Do not add bottom navigation intended for future features.

Initial reward rule:

- Small picture: 1 star.
- Medium picture: 2 stars.
- Large picture: 3 stars.

Unlock thresholds should be stored in content data and tuned after testing. The sequence must never deadlock: completing currently unlocked pictures must always make at least one additional picture reachable until the full catalog can be unlocked.

## 9. Initial content plan

Create 15 original pictures with a deliberate mixture of subjects and difficulty. A provisional catalog is:

### Initially unlocked

1. Happy Heart — small.
2. Sprinkle Cupcake — medium.
3. Sunny Palm Tree — medium.

### Visible but initially locked

4. Moon and Stars — small.
5. Ice Cream Cone — medium.
6. Tropical Pineapple — medium.
7. Pizza Slice — medium.
8. Rainbow Beach — large.
9. Friendly Pumpkin — medium.
10. Snowy Cabin — large.
11. Colorful Donut — medium.
12. Tropical Fish — medium.
13. Mountain Sunrise — large.
14. Holiday Gift — small.
15. Starry Desert — large.

Names and subjects can change during art production, but food pictures should remain medium-sized as requested.

### Artwork workflow

1. Establish the exact JSON/grid schema using one hand-cleaned test picture.
2. Create original source concepts, using AI-assisted generation where helpful.
3. Convert each concept into a limited-palette pixel grid.
4. Manually clean silhouettes, isolated pixels, tiny color regions, and number readability.
5. Run automated schema and playability validation.
6. Play every picture from blank to completion before release.

The development-only art utility should convert cleaned pixel images into definitions and thumbnails. An in-app creator is not needed.

## 10. Completion experience

- Record each newly filled cell in order, including hint-filled cells.
- On the final cell, prevent additional input and save completion immediately.
- Replay the recorded sequence at an adaptive speed so the animation takes roughly 3–6 seconds regardless of puzzle size.
- Remove grid lines and numbers for the final reveal.
- Trigger abundant rainbow confetti and bring Rose into the celebration.
- Offer clear Replay and Back to Gallery actions.
- Award stars before returning to the gallery and explain newly unlocked pictures visually.
- Respect reduced-motion settings by shortening or replacing the time-lapse and particle animation without removing the sense of completion.

## 11. Home Screen and GitHub Pages delivery

- Configure Vite's base path for the repository URL, while allowing `/` when a custom domain is used.
- Add a Web Application Manifest with the Arya Color name, standalone display, landscape preference, theme colors, start URL, scope, and original Rose-based icons.
- Include Apple touch icons and safe-area-aware layout for iPad.
- Use a GitHub Actions Pages workflow to build and deploy the `dist` output.
- Deploy a minimal shell early to catch base-path and asset-path mistakes before significant development.
- Do not add a service worker in version one because offline behavior is not required. This avoids stale-cache complexity while retaining the iPad Home Screen experience.

## 12. Phased implementation

### Phase 0 — Foundation and early deployment

- Initialize the repository and application stack.
- Establish code quality, testing, and build commands.
- Add the two-view shell and responsive landscape layout.
- Add the manifest and temporary original app icon.
- Deploy the empty shell to GitHub Pages.

**Exit criteria:** local checks pass, the production build loads from the GitHub Pages repository path, and it opens from the iPad Home Screen.

### Phase 1 — Pencil and touch risk prototype

- Implement a diagnostic canvas with a small test grid.
- Add high-DPI rendering, transforms, hit testing, and selected-color painting.
- Add Pencil painting, single-finger painting, two-finger pan/zoom, palm-contact handling, drag interpolation, and the loupe.
- Instrument frame rate and pointer transitions during development.
- Test repeatedly on the target iPad Pro and Pencil Pro.

**Exit criteria:** tap and drag feel satisfying, fast strokes do not skip eligible cells, wrong colors never fill, and repeated pinch/pan gestures do not leave accidental painted cells.

This is the main go/no-go checkpoint. UI polish should not proceed until the real-device interaction feels right.

### Phase 2 — One complete playable picture

- Finalize the artwork schema and validator.
- Add the full palette UI, completion state, faded checkmarks, hints, and optional sounds.
- Add one polished medium picture.
- Implement event recording, time-lapse, confetti, and a temporary Rose celebration.

**Exit criteria:** Arya can select one picture and complete the entire loop without assistance, from opening the gallery through celebration.

### Phase 3 — Persistence, gallery, and stars

- Add IndexedDB storage and schema migration support.
- Save multiple unfinished sessions and resume them accurately.
- Add gallery progress states, difficulty, rewards, total stars, visible locks, and milestone unlocks.
- Add sound settings and confirmed progress reset.
- Test refresh, force-close, and reopen behavior in Safari and the Home Screen app.

**Exit criteria:** progress survives normal interruption, stars are awarded exactly once, and completing pictures unlocks the catalog without dead ends.

### Phase 4 — Original visual design and game feel

- Establish Arya Color's original palette, typography, card system, buttons, and icons while preserving the familiar information structure.
- Create the final Rose mascot and Home Screen icon.
- Refine sounds, selection feedback, motion, loupe positioning, confetti density, and newly unlocked presentation.
- Add responsive and safe-area handling for the target iPad.

**Exit criteria:** the app feels cohesive and playful, Rose is used decoratively rather than as a talking guide, and the interface remains understandable with minimal reading.

### Phase 5 — Content production

- Build the development-only artwork conversion and validation flow.
- Produce and clean the remaining 14 pictures.
- Tune cell counts, palettes, star rewards, and unlock thresholds through real completion sessions.
- Verify that every number/color pairing is solvable and every thumbnail matches its puzzle.

**Exit criteria:** all 15 original pictures pass validation and manual playthrough, with medium pictures averaging near the requested ten-minute duration.

### Phase 6 — Release hardening

- Run the full automated suite and production build.
- Test every primary flow in both Safari and the installed Home Screen experience.
- Test interrupted sessions, rapid input, edge panning, zoom extremes, sound toggling, hints, replays, and progression completion.
- Check contrast, large touch targets, reduced motion, and basic keyboard/mouse fallback.
- Replace temporary branding/assets and perform the final GitHub Pages deployment.

**Exit criteria:** all version-one acceptance criteria below pass on the target iPad with no data-loss or gesture-blocking defects.

## 13. Verification strategy

### Automated tests

- Artwork-schema validation and unlock reachability.
- Coordinate transforms and cell hit testing.
- Drag-path interpolation.
- Correct-color acceptance and wrong-color rejection.
- Hint selection and completion behavior.
- One-time star awards and milestone unlocking.
- Save/load round trips and schema migrations.
- Palette completed-state behavior.
- Gallery-to-game-to-completion browser flow.
- Production build under the GitHub Pages base path.

### Required physical-iPad checks

Browser automation cannot faithfully reproduce Apple Pencil and palm behavior. Test at minimum:

- Pencil tap, slow drag, and fast drag at several zoom levels.
- Finger tap and drag.
- Ten or more consecutive two-finger pan/pinch gestures without accidental coloring.
- Transitioning between Pencil and finger input.
- Incidental palm contacts while using the Pencil.
- Loupe position near every screen edge.
- Long continuous coloring sessions for heat, memory, and frame consistency.
- Returning after reload, tab closure, Home Screen app closure, and device sleep.
- Completion replay and dense confetti on small, medium, and large pictures.

## 14. Version-one acceptance criteria

Arya Color is ready when:

1. It can be opened from the iPad Home Screen in landscape.
2. The gallery shows all 15 pictures, with exactly three initially unlocked.
3. Arya can paint with either Apple Pencil Pro or one finger and navigate with two fingers.
4. Wrong taps do nothing, and fast correct drags do not skip cells.
5. The loupe, manual palette selection, completed checkmarks, sound option, and unlimited hints work as specified.
6. Several pictures can be left unfinished and resumed after closing the app.
7. Every completed picture replays, reveals the clean artwork, and produces rainbow confetti with Rose.
8. Stars are awarded once and visibly unlock pictures at reachable milestones.
9. All artwork and visual branding are original.
10. Automated checks pass and every picture has been completed manually at least once.

## 15. Main risks and mitigations

- **Gesture conflict:** resolve it in Phase 1 on the target hardware before building the rest of the experience.
- **Browser storage loss:** use IndexedDB, immediate completion saves, visibility-change flushing, and persistent-storage requests; consider export/import only in a later release.
- **Canvas performance:** profile real boards on the target iPad, cache static work, render visible cells, and avoid DOM-per-cell rendering.
- **Content inconsistency:** use a strict schema, automated validation, manual pixel cleanup, and complete playthroughs.
- **Over-copying the reference app:** retain general mechanics and familiar usability while creating original artwork, mascot, branding, icons, sounds, wording, and visual styling.
- **GitHub Pages path errors:** deploy the shell in Phase 0 and test all asset URLs from the repository subpath.

## 16. Recommended first implementation increment

The first coding increment should stop after Phase 1: a deployed diagnostic build containing one small grid and the complete Pencil/finger/two-finger interaction model. That prototype gives the earliest reliable answer to the only major technical risk. Once it feels right on the iPad, it becomes the foundation for the complete game rather than a disposable mockup.
