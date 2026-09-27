# Moonlight Wallet App

Build the complete frontend and application foundation for a premium international wealth-transfer and wallet application called MOONLIGHT WALLET.

The attached image is the official Moonlight Wallet logo.

IMPORTANT:

- Use the uploaded logo exactly as the brand logo.
- Do NOT redesign, regenerate, or replace the logo.
- Find/use appropriate real brand assets and imagery for payment methods, banks, gift cards, financial services and other supported services.
- Use official/licensed assets where possible.
- If an official asset cannot legally/technically be used, use a clean neutral icon instead.
- Do not fabricate official logos.

The visual direction must be Apple-inspired minimalism: extremely clean, spacious, premium, restrained and elegant.

This is a closed-loop project/simulation. Do NOT connect simulated wallet balances to real-world payouts or financial accounts.

⸻

1. CORE PRODUCT CONCEPT

Moonlight Wallet is an international wallet and wealth-management interface focused initially on:

- India
- Philippines
- International users

Users should be able to:

- Create an account
- Login with Google
- Login with email/password
- Receive money
- Send money
- Track transactions
- View balances
- Change display currency
- Redeem/withdraw through simulated payout methods
- View gift-card options
- View financial/wealth-management features
- Explore investment/market information
- Manage account settings
- Receive money through their unique wallet ID and QR code

The website must require authentication before users can access their wallet.

⸻

2. TECHNOLOGY

Use a modern scalable stack.

Preferred:

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- Supabase Authentication
- GitHub

GitHub must be the source of truth for the project.

Structure the project so other AI coding agents can later clone the GitHub repository and continue development without rebuilding the frontend.

⸻

3. SUPABASE

Connect the project to Supabase.

Prepare architecture for:

Authentication
Users
Profiles
Wallets
Wallet IDs
QR codes
Balances
Transactions
Transfers
Withdrawals
Gift cards
Investment data
Settings
Admin actions
Audit logs

Do not put financial state only in frontend state.

Use proper database architecture.

⸻

4. AUTHENTICATION

The first screen must be authentication.

Create:

/login
/register
/forgot-password

Login options:

Google

“Continue with Google”

Use Supabase Google OAuth.

Email

Email
Password

Remember session.

Forgot password.

Registration:

Full name
Email
Password
Confirm password

After successful registration:

→ create user profile
→ create unique Moonlight wallet ID
→ create wallet record
→ generate unique QR code
→ redirect to dashboard

Every account must have its own independent wallet.

⸻

5. WALLET ID

Every user receives a unique wallet ID.

Example:

ML-7F82-29AX

Display this in the profile and receive-money page.

Also generate a unique QR code representing the wallet ID.

The QR code should allow another Moonlight user to identify the recipient during the Send flow.

⸻

6. APPLE-STYLE DESIGN

The entire interface should look like a premium Apple-designed financial application.

DO NOT make it look like:

- A generic banking template
- A crypto dashboard
- A casino website
- A neon fintech website
- A complicated enterprise dashboard

Design language:

- Huge whitespace
- Large elegant typography
- Thin separators
- Minimal cards
- Subtle shadows
- Soft transitions
- Clean monochrome icons
- High-quality imagery
- Restrained accent color
- Excellent alignment

Use the uploaded Moonlight logo.

Typography should feel similar to modern Apple product interfaces.

Use system font / SF-style typography where available.

⸻

7. LANDING / AUTHENTICATION EXPERIENCE

Before login:

Minimal Moonlight Wallet presentation.

Logo

MOONLIGHT WALLET

Headline:

“Move money without the complexity.”

Short supporting copy.

Buttons:

Continue with Google
Continue with Email

The landing page should be extremely minimal.

Do not overwhelm the user with marketing content.

⸻

8. MAIN DASHBOARD

After login:

Create an Apple-style financial dashboard.

Top navigation:

Moonlight logo

Search

Notifications

Three-dot menu

Profile

⸻

BALANCE

The most prominent element should be:

YOUR BALANCE

$500.00

USD

Next to the currency:

small elegant currency selector button

Supported currencies should include at minimum:

USD
EUR
GBP
INR
PHP
SGD
AUD
CAD
JPY
CHF

Changing the currency changes the displayed equivalent value.

IMPORTANT:

The underlying wallet balance must remain ledger-based.

Do NOT change the stored wallet balance simply because the user changes display currency.

⸻

9. LIVE FX API

Research and select a reliable currency/exchange-rate API.

Possible providers to evaluate:

- Frankfurter / ECB
- ExchangeRate.host
- Open Exchange Rates
- Fixer
- CurrencyAPI

