# PS5 Links

Link hub for the PS5 jailbreak scene. Page: GitHub Pages serving `index.html`.

## Add a project

1. Edit [`projects.json`](projects.json) (you can do it right on GitHub with the ✏️ button).
2. Add a line:
   ```json
   { "repo": "owner/repository", "category": "Payload" }
   ```
   Optional fields: `name` and `description` (override the GitHub ones), `category`.
3. Open a Pull Request. The check validates the JSON and that the repo exists.

Don't edit `data.json`, it is generated automatically.

## How it works

- `.github/workflows/update.yml` runs every 6h (and when `projects.json` changes), fetches the latest stable version and the latest beta/pre-release (if newer) of each repo, and commits `data.json`.
- Pre-release = flagged as such on GitHub **or** tag containing `alpha`, `beta`, `rc`, `nightly`, `dev`, `pre`, `test`, `experimental`, or a trailing commit hash.
- Repos without releases: uses tags (`git ls-remote`), sorted by version.
- Local: `node scripts/update.mjs` (Node 20+). Set `GITHUB_TOKEN` to avoid the 60 req/h limit.
