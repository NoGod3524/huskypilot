# Changelog

Every notable change to HuskyPilot, oldest first. Each entry corresponds to a
merged pull request, and each version tag marks the state of `main` right after
that merge.

While the project is pre-1.0 the scheme is deliberately simple:

- **Patch** (`0.1.x`, `0.2.x`, …) — a fix, a cleanup, documentation, or a small addition.
- **Minor** (`0.2.0`, `0.3.0`, …) — a new capability, or a change to the architecture.

## 0.3.1 — Version footer (unreleased)

### Added

- A version footer on every route, read from `package.json` so the version has a
  single source of truth.

## [0.3.0](https://github.com/NoGod3524/huskypilot/releases/tag/v0.3.0) — Real routes

*Minor bump: architecture.*

### Changed

- Replaced the single 1024-line dashboard component with a shared state provider,
  a persistent app shell, and five focused section components.
- Calendar state now lives in the root layout, so moving between routes keeps the
  imported tasks, completion state, language, and reminder settings — with no
  flash of demo data and no repeated auto-refresh request.

### Added

- Real routes, each with its own title: `/` (overview), `/tasks`, `/calendar`, and
  `/insights`. ([#16])
- Sidebar navigation uses `next/link` and marks the active route with
  `aria-current="page"`.

## [0.2.3](https://github.com/NoGod3524/huskypilot/releases/tag/v0.2.3) — Auto-refresh and CSV export

### Added

- Opt-in auto-refresh from a remembered calendar URL. It is off by default, the
  URL is kept in this browser only, and it is removed by unticking the box or
  pressing **Clear saved data**. ([#14])
- CSV export of everything currently on screen, with a UTF-8 byte-order mark so
  Excel reads Chinese text correctly. ([#15])

### Changed

- The privacy wording now says the ICS URL is not stored *unless you explicitly
  ask for it*.

## [0.2.2](https://github.com/NoGod3524/huskypilot/releases/tag/v0.2.2) — Documentation refresh

### Changed

- Both READMEs now document the PWA, reminders, insights, and the optional
  auto-refresh, and the project structure and roadmap are up to date. ([#13])

## [0.2.1](https://github.com/NoGod3524/huskypilot/releases/tag/v0.2.1) — Due-soon reminders

### Added

- A due-soon banner for anything due in the next 24 hours. ([#12])
- Opt-in browser notifications while the app is open, de-duplicated by a task
  fingerprint so the same reminder is never repeated.
- A service worker `notificationclick` handler that brings the open app forward.

## [0.2.0](https://github.com/NoGod3524/huskypilot/releases/tag/v0.2.0) — Installable and offline

*Minor bump: new capability.*

### Added

- A web app manifest, PWA icons, and a theme colour, so HuskyPilot can be added
  to a phone's home screen and opened full screen. ([#11])
- A service worker that caches the app shell: navigations are network-first (so a
  new deploy lands immediately), hashed assets are cache-first, and the import API
  is never cached.
- Safe-area padding so the layout clears the home indicator when installed.

## [0.1.10](https://github.com/NoGod3524/huskypilot/releases/tag/v0.1.10) — Import help

### Added

- An expandable "Where do I find my ICS link?" section on the import card. ([#10])

## [0.1.9](https://github.com/NoGod3524/huskypilot/releases/tag/v0.1.9) — Repository cleanup

### Added

- A secrets audit of the working tree and the full git history before the
  repository was made public.

### Removed

- The assistant prompt file and editor/assistant scaffolding, so the repository
  root only contains project files. ([#9])

## [0.1.8](https://github.com/NoGod3524/huskypilot/releases/tag/v0.1.8) — Continuous integration

### Added

- GitHub Actions running `test`, `lint`, and `build` on every pull request and
  every push to `main`, with least-privilege permissions and concurrency
  cancellation. ([#8])

## [0.1.7](https://github.com/NoGod3524/huskypilot/releases/tag/v0.1.7) — Insights panel

### Added

- A workload analytics section: completion rate, tasks per course, the next 7
  days, and the next 4 weeks. ([#7])

## [0.1.6](https://github.com/NoGod3524/huskypilot/releases/tag/v0.1.6) — Portfolio README

### Added

- A bilingual README (English and Simplified Chinese) with an architecture
  diagram, the SSRF control table, and the design decisions. ([#6])

## [0.1.5](https://github.com/NoGod3524/huskypilot/releases/tag/v0.1.5) — Obsolete panel removed

### Removed

- The outdated "Private by design" panel. ([#5])

## [0.1.4](https://github.com/NoGod3524/huskypilot/releases/tag/v0.1.4) — Dead navigation removed

### Removed

- Sidebar links that pointed at nothing ("Courses" and "Privacy"). ([#4])

## [0.1.3](https://github.com/NoGod3524/huskypilot/releases/tag/v0.1.3) — English / 简体中文

### Added

- A language toggle for the whole interface, including date formatting, remembered
  across visits. ([#3])

## [0.1.2](https://github.com/NoGod3524/huskypilot/releases/tag/v0.1.2) — Task completion

### Added

- A checkbox on every task card, a struck-through title when done, and state that
  survives a refresh and a re-import. ([#2])

## [0.1.1](https://github.com/NoGod3524/huskypilot/releases/tag/v0.1.1) — Local persistence

### Added

- Imported events and their metadata are saved in the browser and restored on
  load, using versioned payloads that recover safely from corrupt data. ([#1])

## [0.1.0](https://github.com/NoGod3524/huskypilot/releases/tag/v0.1.0) — HuskyPilot V0

### Added

- The first working version: paste a HuskyCT / Blackboard ICS link and get the
  next 7 days grouped into Today / Tomorrow / This week.
- An SSRF-hardened server-side download (`safe-fetch.ts`), ICS parsing with
  `node-ical`, and course-name extraction from event titles.
- A `node:test` suite covering parsing, grouping, and URL rejection.

[#1]: https://github.com/NoGod3524/huskypilot/pull/1
[#2]: https://github.com/NoGod3524/huskypilot/pull/2
[#3]: https://github.com/NoGod3524/huskypilot/pull/3
[#4]: https://github.com/NoGod3524/huskypilot/pull/4
[#5]: https://github.com/NoGod3524/huskypilot/pull/5
[#6]: https://github.com/NoGod3524/huskypilot/pull/6
[#7]: https://github.com/NoGod3524/huskypilot/pull/7
[#8]: https://github.com/NoGod3524/huskypilot/pull/8
[#9]: https://github.com/NoGod3524/huskypilot/pull/9
[#10]: https://github.com/NoGod3524/huskypilot/pull/10
[#11]: https://github.com/NoGod3524/huskypilot/pull/11
[#12]: https://github.com/NoGod3524/huskypilot/pull/12
[#13]: https://github.com/NoGod3524/huskypilot/pull/13
[#14]: https://github.com/NoGod3524/huskypilot/pull/14
[#15]: https://github.com/NoGod3524/huskypilot/pull/15
[#16]: https://github.com/NoGod3524/huskypilot/pull/16