Choose the most appropriate option based on:

- Free/low-cost availability
- API reliability
- Supported currencies
- Rate limits
- Ease of integration

Exchange rates should be refreshed approximately every 24 hours and cached.

Store the exchange rate used for individual transfers so historical transactions do not change when current FX rates change.

Display:

1 USD
≈ XX.XX INR

1 USD
≈ XX.XX PHP

etc.

⸻

10. QUICK ACTIONS

Immediately below the balance:

SEND

RECEIVE

REDEEM

Use minimalist icons.

No giant colorful buttons.

⸻

11. SEND MONEY

When user clicks Send:

Open a beautiful Apple-style Send Money flow.

First step:

“Who are you sending to?”

Options:

Search Wallet ID
Search Email
Scan QR

Allow:

Sender’s account email
Sender’s wallet ID

IMPORTANT:
The wording and database logic must distinguish sender and recipient correctly.

The logged-in user is the sender.

The selected wallet/account is the recipient.

⸻

12. QR SCANNER

Create a QR scanning interface.

The user can scan another Moonlight Wallet QR code.

The QR should resolve to the recipient’s Moonlight wallet ID.

Use a suitable QR generation/scanning library.

Do not require an external payment system.

⸻

13. SEND AMOUNT

After selecting recipient:

Amount

Currency

Optional note

Example:

Send

€250.00 EUR

Recipient receives:

₹XX,XXX INR

or

₱XX,XXX PHP

depending on recipient’s preferred currency.

Show:

Exchange rate
Fee
Recipient receives
Total

Then:

Review

Confirm Transfer

⸻

14. RECEIVE

Create a beautiful Receive page.

Show:

Receive money

Your Moonlight ID

ML-XXXXXXXX

QR CODE

Buttons:

Copy ID
Share
Show QR

Other Moonlight users can use the ID/email/QR during Send.

⸻

15. WITHDRAW / REDEEM

Below Send/Receive on the dashboard, create a prominent but elegant:

REDEEM

section.

Supported simulated redemption methods should include:

India

UPI
Bank Transfer
Gift Cards

Philippines

GCash
Bank Transfer
Gift Cards

International

Bank Transfer
Gift Cards
Other supported methods

Do NOT connect these interfaces to real payout rails.

They are simulated redemption workflows.

⸻

16. PAYMENT METHOD IMAGERY

Research and obtain appropriate official/licensed visual assets for:

UPI
Google Pay
PhonePe
Paytm
GCash
Visa
Mastercard
Major Indian banks
Major Philippine banks
Amazon gift cards
Other major gift-card providers

Use real recognizable assets where legally/technically appropriate.

Do not generate fake logos.

Do not randomly scrape copyrighted assets.

Prefer official brand/media resources or properly licensed assets.

Keep the logos small and tasteful.

⸻

17. UPI REDEMPTION

Clicking:

Redeem → UPI

opens:

Redeem via UPI

UPI ID

Amount

Currency

Continue

Review screen:

Amount
UPI ID
Method
Status

Confirm Redemption

Create realistic loading/status screens.

This must remain an internal simulation.

Do NOT submit a real UPI transaction.

⸻

18. GCASH

For Philippine users:

Redeem → GCash

Show:

GCash number
Amount
Currency

Review

Confirm

Use appropriate GCash branding where permitted.

Again, this is an internal simulation and must not actually move funds.

⸻

19. BANK WITHDRAWAL

Create a polished bank withdrawal interface.

Fields:

Account holder
Bank name
Account number
IFSC for India

For Philippines:

Account holder
Bank
Account number

For other countries, show relevant fields as appropriate.

Do not connect to real bank payout APIs.

⸻

20. GIFT CARDS

Create a luxury gift-card marketplace section.

Examples:

Amazon
Apple
Google Play
Steam
PlayStation
Xbox
Other major supported brands

Show:

Brand logo
Card amount
Currency
Availability

Use real brand imagery/assets where permitted.

The actual redemption/purchase mechanism should remain simulated unless a legitimate gift-card provider is later deliberately integrated.

⸻

21. MONEY TRACKING

Below the withdrawal/redeem section:

MONEY ACTIVITY

Show a clean financial activity overview.

Examples:

Received from Rahul
+₹25,000

Sent to Alice
−€250

Gift card
−₹5,000

Currency conversion
€250 → ₹XX,XXX

Include:

Today
This week
This month

⸻

22. TRANSACTION HISTORY

Create a detailed history page.

Show:

