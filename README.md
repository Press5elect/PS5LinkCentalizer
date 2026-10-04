# PS5 Links

Centralizador de links da cena de jailbreak do PS5. Página: GitHub Pages servindo `index.html`.

## Adicionar projeto

1. Edite [`projects.json`](projects.json) (dá pra fazer direto pelo GitHub, botão ✏️).
2. Adicione uma linha:
   ```json
   { "repo": "dono/repositorio", "category": "Payload" }
   ```
   Campos opcionais: `name` e `description` (sobrescrevem os do GitHub), `category`.
3. Abra o Pull Request. O check valida o JSON e se o repo existe.

Não edite `data.json` — é gerado automaticamente.

## Como funciona

- `.github/workflows/update.yml` roda a cada 6h (e quando `projects.json` muda), busca a última versão estável e a última beta/pre-release (se mais nova) de cada repo e commita `data.json`.
- Pre-release = marcada como tal no GitHub **ou** tag com `alpha`, `beta`, `rc`, `nightly`, `dev`, `pre`, `test` ou hash de commit no final.
- Repo sem releases: usa as tags (`git ls-remote`), ordenadas por versão.
- Local: `node scripts/update.mjs` (Node 20+). Defina `GITHUB_TOKEN` para evitar limite de 60 req/h.
