# Ally

Influencer campaign manager for beauty brands. Next.js + Supabase (Postgres and Auth) + Vercel.

Includes a public website (home with an example creator post, pricing page, sign-in) in the same rose design as the app. Features: sign-up and login, brand workspaces with teammate invites, multiple campaigns, creator database with CSV import and export, a six-stage pipeline, payments (fee, 50% advance, final, UPI links), post tracking (due date, live date, post link, courier number, on time or late), results (reach, clicks, orders, ROAS, cost per order), AI read-out and message drafts, WhatsApp and email links. Row-level security keeps every brand's data separate.

## Set up in about 30 minutes

### 1. Supabase (database and login)
1. Create a project at supabase.com. Pick the Mumbai region for Indian users.
2. Open **SQL Editor**, paste all of `supabase/schema.sql`, and click **Run**.
3. Open **Project Settings > API** and copy the Project URL and the anon (or publishable) key.
4. In **Authentication > Providers**, keep Email enabled. While testing you can turn off "Confirm email" to sign up faster. Turn it back on before launch.

### 2. Run it on your computer
```
npm install
cp .env.example .env.local     # then paste the two Supabase values in
npm run dev
```
Open http://localhost:3000, sign up, name your brand, and create a campaign.
Import `public/sample-creators.csv` on the Creators page to get started.

### 3. Put it online with Vercel
1. Push this folder to a new GitHub repository.
2. At vercel.com choose **Add New > Project**, import the repository.
3. Under **Environment Variables** add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and optionally `GEMINI_API_KEY` (free) or `ANTHROPIC_API_KEY` (paid) for AI drafts and read-outs.
4. Deploy. Then add your domain under **Settings > Domains**.
5. In Supabase **Authentication > URL Configuration**, set Site URL to your live address and add `https://YOUR-DOMAIN/auth/callback` to Redirect URLs. Without this, email confirmation links will not work.

## Secrets
Only `NEXT_PUBLIC_*` values reach the browser, and they are safe to share (the database is protected by row-level security). `ANTHROPIC_API_KEY` is read only in `app/api/ai/route.ts` on the server. Never commit `.env.local`.

## Before you invite real users
- Replace `/privacy` and `/terms` with lawyer-reviewed text.
- Test with two accounts in two different brands and confirm neither can see the other's data.
- Turn on Supabase backups and email confirmation.
- Invites are copy-and-send links (no email is sent automatically). Add an email service later if you want that.

## Not included yet
- Direct Instagram (Meta) connection: needs Meta app review. Reach, clicks and orders are entered by hand for now.
- Automatic payouts: UPI links open the payment app, and you mark payments as recorded. RazorpayX Payouts is the next step.
- Switching between several brands: each user works in their first brand.

## Website and design
- Public pages: `/` (landing), `/pricing`, `/login`, `/privacy`, `/terms`. Everything else needs login.
- Design tokens (rose palette, serif and Inter fonts, dark mode) live in `app/globals.css`. Shared pieces are in `components/` (SiteNav, SiteFooter, PageHead, Pricing, LiveOrders).
- Pictures are in `public/` (`hero-post.jpg`, `hero-avatar.jpg`, `product.jpg`, `creator-1..3.jpg`). Swap the files to change them. They are AI-generated examples, so replace them with your own photos before launch.
- The landing page numbers (likes, engagement, orders) are examples for illustration. Do not present them as real results.
- Pricing plans are placeholders and are not enforced or billed yet. The plan buttons lead to sign-up. Real subscription billing (for example Razorpay) is a later step.

## Plans and access
- Every brand has a plan (`starter`, `growth`, `studio`, `enterprise`), stored in `brands.plan`. New brands start on Starter.
- Limits (campaigns, creators, team members) are enforced in the database by triggers, and again in the app with a friendly message. Payments, results and AI are Growth and above, also enforced in the database and the AI route.
- Users cannot change their own plan. After you confirm a payment, switch the plan in Supabase: SQL Editor, then run
  `update public.brands set plan = 'growth' where name = 'Glowkind';` (use the brand's name and the plan you sold).
- **Existing database:** run `supabase/plans.sql` once in the SQL Editor to add all of this. New installs get it from `schema.sql`.
- The Billing page in the app shows usage and has email buttons to request a plan. Automatic online payment (for example Razorpay subscriptions) is a later step.
- Keep `lib/plan.ts` and `plan_limit()` in `plans.sql` identical if you change any limit.

## Contact details used on the site
Email ally.supportsite@gmail.com. Instagram "Ally campaign management" (@allyforbrands). Edit them in `lib/plan.ts`.
