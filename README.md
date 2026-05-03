# PRISM Landing Page

Static one-page GitHub Pages site for validating demand before launch.

## Edit the product name

Open `app.js` and change:

```js
brandPrimary: "PRISM",
brandSecondary: "quant framework"
```

Pricing labels live in the same `SITE_CONFIG` object.

## Connect Supabase

1. Create a Supabase project.
2. Run `supabase-schema.sql` in the Supabase SQL editor.
3. In `app.js`, replace:

```js
url: "https://YOUR-PROJECT.supabase.co",
anonKey: "YOUR-SUPABASE-ANON-KEY"
```

The form writes to the `waitlist` table once those values are configured. Until then, test submissions are stored in browser local storage.

## Deploy on GitHub Pages

Use the repository root as the Pages source. The site has no build step.
