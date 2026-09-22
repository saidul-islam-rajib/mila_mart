# Mila Interior Solutions — Owner Training & Safe Management Guide

## 1. Website access

The live website is hosted on Manus WebDev. The current temporary address is `https://builweb-m4zaxxc3.manus.space`. The verified public custom-domain URL is `https://www.mila-interior-solutions.com`; the bare root `https://mila-interior-solutions.com` still needs Manus root-domain certificate activation.

Admin access uses passwordless Manus OAuth. There is no separate website username/password. Sign in with the owner account `milamartbd@gmail.com`; never share an OTP or session with staff.

## 2. Admin panel

Open `/admin` on the active website after signing in. The main areas are **Orders**, **Home Service**, **Products**, **Website**, **Finance**, and **Storefront**.

Use **Orders** to review customer orders, delivery details, payment references, selected designs, measurements, internal notes, assignment, and operational status. Use **Home Service** for installation and service requests. Use **Website** only for approved public copy and contact settings. Use **Finance** for the internal management ledger; it is not a tax, audit, or statutory accounting system.

## 3. Finance management

Create one ledger entry per real revenue or expense. Always enter the date, category, amount, payment method, description, and reference where available. Monthly recurring references can be carried forward from the Finance page. Do not delete old records; correct mistakes with a new corrective entry.

## 4. Product and order management

Add only owner-approved product names, prices, stock, variants, and images. Never publish placeholder prices, fabricated stock, reviews, ratings, or testimonials. For sticker orders, review each measurement row, selected quality, square-foot calculation, delivery option, advance payment, and due amount before confirming.

## 5. Shopify

The storefront integration is prepared, but real products, variants, stock, and card-payment settings must be configured and tested by the owner before claiming live Shopify checkout.

## 6. Domain management

The domain is registered in Hostnin. Hostnin Dashboard → **Domains** → `mila-interior-solutions.com` is the domain management path. Manus Project Settings → **Domains** must first provide the exact A/CNAME records for this project. Copy those records exactly into Hostnin DNS; do not guess an IP address. Keep email MX/TXT records unchanged unless the mail provider instructs otherwise.

## 7. Safe operating rules

Use a unique owner email, enable MFA where available, never paste passwords or OTPs into chat, and do not grant admin access to unknown users. Give staff the minimum role required. Do not upload customer photos or order exports to public links. Keep payment screenshots and customer data private.

## 8. Recovery

If a staff account is compromised, revoke its access immediately and rotate the affected provider credentials. If the domain stops resolving, keep the Manus temporary URL available, check Hostnin DNS and nameserver status, and contact Hostnin support without changing records randomly. For a suspected website or OAuth issue, preserve the error time and URL, then use the project version history to roll back only after reviewing the impact.

## 9. Owner checklist

Before public promotion, confirm the custom domain resolves with HTTPS, the owner can sign in, a test order reaches Admin Orders, Finance access is restricted, payment instructions are correct, and the domain and hosting accounts use owner-controlled recovery email and MFA.

This guide intentionally contains no passwords, OTPs, API keys, database credentials, customer records, or payment secrets.

## 10. Custom DNS configuration status (2026-09-15)

Configured for `mila-interior-solutions.com`:

- Root `@` A record → `104.18.26.246` (Manus-provided fallback when root CNAME is not supported)
- `www` CNAME → `cname.manus.space`
- `mail` A record → `136.243.82.43` retained for cPanel mail
- Root MX → `mail.mila-interior-solutions.com` so email does not route through the website edge

Public DNS lookup confirmed the root A, `www` CNAME, and MX records. Final Manus domain verification and certificate provisioning must still be completed from the project Domains panel; until that completes, the custom domain may show a temporary Cloudflare or SSL error.

## 11. Google Search visibility status (2026-09-16)

Google Search Console ownership for `mila-interior-solutions.com` was verified through the cPanel TXT record. The homepage URL is currently reported as indexed and served over HTTPS by Google Search Console. The public `www.mila-interior-solutions.com` address opens successfully over HTTPS. The bare root address may still show an SSL mismatch until Manus completes root-domain activation and certificate provisioning; keep using the working `www` address until that is resolved.
