# L&D Nuts, Dryfruits & Spices

Static website for [ldnutsandspices.in](https://ldnutsandspices.in) with an admin panel for updating product prices and images.

## Admin panel

Open **https://ldnutsandspices.in/admin** (or `/admin` locally).

- Sign in with the admin password
- Search and filter products by category
- Edit prices inline
- Upload new product images
- Click **Save changes** to publish updates to the live site

### Default password

`ldspices2026` — change this on Vercel before going live.

## Vercel setup

1. Push this repo to GitHub and connect it to Vercel
2. Add environment variables in Vercel → Project → Settings → Environment Variables:
   - `ADMIN_PASSWORD` — your secure admin password
   - `BLOB_READ_WRITE_TOKEN` — create from Vercel → Storage → Blob (required for saving changes on production)
3. Redeploy after adding env vars

Without `BLOB_READ_WRITE_TOKEN`, the site still works but admin saves won't persist on Vercel (local dev writes to `data/products.json`).

## Local development

```bash
npm install
npm run build:products   # regenerate data/products.json from legacy products.js if needed
npm run dev
```

- Site: http://localhost:4173
- Admin: http://localhost:4173/admin
- Default local password: `ldspices2026` (or set `ADMIN_PASSWORD` env var)

## Project structure

- `data/products.json` — product catalogue (prices, images, categories)
- `api/` — Vercel serverless routes (auth, products CRUD, image upload)
- `admin/` — admin panel UI
- `assets/` — site styles, scripts, and images
