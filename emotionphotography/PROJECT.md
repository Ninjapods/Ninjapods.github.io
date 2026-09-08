# e’MoTIoN Photography — project notes

Everything needed to pick this up later: what it is, where it lives, how it was
built, what was changed on the domain, and the things that will bite you if you
forget them.

Last updated: 7 September 2026.

---

## 1. What this is

A one-page photography portfolio for **e’MoTIoN Photography**, the photography
brand of Creations Leyva. Photographer/contact: **Nalleli Robles**,
(209) 585-9700, hello@creationsleyva.com.

**Live at → https://creationsleyva.com/emotionphotography**

It is deliberately a *landing site*, not an application. No CMS, no database,
no accounts, no booking, no forms backend. Plain HTML, CSS and JavaScript, plus
one Python script that resizes photographs. That is the whole system.

Sections, in order: cover photograph → short intro line → gallery (63 photographs)
→ package pricing → contact → footer. Clicking any photograph opens a full-screen
viewer.

---

## 2. Where everything lives

| | |
|---|---|
| Working folder (edit here) | `/Users/manny-sr/Development/creationsleyva-site/emotionphotography` |
| GitHub repository | `Ninjapods/Ninjapods.github.io` (public) |
| Path inside the repo | `emotionphotography/` |
| Hosting | GitHub Pages |
| Live URL | https://creationsleyva.com/emotionphotography |
| Also resolves | https://ninjapods.github.io/emotionphotography/ (redirects to the above) |
| Photograph source of truth | the shared Google Photos album, see §6 |

The repo is a GitHub Pages **user site**, which is why the portfolio sits in an
`emotionphotography/` subfolder — that subfolder name *is* the URL path. Renaming
it changes the public URL.

The repo root holds only a small `index.html` that redirects `/` into the
portfolio, plus `.nojekyll` (turns off Jekyll so nothing gets pre-processed).

---

## 3. Day-to-day: changing photographs

Full instructions are in [README.md](README.md). The short version:

- Photographs live in **`gallery-photos/`** — one folder, ordinary filenames.
- The running order and descriptions live in **`gallery.tsv`** — one line per
  photograph, four Tab-separated columns: `order`, `file`, `size`, `description`.
- `size` is `normal`, or `wide` to give a photograph a full-width row of its own.
- After any change run `./build-photos.sh`.

Removing a photograph works **either** way on its own — delete its line from
`gallery.tsv`, *or* delete the image from `gallery-photos/`. Both are tested.
Reordering is just renumbering the `order` column and costs nothing, because
generated images are keyed on filename, not position.

`./build-photos.sh --add-new` appends any photograph that is in the folder but
not yet in the list.

The cover photograph is `gallery-photos/hero-palace-arch.jpg` and is *not* part
of the gallery list. To change it, replace that file or edit `HERO_FILE` at the
top of `build.py`.

### Publishing a change

```sh
cd /Users/manny-sr/Development/creationsleyva-site/emotionphotography
./publish.sh "what you changed"
```

That rebuilds the images, commits and pushes. GitHub Pages goes live within
about a minute. There is no build server and no CI — a push *is* the deploy.

The working folder is a normal clone of the repository, so ordinary `git pull`,
`git log` and `git revert` all work. To undo a bad change after it is live,
`git revert <commit> && git push`.

---

## 4. How the site is put together

- `index.html` — the entire page. Prices are plain HTML in
  `<section class="investment">`; name, phone and email are in
  `<section class="contact">`. Edit them directly.
- `assets/css/style.css` — all styling. Colours are CSS custom properties at the
  top (ivory `#faf8f5`, near-black `#171614`, warm accent `#a8875c`).
  Typography is Cormorant Garamond for display, Inter for interface text.
- `assets/js/gallery.js` — two jobs: laying the gallery out in justified rows,
  and the full-screen viewer (arrow keys, Escape, Home/End, swipe, click-outside).
- `assets/js/photos-data.js` — **generated**, do not edit.
- `photos/` — **generated** web-sized images, do not edit.
- `build.py` — the image pipeline.

**Gallery layout.** Photographs are laid out in justified rows, like a contact
sheet: each row is scaled so it exactly fills the width, which means every
photograph keeps its true aspect ratio — nothing is cropped or stretched.
Verified in-browser to within 0.3%. Below 640px it collapses to a single
full-width column. Photographs marked `wide` get a row to themselves, capped at
82% of viewport height so a tall one cannot swallow the screen.

**Performance.** Each photograph is generated at four widths (480/960/1440/2000)
in both WebP and JPEG, and the browser picks the smallest that fits. Width and
height are known before loading, so the page never jumps. Below-the-fold images
are lazy-loaded; a tiny blurred placeholder is embedded inline for each.

**Accessibility.** Every photograph has a real written description, used both by
screen readers and as the caption in the viewer. The viewer traps focus, restores
it on close, and is keyboard-operable. All animation is disabled under
`prefers-reduced-motion`.

**Branding.** The camera mark is the real e’MoTIoN logo. It is light-on-dark, so
a charcoal version was generated for the light header by inverting luminance
inside the alpha channel — both are in `assets/img/`. Favicons and the
social-share card derive from the same mark.

