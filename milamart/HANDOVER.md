# Mila Interior Solutions — Website Handover

## Current release scope

This release contains the Navy Atelier public website, bilingual customer order flow, All Stickers and Wallpapers galleries, custom sticker price calculator, order tracking, printable cash memo, secured admin operations, finance ledger, Website Management controls, and spreadsheet-compatible order export.

## Customer-facing operations

Customers can browse the existing Fashion, New Arrivals, and AI Decor pages without those categories being removed or hidden. Sticker and wallpaper catalogue cards now offer a design-selection action and an **Order Now** path. The custom sticker checkout accepts the selected design list, independently priced surface/quality rows, delivery choice, customer address, special instructions, payment choice, optional advance-payment proof, and produces an immutable Mila order number plus cash memo.

The calculator continues to use the agreed formula:

> `length (in) × width (in) × quantity ÷ 144 = square feet`

Each row uses its own quality rate. Customers may add measured surfaces until the intentional operational limit of 50 rows; this protects server performance while covering unusually large multi-item orders.

## Admin ownership and roles

The verified owner account `milamartbd@gmail.com` is now assigned the **super_admin** role. The server enforces this owner-level permission for Website Management settings. Authorised `admin` and `moderator` roles can access the order workspace, while moderators do not see Finance. No customer order details are exposed by public order tracking.

Admin routes include **Orders**, **Home Service**, **Products**, **Website**, **Finance**, and **Storefront**. Home Service has its own queue based on home-delivery/service requests. Order detail supports staff assignment, follow-up time, internal note, complaint/resolution note, operational status and saved design information; these details are internal and do not appear in customer tracking.

## Website and business controls

The owner-only **Website Management** desk stores editable public settings such as the hero eyebrow, headline, helper copy, contact phone and contact email. Public settings are persisted in the database; secret business or customer data should never be entered as public website content.

The Finance desk provides an append-only management ledger for revenue, costs, campaign/platform, product purchase, materials, packaging, rent/utilities, courier/Pathao, service income, salaries, digital payments and payment references. Monthly profit/loss is calculated from recorded revenue minus recorded expense. It is a management tool, not a statutory accounting, tax, or audit report.

## Spreadsheet-ready order data

Authorised staff can use **Export CSV** in Order Management to download a spreadsheet-compatible file. It contains the generated order ID, product/design selection, measurements, quality, delivery, payment status/reference, customer-entered delivery information, service preferences, assignment, follow-up and internal complaint fields.

The owner’s existing Google Sheet is available at:

`https://docs.google.com/spreadsheets/d/1EMmgfqbra3scEx6qPR7Tzcy2GZHQvAzBKZedq1GznkE/edit`

It currently contains, among others, `Customer Order Tracker Dashboard 1`, `Sheet1`, and `Sales Pipeline` sheets. Automatic writes to this spreadsheet are deliberately not enabled in the release, because enabling them requires an explicit owner-approved integration that will transmit customer order data to Google. The CSV export is ready for Excel/Google Sheets import immediately.

## Publishing and custom domain

Saving this release checkpoint publishes the current version to the platform’s managed hosting. The intended custom domain, `milainteriorsolution.com`, did not resolve during the final readiness check. Before assigning it in the project Settings → Domains panel, configure the DNS records provided there with the domain registrar and wait for propagation. The temporary platform domain stays available until that process is complete.

Shopify storefront/cart scaffolding is integrated. However, the connected Shopify catalog currently has no real products and no verified live card-payment provider. Therefore, no real product price, stock, checkout or payment is claimed as live in this handover. Add owner-approved products/variants/images/prices in the Product Manager and configure Shopify Settings → Payments before enabling real card checkout.

## Final verification

The release candidate passed TypeScript checking, production build, and 36 automated tests. One live Shopify smoke test is intentionally skipped because the actual catalogue is empty. Development logs contain two historical errors from an earlier temporary schema/import state; the services were restarted afterwards and the current build/check pass.

## External hosting and domain handover

The current production release is hosted and auto-published through Manus WebDev at `builweb-m4zaxxc3.manus.space`. For the preferred custom domain, add the DNS records shown in the project Settings → Domains panel at the domain registrar, then wait for DNS propagation and verify HTTPS.

If Mila later moves hosting to Hostnin or another external provider, export the source and recreate the Node/Express runtime, environment secrets, MySQL/TiDB database connection, S3/storage configuration, OAuth callback URL, and Shopify credentials there. Do not copy secrets into source files. The external host must support the project build command and a persistent database connection. The Manus-managed domain and auto-publish/rollback workflow do not automatically transfer to Hostnin.

Before any external migration, take a database backup and test the storefront, admin OAuth, sticker order, payment-proof upload, finance ledger, CSV export and Shopify checkout in staging. Keep Manus hosting available until the external domain, HTTPS, authentication, storage and order flows are verified.

Current external blockers: `milainteriorsolution.com` DNS was not resolving during the last check; Shopify has no live products and payment provider configuration is still pending. No production product, price or payment claim should be published until the owner confirms those details.