Who sent it
Who received it
Amount
Currency
Converted amount
Date
Time
Transaction ID
Status
Method
Note

Statuses:

Completed
Pending
Processing
Failed
Cancelled

Clicking a transaction opens a premium receipt/details screen.

⸻

23. MONEY ANALYTICS

Create a spending/transfer analysis section.

Show:

Money received
Money sent
Redeemed
Gift cards
Monthly activity

Use clean Apple-style charts.

Do not overpopulate the dashboard.

Charts should be simple and elegant.

⸻

24. INVESTMENT / WEALTH SECTION

Create a section called:

INVEST

The purpose is to make Moonlight feel like a broader wealth-management application.

Include:

Stocks
Market overview
Watchlist
Portfolio
Market movers
Indices
Investment education
Currency markets

For market data, research suitable APIs such as:

- Alpha Vantage
- Finnhub
- Twelve Data
- Polygon/Massive
- Financial Modeling Prep

Choose based on:

- Free tier
- API limits
- Market coverage
- India availability
- Philippines availability
- Ease of implementation

Initially, this can be market-data/portfolio simulation rather than actual brokerage execution.

Do NOT connect to a real brokerage unless explicitly implemented later.

⸻

25. WEALTH FEATURES

Create an expandable “More” area with features such as:

Investments
Stocks
Portfolio
Watchlist
Market data
Currency exchange
Savings goals
Financial activity
Gift cards
Transfers
Payment methods

Keep these visually consistent.

Do not clutter the main dashboard.

⸻

26. THREE-DOT SETTINGS MENU

The main site should have a subtle three-dot menu.

Clicking it opens an Apple-style menu/sheet.

Options:

Settings
Profile
Security
Notifications
Language
Currency
Appearance
Help
About
Logout

⸻

27. SETTINGS

Create a comprehensive settings page.

Sections:

Appearance

Light
Dark
System

Language

English
Hindi
Filipino
Other supported languages

Currency

Default currency

Notifications

Transfers
Redemptions
Security
Marketing

Security

Change password
Sessions
Login activity
Two-factor authentication preparation

Privacy

Data settings
Account information

Account

Profile
Wallet ID
Logout
Delete account

Make this feel like iOS Settings.

⸻

28. PROFILE

Profile page:

Profile photo
Name
Email
Wallet ID
Account creation date

QR code

Account status

Preferred currency

Preferred language

⸻

29. ABOUT US

Create a beautifully designed About page.

Use the Moonlight logo.

Title:

MOONLIGHT

“Move money without the complexity.”

Sections:

Our Mission
Global Wallet
Security
Technology
Wealth Management
Frequently Asked Questions
Contact

Use minimal Apple-style typography and large whitespace.

⸻

30. HIDDEN ADMIN ACCESS

At the very bottom of the About page, add a subtle:

“Authorized Access”

Do not place Admin in the main navigation.

Clicking Authorized Access opens an admin-code screen.

Initial project admin code:

4336

IMPORTANT SECURITY REQUIREMENT:

Do NOT hardcode 4336 into client-side JavaScript.

Store the authorized code securely server-side / in a protected environment variable or proper admin credential system.

Validate it server-side.

The visible frontend should only submit the entered code to the protected backend endpoint.

After successful authorization:

→ /admin

⸻

31. ADMIN — PHASE 1

For now, the admin area should ONLY have:

Add Balance

Fields:

User
Currency
Amount
Reason

Example:

User:
ML-123456

Currency:
USD

Amount:
500

Reason:
Internal simulation funding

Submit

The resulting balance adjustment must be recorded as an audit/ledger event.

Do not add other admin financial controls yet.

The admin functionality must never be accessible merely by knowing a frontend URL.

Use proper server-side authorization.

⸻

32. DATABASE ARCHITECTURE

Prepare a scalable schema.

Suggested tables:

users
profiles
wallets
wallet_balances
ledger_entries
transactions
transfers
withdrawals
payment_methods
gift_cards
exchange_rates
investment_watchlists
portfolio_positions
notifications
admin_actions
audit_logs

Use proper relational references.

Never let the client directly set its own balance.

⸻

33. TRANSACTION LEDGER

The wallet must eventually use a proper ledger.

Do not implement:

balance = balance + amount

only in frontend code.

Use server-side database transactions.

Every balance adjustment should produce a ledger entry.

Every transfer should produce corresponding sender/recipient records.

⸻

34. APIs / SERVICES

Research current APIs before selecting them.

The AI should identify suitable APIs for:

Authentication
FX rates
Market data
Email
QR generation
QR scanning
Notifications
Error monitoring
Security
Images/assets

