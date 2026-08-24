# Install Neon Workshop in the GitHub repository

The package is already laid out using the repository paths.

1. Replace the repository root `neon-drift.html` with the included expanded file.
2. Add `neon-workshop.js` at the repository root. The expanded HTML already has the same module injected, but keeping this readable copy in the repository makes maintenance easier.
3. Add the `community/`, `scripts/`, and `.github/` files exactly where shown.
4. Commit and push.
5. In GitHub repository **Settings → Actions → General**, make sure workflows are allowed to use the repository `GITHUB_TOKEN` with the permissions declared in each workflow.
6. Make sure GitHub Issues are enabled. The Workshop uses the `Neon Workshop Submission` issue form as the safe player-to-GitHub write queue.
7. GitHub Pages must continue serving the repository so the game can read `community/index.json`.

After installation, open Neon Drift and choose **NEON WORKSHOP · COMMUNITY** from the game menu. The catalog starts empty; the first accepted NDW submission becomes the first public creation.

The browser contains no GitHub write credential. GitHub Actions performs all canonical writes after validation.


## Publishing a level after v1.1

In the Custom Level Editor, load the level and press **PUBLISH CURRENT LEVEL**. In the Workshop publish screen press **GET GITHUB CODE**. The complete `NDW1...` code remains visible in a large text box. Use **SELECT ALL** and then Cmd+C (Mac) / Ctrl+C (Windows), or use **DOWNLOAD CODE** if browser clipboard access is blocked. Then press **OPEN GITHUB** and paste the code into the Neon Workshop submission issue.


### Publishing code troubleshooting
In v1.2, **GET GITHUB CODE** always opens a visible code box after generation. Use SELECT ALL or DOWNLOAD CODE if clipboard access is blocked.
