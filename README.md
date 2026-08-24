# Neon Drift — Neon Workshop Community Expansion v1.1

This package adds a GitHub-backed creator ecosystem to Neon Drift without putting a GitHub write token in the browser game.

## Files to add/update in the repository

- `neon-drift.html` — the expanded game.
- `neon-workshop.js` — readable standalone copy of the injected Workshop module.
- `community/config.json` — public Workshop configuration.
- `community/index.json` — canonical public creation/community database.
- `community/covers/` — validated creator showcase images.
- `scripts/neon-workshop-lib.mjs` — validation, ingestion, analytics, creator XP, rankings and awards.
- `scripts/neon-workshop-ingest.mjs` — handles NDW/NDE submissions.
- `scripts/neon-workshop-maintenance.mjs` — scheduled catalog maintenance.
- `.github/ISSUE_TEMPLATE/neon-workshop.yml` — player submission form.
- `.github/workflows/neon-workshop-ingest.yml` — validates and publishes player submissions/events.
- `.github/workflows/neon-workshop-maintenance.yml` — daily difficulty/ranking/award maintenance.

## v1.1 clipboard-safe publishing

Publishing and sharing no longer depend on automatic browser clipboard permission. **GET GITHUB CODE**, **SHARE CODE**, and **SYNC** now keep the complete NDW/NDE code in a visible, scrollable text box with **SELECT ALL**, **COPY**, and **DOWNLOAD CODE** controls. GitHub is opened from that same dialog after the player has the code. This works even when Chrome blocks programmatic clipboard access for a local HTML file.

## GitHub data flow

1. The game reads `community/index.json` from GitHub Pages, with raw GitHub as a fallback.
2. Publishing a creation makes a compressed `NDW1...` code and copies it.
3. The game opens the repository's Neon Workshop issue form. The player pastes the code and submits it.
4. GitHub Actions decodes and validates the data, strips unsafe text, checks size/type limits, optionally extracts a small cover image, and commits the canonical result to `community/`.
5. Likes, ratings, comments, follows, plays, finish records, fall locations, lobby shares and other activity are queued locally and compressed into one `NDE1...` batch when the player presses **SYNC**.
6. Daily maintenance recalculates completion rate, player-derived difficulty, trending scores, creator XP/levels, badges, Featured picks, fall analytics, and weekly Creator Awards.

No GitHub credential is placed in `neon-drift.html`.

## Expansion feature coverage

1. **Neon Workshop / Community Gallery** — full-screen gallery with search and filters.
2. **Share Codes** — NDW1 compressed creation/share codes and NDE1 batched event codes.
3. **Creator Profiles** — public creations, XP, level, followers, plays, likes and badges.
4. **Featured Creations** — maintained automatically from community performance.
5. **Remix** — supported for editor levels, curve tracks, cars and scenery/prefabs with parent attribution.
6. **Version History** — public version number plus retained update history; saved favorites show `UPDATE AVAILABLE` when newer.
7. **Comments / Reactions** — short moderated comments plus seven structured reactions.
8. **Category Ratings** — Fun, Design, Creativity, Racing and Battle ratings.
9. **Creator Challenges** — themed build challenges stored in the public catalog.
10. **Community Cups** — creator-built sets of up to 12 community creations.
11. **Playlists** — larger community creation collections.
12. **Challenge Maker** — Finish, Time, Coins, No Fall, Win and Survive objectives.
13. **Creator Rules** — mode, battle mode, laps, speed, gravity, hazards, items and team settings travel with published creations.
14. **Ghost Sharing** — Time Trial ghost samples can be published and installed.
15. **Replay Gallery** — replay frames/events/FX can be published and replayed through Neon Drift's replay system.
16. **Screenshot / Showcase Camera** — current 3D renderer can make a small cover image and an in-race showcase photo.
17. **Creator Badges** — first creation, play/like milestones, specialist and award badges.
18. **Creator Levels** — creator XP is earned mainly from other players interacting with creations, not simply uploading.
19. **Favorites / Collections** — favorites plus named local collection folders.
20. **Following Creators** — Follow/Unfollow is synchronized to GitHub; Following has its own discovery tab.
21. **Surprise Me** — random playable community creation.
22. **Discovery Views** — Featured, Trending, New, Top Rated, Most Played, Following, Friends, Favorites and My Work.
23. **Creator Collaboration** — publication metadata supports up to eight collaborators.
24. **Blueprint / Prefab Sharing** — publish/import builder JSON or Battle Studio catalog data as reusable prefabs.
25. **Custom Scenery Packs** — Battle Scenery Studio catalog snapshots can be published/imported.
26. **Creator Analytics** — plays, finishes, likes, remixes, completion rate, average time, fall counts and most common fall zone.
27. **Player-derived Difficulty** — NEW/EASY/NORMAL/HARD/EXTREME/LEGENDARY based on public completion rate after enough plays.
28. **Neon Creator Awards** — weekly Track of the Week, Most Creative and Best Looking awards.
29. **Multiplayer Creation Hub** — Workshop button inside the online UI and `SHOW IN LOBBY` for compatible creations.
30. **Post-match Community Actions** — Like, Save, Follow, Remix and Next Community Level on the finish screen.

## Validation performed when this package was built

- Every classic inline JavaScript block in the expanded HTML was extracted and checked with `node --check`.
- `neon-workshop.js`, ingest, maintenance and library scripts were checked with Node.
- All JSON files were parsed.
- All GitHub YAML files were parsed.
- The Workshop browser module passed a headless Chromium integration harness covering gallery loading, Friends discovery, detail UI, reactions, ratings, comments, favorites, collections, remixing, creator profiles, all publisher types, challenge/cup builders, play integration, post-match actions, the online Workshop button, Showcase Camera, and NDW decoding.
- A complete compressed NDW1 creation was decoded, ingested, maintained and verified in an isolated test copy.
- Event batching was tested for plays, finishes, likes, ratings, reactions, comments, fall analytics and creator following, including event-ID deduplication.

## Publishing note

GitHub Pages may take a short time to serve a newly committed `community/index.json`. The Workshop refresh button bypasses the normal browser cache.


## v1.2 code-generation reliability fix

Publishing now displays the generated code before any clipboard operation. Compression uses a streaming pipe so large custom levels cannot stall from CompressionStream backpressure. If gzip fails, an NDW0 uncompressed fallback is generated and displayed instead.