Potential services to evaluate:

Supabase
Google OAuth
Frankfurter
ExchangeRate.host
Open Exchange Rates
CurrencyAPI
Alpha Vantage
Finnhub
Twelve Data
Polygon/Massive
Resend
Twilio
Cloudflare Turnstile
Sentry
Cloudinary
Vercel

Do not integrate an API merely because it is listed here.

Research current pricing, free tiers, rate limits, documentation and suitability, then choose the appropriate service.

⸻

35. IMAGE RESEARCH

Except for the uploaded Moonlight logo, research and source appropriate imagery/assets for:

UPI
GCash
Indian banks
Philippine banks
Amazon
Apple
Google Play
Steam
Visa
Mastercard
financial/investment sections

Use official/licensed sources whenever possible.

Do not use random low-quality images.

Images should be optimized and loaded efficiently.

⸻

36. RESPONSIVE DESIGN

The application must work beautifully on:

iPhone
Android
Tablet
Desktop

Mobile should feel like a native premium financial application.

Use:

Bottom navigation
Sheets
Full-screen modal flows
Large touch targets
Swipe-friendly interfaces

Desktop should use:

Minimal top navigation
Spacious content area
Clean sidebar only where useful

⸻

37. DARK MODE

Dark mode should feel intentionally designed rather than simply inverted.

Use:

Near-black
Soft white
Muted gray
Subtle borders

The Moonlight logo must work against both light and dark backgrounds.

⸻

38. NOTIFICATIONS

Create an elegant notification center.

Examples:

“€250 received”

“Your redemption request is processing”

“New login detected”

“Currency rate updated”

Use Supabase/appropriate notification infrastructure.

Email notifications can later use Resend.

⸻

39. SECURITY

Implement security architecture from the beginning.

- Supabase Row Level Security
- Protected routes
- Server-side authorization
- Secure environment variables
- Admin authorization server-side
- Input validation
- Rate limiting
- Audit logs
- Error monitoring
- Never expose service-role keys
- Never trust client-provided balances
- Never trust client-provided user roles

⸻

40. CLOSED-LOOP FINANCIAL BOUNDARY

This is critical.

The wallet’s balances are internal application/simulation balances.

Do NOT connect these balances to:

- Real UPI payouts
- Real GCash payouts
- Real bank transfers
- Real payment processors
- Real brokerage accounts
- Real KYC providers

The UPI, GCash and bank screens are interfaces for the application’s internal redemption simulation.

If real financial APIs are ever added in the future, they must be implemented as a separate, explicitly authorized integration rather than treating internal balances as real money.

⸻

41. FRONTEND QUALITY

Every page should be complete.

No:

- “Coming soon” placeholders where a working UI can be provided
- Broken buttons
- Dead links
- Generic template cards
- Excessive gradients
- Fake logos
- Poor-quality stock imagery

Include:

Loading states
Empty states
Error states
Success states
Confirmation sheets
Toast notifications
Smooth transitions

⸻

42. APP STRUCTURE

Create:

/login
/register
/dashboard
/wallet
/send
/receive
/transactions
/transactions/[id]
/redeem
/redeem/upi
/redeem/gcash
/redeem/bank
/gift-cards
/invest
/profile
/settings
/about
/admin

⸻

43. GITHUB

Connect the complete project to GitHub.

Repository:

moonlight-wallet

GitHub must remain the single source of truth.

Write a detailed README explaining:

- Architecture
- Setup
- Supabase setup
- Google OAuth setup
- Environment variables
- APIs
- Database schema
- Development
- Deployment
- How another AI coding agent can continue the project

Keep commits organized.

⸻

44. FINAL REQUIREMENT

Before considering the frontend complete:

Test:

1. Registration
2. Google login
3. Email login
4. Logout
5. Dashboard
6. Currency selector
7. Send UI
8. Receive UI
9. QR display
10. Redemption UI
11. UPI UI
12. GCash UI
13. Bank UI
14. Gift-card UI
15. Transaction history
16. Investment section
17. Profile
18. Settings
19. Dark mode
20. Language selector
21. About page
22. Hidden Authorized Access
23. Admin authentication UI
24. Admin Add Balance UI
25. Mobile responsiveness
26. Desktop responsiveness

The finished application should feel like a premium Apple-inspired international wallet and wealth-management product, with the Moonlight logo as the central visual identity.

Do not make it look like a generic banking template.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://moonlight-wallet.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b17cedb7-4b7b-485c-807a-ccc6dd6383b9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
