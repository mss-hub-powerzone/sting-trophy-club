# Fall 2026 family registration

The family hub lives at `/tournaments`. Plans and team photos are public. Roster details, saved commitments, team counts, hotel information, and album links are returned only after email verification. No ChatGPT account is used.

## Runtime configuration

- `TOURNAMENTS_DB`: private D1 database configured in `tournaments.config.json`.
- `TOURNAMENTS_EMAIL`: Cloudflare Email Sending binding restricted to the configured sender.
- `TOURNAMENTS_FROM_EMAIL`: sender address from `tournaments.config.json`.
- `TOURNAMENTS_AUTH_SECRET`: random secret of at least 32 characters, configured as an encrypted production runtime secret. Never commit it.

Apply `db/tournaments.sql` to the dedicated database. Roster mappings, staff email addresses, album URLs, and legacy registration data must be imported privately; do not commit seed data to this public repository. The `players.emails` column contains a JSON array of normalized roster emails. `staff` assigns manager access across both teams. The `settings` row with key `albums` contains an array of `{title,url}` objects; `hotel` stores the manager-edited room block.

Sign-in codes expire after ten minutes and five guesses. Resends have a 60-second cooldown, with hourly limits per email and IP. Codes are HMAC hashed; session tokens are randomly generated and stored only as hashes. Secure, HttpOnly, SameSite cookies expire after seven days. Removing an email from the roster/staff tables revokes access on the next request. Logout revokes the stored session.

## Registration and payments

Commitments close October 31, 2026 at 11:59 p.m. America/Chicago. Payments are due November 7. Managers can adjust commitments after the deadline and maintain hotel and payment records. The site records payments; it does not charge families or publish Snap! Spend invoices. Manager CSV exports show event selections and player balances for invoicing/reconciliation. Prices and allowed team/event combinations are validated on the server.

## Validation

- `node --test tests/tournaments-auth.test.mjs`: isolated in-memory authentication, roster, limits, expiry, replay, and price/deadline checks (Node 24).
- `node tests/tournaments-api.test.mjs`: dedicated disposable local QA worker at port 8791, seeded with synthetic families and one-use test challenges. Never point this test at production. It writes test commitments, payments, and hotel settings.
- `node node_modules/typescript/bin/tsc --noEmit`
- `npm run build` on the Cloudflare/Linux build environment.

Production smoke checks must confirm anonymous responses contain no family data, identity headers cannot impersonate a family, email delivery/verification works, imported records are preserved, and the public website link opens the same-domain hub. Preserve the previous deployment for rollback and reconcile any late writes in the legacy hub before retiring it.