---

## 5. The domain

The site is served by GitHub Pages; DNS is managed at **Cloudflare**.

### What the DNS looks like now

| Name | Type | Value | Proxy |
|---|---|---|---|
| `@` | A | `185.199.108.153` | DNS only |
| `@` | A | `185.199.109.153` | DNS only |
| `@` | A | `185.199.110.153` | DNS only |
| `@` | A | `185.199.111.153` | DNS only |
| `www` | CNAME | `creationsleyva.com` | DNS only |

Those four IPs are GitHub Pages. They **must** stay grey-cloud *DNS only* — if
they are proxied through Cloudflare, GitHub cannot issue the HTTPS certificate.

### Do not touch

- `MX → smtp.google.com` and the SPF / DKIM `TXT` records. That is Google
  Workspace email, including **hello@creationsleyva.com**, the address on the
  site. Changing them breaks mail.
- `comfyui` (Cloudflare Tunnel, proxied) — unrelated service, still in use.

### What was replaced

Four Squarespace A records (`198.185.159.144/145`, `198.49.23.144/145`) and the
`www` CNAME that pointed to `ext-sq.squarespace.com`.

**Squarespace is now completely bypassed.** Before this, creationsleyva.com was
only ever a "Coming Soon" parking page — every path returned it, and it was set
to `noindex`. Nothing of value was displaced. If that subscription is still being
paid for, nothing is using it.

### Known open item — www has no certificate

`https://www.creationsleyva.com` does not work. The bare domain is unaffected.

GitHub issued its certificate while `www` still pointed at Squarespace, so the
certificate covers `creationsleyva.com` only. DNS is correct now, but re-saving
the domain does not re-trigger issuance.

The fix — **causes a few minutes of downtime on the live site**, so do it at a
quiet moment:

1. Repo → Settings → Pages → clear the custom domain and save.
2. Re-enter `creationsleyva.com` and save.
3. Wait for "DNS check successful", then for the certificate to be issued.
4. Re-tick **Enforce HTTPS**.

Afterwards confirm with:
```sh
gh api repos/Ninjapods/Ninjapods.github.io/pages \
  --jq '.https_certificate.domains'
```
It should list both `creationsleyva.com` and `www.creationsleyva.com`.

---

## 6. Syncing photographs from Google Photos

The gallery is curated in a shared Google Photos album — *"e’MoTIoN Photography
Samples"* — and the site is synced to match it. Two things make this trickier
than it looks:

**The album's image URLs are regenerated on every page load.** Comparing URLs
between two visits reports that 100% of the photographs changed, which is
meaningless. Diff by **image content** instead: download each at `=w2560`, reduce
to a small normalised greyscale signature, and match on mean absolute difference.

```sh
magick "${f}[0]" -colorspace Gray -resize 12x12! -normalize -depth 8 txt:- \
  | awk 'NR>1{ if (match($0,/#[0-9A-Fa-f]{6}/)) printf "%s", toupper(substr($0,RSTART+1,2)) }'
```

Two cautions learned the hard way:

- That signature is greyscale, so **a black-and-white edit collides with its own
  colour original**. Any marginal match must be eyeballed before deleting anything.
- Edits to the album are not only deletions. In the last sync, 1 photograph was
  genuinely removed and **4 were swapped for different takes of the same set-up** —
  which a naive "what's missing" check would have reported as 4 deletions plus 4
  unrelated additions. Check both directions.

Also, in zsh, quote ImageMagick frame selectors as `"${f}[0]"` — `"$f[0]"` is
parsed as array subscripting and silently yields nothing.

---

## 7. Deliberate decisions

- **No framework.** The site is 3 files plus generated images. Anything heavier
  would cost more to maintain than it could possibly return here.
- **No categories/filters.** The work is overwhelmingly quinceañeras; with only
  three wedding photographs a filter bar would have advertised the gaps. Revisit
  once there is enough of a second category to stand on its own.
- **The reception/party detail shots were dropped** during curation. The portrait
  and ceremony work is much stronger and the mixed set diluted it.
- **The photographer's own watermark is left on the images.** It is her brand mark
  and appears on the originals.
- **`gallery-photos/` is committed to the repo**, so the project is
  self-contained and photographs can be managed from GitHub's web interface.
  It is ~45 MB, which is fine.

---

## 8. Rebuilding from scratch

Requires ImageMagick (`brew install imagemagick`) and Python 3.

```sh
git clone https://github.com/Ninjapods/Ninjapods.github.io
cd Ninjapods.github.io/emotionphotography
./build-photos.sh
python3 -m http.server 8000     # then open http://localhost:8000
```

Everything needed is in the repository, photographs included — nothing else to
restore.

---

## 9. Ideas for later

Nothing here is needed; the site is complete as it stands.

- Fix `www` (§5).
- Add a second category once there is enough wedding work to justify filters.
- A proper contact form would need a third-party service — the mailto link is
  deliberate for now.
- Cancel Squarespace if it is still being paid for.
