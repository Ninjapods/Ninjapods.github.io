# creationsleyva.com

GitHub Pages site for Creations Leyva.

- **`/emotionphotography/`** — the e’MoTIoN Photography portfolio.
  - [emotionphotography/PROJECT.md](emotionphotography/PROJECT.md) — full project
    notes: how it is built, the domain setup, and how to sync photographs.
    **Start here.**
  - [emotionphotography/README.md](emotionphotography/README.md) — how to add,
    reorder and remove photographs.
- **`/`** — redirects to the portfolio.

## Pointing creationsleyva.com at this site

1. Add a file named `CNAME` in this folder containing exactly `creationsleyva.com`.
2. In Cloudflare DNS, replace the four Squarespace `A` records for the apex with
   GitHub Pages': `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
   `185.199.111.153` — set to **DNS only** (grey cloud), not proxied.
3. Point the `www` CNAME at `ninjapods.github.io`.
4. Settings → Pages → set the custom domain, then tick **Enforce HTTPS** once the
   certificate is issued.

The portfolio path stays `/emotionphotography/` before and after the switch.
