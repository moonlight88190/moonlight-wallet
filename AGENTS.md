<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

# Moonlight Wallet — agent rules

- Balances live in `wallets.balance_usd` (USD base) and change only via SECURITY DEFINER SQL functions (`send_transfer`, `admin_credit`) that also write `ledger_entries` — never update balances from client code.
- Display currency is `profiles.preferred_currency`; conversion is display-only using `exchange_rates` (quote per 1 USD), refreshed daily from Frankfurter in `src/lib/rates.functions.ts`.
- Transactions snapshot names, fx_rate and recipient amount so history never changes with new rates.
- Admin access: code in `ADMIN_ACCESS_CODE` secret, verified server-side in `src/lib/admin.functions.ts`, which issues a short-lived HMAC token (`ADMIN_SESSION_SECRET`); failed attempts rate-limited via `audit_logs`.
- QR payload format is `moonlight:<WALLET_CODE>`.
- Closed-loop simulation: never connect balances to real payout rails.

## Development Authentication
- In local development (`import.meta.env.DEV`), the `/login` route renders a "Local Dev Helper" panel.
- Default dev credentials: `lucianfereldenlord@gmail.com` / `12345678` (configurable via `VITE_DEV_LOGIN_EMAIL` and `VITE_DEV_LOGIN_PASSWORD`).
- Automated agents and Playwright tests can click "1-Tap Dev Sign In" or fill these credentials directly.

