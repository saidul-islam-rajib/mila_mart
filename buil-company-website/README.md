# Mila Interior Solutions — Navy Atelier

Premium bilingual commerce and operations website for Mila Interior Solutions.

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS
- Express + tRPC
- Drizzle ORM with MySQL/TiDB
- Manus OAuth for passwordless authentication
- Shopify Storefront integration (catalog and card checkout require owner configuration)
- S3-style private storage for uploads and payment proofs

## Local setup

Requirements: Node.js 22+, pnpm 10+, and a MySQL/TiDB database for the full-stack features.

```bash
pnpm install
cp .env.example .env
# Fill .env with the real values in your private deployment environment.
pnpm check
pnpm test
pnpm build
pnpm dev
```

Never commit `.env`, API keys, OAuth secrets, database credentials, payment proofs, customer exports, or production database dumps.

## Important environment variables

See `.env.example`. The full-stack application requires database, session/OAuth, storage/LLM, and optional Shopify credentials. In Manus WebDev, configure these through the project secret manager rather than committing them to the repository.

## Main routes

- `/` — public storefront homepage
- `/shop` — Shopify-backed product catalog
- `/stickers` — sticker gallery and category browsing
- `/sticker-order` — custom measurement-based sticker checkout with COD
- `/wallpapers` — wallpaper gallery
- `/decor-preview` — AI decor concept workflow
- `/track-order` — customer order lookup
- `/admin` — protected admin dashboard

## Production notes

The public storefront is designed for the verified `www.mila-interior-solutions.com` address. The bare root domain requires final certificate activation in the Manus Domains panel. Real Shopify products, inventory, variants, and payment settings must be configured and tested by the owner before advertising product checkout as live.

## Security and ownership

Admin access uses passwordless Manus OAuth and server-side role checks. Keep the owner account, domain registrar, hosting, database, Shopify, email, and payment-provider recovery methods under owner control. Review `OWNER_TRAINING.md`, `SECURITY_BACKUP_HANDOVER.md`, and `MARKETING_LAUNCH_GUIDE.md` before deployment.

## GitHub upload

Create a private GitHub repository first if the code should not be publicly visible. Then upload this project after checking that no secret files are included:

```bash
git init
git add .
git commit -m "Initial Mila Interior Solutions website"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git
git push -u origin main
```

The included `.gitignore` excludes dependencies, build output, logs, local environment files, and database files.
