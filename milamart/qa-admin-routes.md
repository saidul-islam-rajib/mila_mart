# Admin route QA

- Checked `/admin/finance` on the live preview URL.
- Result: route resolves to the application and shows the intended authentication gate: “Sign in to continue”. No 404 or blank-route failure was observed.
- Full recurring carry-forward UI cannot be inspected in the sandbox browser because no authenticated admin session is available. The database-backed caller test covers create → carry-forward → list/summary → duplicate re-run behavior.
- `/admin/website-management` also resolves to the authentication gate without a 404.
- `/admin/home-service` initially returned 404. An alias was added to the existing `/admin/services` AdminDashboard route, and reload verification now resolves to the authentication gate without a 404.
- Owner action for a complete browser QA: sign in with the project owner account, open `/admin/finance`, run the September carry-forward action, and confirm the new monthly entry appears once in the ledger. Then inspect `/admin/home-service` as the Home Service queue.
