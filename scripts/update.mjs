// Reads projects.json, fetches repo info + latest stable/pre-release from GitHub, writes data.json.
// Usage: node scripts/update.mjs   (set GITHUB_TOKEN to avoid the 60 req/h anonymous limit)
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const headers = { Accept: "application/vnd.github+json", "User-Agent": "ps5-link-centralizer" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

// Authors often publish betas/nightlies without ticking "pre-release", so also look at the tag name.
// ponytail: name heuristic, add a per-project override in projects.json if it misfires
const PRE = /alpha|beta|(?<![a-z])(rc|pre|dev|test)|nightly|canary|experimental|-[0-9a-f]{7,}$/i;
const byVersionDesc = new Intl.Collator("en", { numeric: true }).compare;

function fromReleases(releases) {
  let stable = null, pre = null;
  for (const r of releases) {
    if (r.draft) continue;
    const v = { tag: r.tag_name, url: r.html_url, date: (r.published_at ?? "").slice(0, 10) };
    if (r.prerelease || PRE.test(r.tag_name)) pre ??= v;
    else stable ??= v;
  }
  // only show a pre-release that is newer than the stable one
  if (stable && pre && pre.date < stable.date) pre = null;
  return { stable, pre };
}

// No releases: read tags straight from git (no API quota). Tags carry no date here.
function fromTags(htmlUrl) {
  const out = execFileSync("git", ["ls-remote", "--tags", "--refs", `${htmlUrl}.git`], { encoding: "utf8" });
  const tags = out.split("\n").map(l => l.split("refs/tags/")[1]).filter(t => t && /\d/.test(t));
  tags.sort((a, b) => byVersionDesc(b, a));
  const v = t => t && { tag: t, url: `${htmlUrl}/releases/tag/${encodeURIComponent(t)}`, date: "" };
  const stable = v(tags.find(t => !PRE.test(t)));
  const pre = v(tags.find(t => PRE.test(t)));
  return { stable, pre: pre && (!stable || byVersionDesc(pre.tag, stable.tag) > 0) ? pre : null };
}

const projects = JSON.parse(await readFile("projects.json", "utf8"));
const out = [];

for (const p of projects) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(p.repo ?? "")) throw new Error(`invalid repo: ${JSON.stringify(p)}`);
  const repo = await gh(`/repos/${p.repo}`);
  if (!repo) { console.warn(`skip (not found): ${p.repo}`); continue; }
  const releases = await gh(`/repos/${p.repo}/releases?per_page=30`);
  const { stable, pre } = releases?.length ? fromReleases(releases) : fromTags(repo.html_url);
  out.push({
    name: p.name ?? repo.name,
    url: repo.html_url,
    description: p.description ?? repo.description ?? "",
    category: p.category ?? "",
    stable,
    pre,
    updated: repo.pushed_at.slice(0, 10),
    archived: repo.archived,
  });
  console.log(`${p.repo} -> ${stable?.tag ?? "-"} | ${pre?.tag ?? "-"}`);
}

await writeFile("data.json", JSON.stringify(out, null, 2) + "\n");
