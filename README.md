# PRISM Landing Page

Static one-page GitHub Pages site for validating demand before launch.

## Edit the product name

Open `config.js` and change:

```js
brandPrimary: "PRISM",
brandSecondary: "quant framework"
```

Pricing labels and Supabase settings live in `config.js`.

## Connect Supabase

1. Create a Supabase project.
2. Run `supabase-schema.sql` in the Supabase SQL editor.
3. In `config.js`, replace:

```js
url: "https://YOUR-PROJECT.supabase.co",
anonKey: "YOUR-SUPABASE-ANON-KEY"
```

The form writes to the `waitlist` table once those values are configured. Until then, test submissions are stored in browser local storage.

## Admin dashboard

Open `admin.html` to view waitlist signups. The page uses Supabase Auth email/password login and only shows rows to emails listed in `public.waitlist_admins`.

After running `supabase-schema.sql`, create a confirmed Auth user in Supabase with an email and password, then add that same email to the admin allowlist:

```sql
insert into public.waitlist_admins (email)
values ('you@example.com')
on conflict do nothing;
```

## Deploy on GitHub Pages

Use the repository root as the Pages source. The site has no build step.
