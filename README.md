# ThesisPoint — AI Chat + Payments (Stage 1)

## What this is
- `index.html` — your site, now with a chat bubble (bottom-right)
- `netlify/functions/chat.js` — talks to the AI. Free mode = short answers only.
  Premium mode = full document generation.
- `netlify/functions/verify-payment.js` — checks a Paystack payment really happened
  before unlocking premium.
- `netlify/functions/_token.js` — small helper, no setup needed.

## Before this works, you need 3 things

### 1. An Anthropic API key (pays for the AI itself)
- Go to console.anthropic.com, create an account, add a card, generate an API key.
- Small pay-as-you-go cost per message — not a fixed monthly fee.

### 2. A Paystack account (collects the ₦ payments)
- Go to paystack.com, create a free account, verify your business/bank details
  (link your Raenest NGN account as the settlement account).
- In Paystack dashboard → Settings → API Keys, copy your **Public Key** and **Secret Key**.

### 3. Put the Public Key in the code
- Open `index.html`, find this line near the bottom:
  `const PAYSTACK_PUBLIC_KEY = 'pk_live_REPLACE_WITH_YOUR_PUBLIC_KEY';`
- Replace it with your real public key. (Public key is safe to expose — that's why
  it's fine to have it directly in the file. The *secret* key is different — never
  put that in this file, it goes in Netlify's settings instead, see below.)

## How to deploy (from your phone, via GitHub + Netlify — no drag-and-drop this time)

1. **Create a GitHub account** at github.com if you don't have one.
2. **Create a new repository** (top right → "+" → New repository). Name it `thesispoint-site`.
3. Inside the repo, tap **"Add file" → "Upload files"** and upload every file in this
   folder, keeping the same structure (the `netlify/functions/` folder must stay a folder).
4. **Commit** the upload.
5. Go to **app.netlify.com**, log into the account you already claimed your site with.
6. **Add new site → Import an existing project → GitHub** → pick `thesispoint-site`.
7. Deploy settings can stay default — Netlify will detect `netlify.toml` automatically.
8. Before the first deploy finishes, go to **Site settings → Environment variables** and add:
   - `ANTHROPIC_API_KEY` = your Anthropic key
   - `PAYSTACK_SECRET_KEY` = your Paystack secret key
   - `APP_SECRET` = any long random password you make up (used to sign unlock tokens —
     keep it private, don't reuse it anywhere else)
9. Trigger a deploy (or it'll redeploy automatically). Your site is now live with working
   AI chat and payments.

## Testing before going live
Paystack gives you **test mode** keys (start with `pk_test_` / `sk_test_`) and test card
numbers on their docs site — use those first so you're not spending real money while
checking everything works, then switch to the live keys once you're happy.
