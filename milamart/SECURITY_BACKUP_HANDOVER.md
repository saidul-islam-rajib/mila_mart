# Mila Interior Solutions — Security, Backup & Recovery Handover

## Security posture

The application uses Manus OAuth for passwordless authentication and server-side role checks for protected procedures. The owner account is intended to remain `super_admin`; staff should receive only the minimum operational role required. Finance and customer order data are protected behind authenticated admin procedures.

Secrets such as OAuth, database, storage, and API credentials must remain in the project secret manager/environment. They must never be committed to source files, screenshots, CSV exports, chat messages, or public website copy. This file contains no secret values.

The public application should be protected with HTTPS, secure session cookies, least-privilege access, input validation, file-size limits for photo uploads, privacy consent for AI Decor uploads, and no public exposure of internal order details. Customer photos and payment proofs must be treated as private business data.

## Database and source ownership

The source project is maintained at `/home/ubuntu/buil-company-website` in the Manus project workspace. The main schema is in `drizzle/schema.ts`; database helpers are in `server/db.ts`; backend routers are under `server/routers.ts` and feature router files; customer-facing pages are under `client/src/pages`.

The production database is managed through the configured database connection and should not be copied into source control. A database backup must be created through the hosting/database provider’s approved backup mechanism before destructive schema changes, provider migration, or domain/hosting migration. Do not place a raw database dump in a public web directory.

## Release and rollback

Every approved checkpoint creates a recoverable project version. Before major changes, save a checkpoint with a clear description. After changes, run the automated tests and production build. If a release breaks, use project version history/rollback rather than deleting files or running destructive reset commands.

## Backup schedule recommendation

The owner should maintain provider-managed database backups and periodically export a private copy of important operational data, especially orders, finance ledger entries, and website settings. Store encrypted backups in an owner-controlled private location with restricted access. Test restoration periodically; a backup that has never been restored is not a verified recovery plan.

## Incident response

If unauthorized access is suspected, immediately revoke affected users, rotate relevant provider credentials, invalidate active sessions if the provider supports it, and preserve timestamps, URLs, and error messages. Do not delete logs or customer evidence. Check Hostnin domain changes, Manus project access, OAuth account activity, storage access, and Shopify access separately.

If DNS is changed incorrectly, keep the temporary Manus domain available, restore the last known-good DNS records, and allow DNS caches to expire. Never guess an A record. Use the exact A/CNAME values supplied by Manus Project Settings → Domains.

## Data handling rules

Never fabricate reviews, ratings, testimonials, prices, stock, or customer records. Never publish payment proofs, customer phone numbers, full addresses, AI-uploaded photos, or internal notes. CSV exports should be treated as confidential and deleted from shared devices after secure transfer.

## Required owner actions

The owner must confirm recovery email and MFA for Hostnin, Manus, Shopify, email, and any payment provider. The owner must keep domain registrar access independent from staff access. The owner must approve real product prices, stock, payment configuration, DNS values, and any external hosting migration.

## Custom domain and mail recovery record (2026-09-15)

The verified DNS intent is: root `@` A → `104.18.26.246`, `www` CNAME → `cname.manus.space`, `mail` A → `136.243.82.43`, and MX → `mail.mila-interior-solutions.com`. The root A and www CNAME are for Manus website delivery; the mail A and MX separation preserve the cPanel mail route. Final Manus verification and TLS certificate provisioning remain a required post-DNS step.

## Search Console and HTTPS status (2026-09-16)

Google Search Console ownership was verified using the cPanel TXT record. Google reports the homepage as indexed and served over HTTPS, and `www.mila-interior-solutions.com` has been directly verified as publicly reachable over HTTPS. The bare root domain still returns an SSL mismatch in direct browser testing, so Manus root-domain activation/certificate provisioning must be completed before promoting the bare root URL. Keep the working `www` URL available as the public fallback.
