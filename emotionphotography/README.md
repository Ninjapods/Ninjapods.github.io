# e’MoTIoN Photography

Photography portfolio for **e’MoTIoN Photography** (Creations Leyva), built to live at
**https://creationsleyva.com/emotionphotography**.

Plain HTML, CSS and JavaScript — no framework. The only tooling is one small script
that makes web-sized copies of your photographs.

This file covers day-to-day photograph changes. For how the site is built, the
domain and DNS setup, and how to sync from the Google Photos album, see
**[PROJECT.md](PROJECT.md)**.

To publish any change: `./publish.sh "what you changed"`

---

## Managing the gallery

Two things control everything:

| | |
|---|---|
| **`gallery-photos/`** | Your photographs. One folder, full-size files, ordinary names. |
| **`gallery.tsv`** | The gallery list — one line per photograph. |

After any change, run:

```sh
./build-photos.sh
```

### The gallery list

`gallery.tsv` has four columns separated by **Tabs**:

```
order   file                    size     description
01      overhead-gowns-lawn     wide     Two quinceañeras lying on a lawn, gowns fanned out around them
02      palace-lagoon-blush     normal   Quinceañera in a blush gown beside the lagoon at the Palace of Fine Arts
```

- **order** — where it appears. Sorted as text, so keep two digits (`01`, `02` … `64`).
- **file** — the filename in `gallery-photos/`, without the `.jpg`.
- **size** — `normal`, or `wide` to give that photograph a full-width row to itself.
- **description** — a real sentence. Screen readers read it aloud and it appears
  beneath the photograph in the full-screen viewer.

Lines starting with `#` are ignored.

### Add a photograph

1. Put the file in `gallery-photos/` — say `rosa-in-the-roses.jpg`.
2. Either add a line to `gallery.tsv` yourself, or let the script do it:

```sh
./build-photos.sh --add-new
```

That appends any unlisted photograph to the end of `gallery.tsv`. Open the file
afterwards to set its position and write a proper description.

### Remove a photograph

Either one works on its own:

- delete the line from `gallery.tsv`, **or**
- delete the image from `gallery-photos/`

then run `./build-photos.sh`. The web-sized copies are cleaned up for you.

### Reorder

Change the numbers in the `order` column and rebuild. Reordering never
regenerates images, so it is instant.

### Change the cover photograph

The large photograph behind the name is `gallery-photos/hero-palace-arch.jpg`.
Either replace that file, or point `HERO_FILE` near the top of `build.py` at a
different one. The cover is not part of the gallery list.

---

## Preview it locally

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Double-clicking `index.html` also works.

---

## Where things live

```
index.html               the page itself
gallery-photos/          YOUR PHOTOGRAPHS - the only folder you add to
gallery.tsv              THE GALLERY LIST - the only file you edit
photos/                  generated web-sized copies - do not edit
assets/css/style.css     all styling
assets/js/gallery.js     gallery layout and the full-screen viewer
assets/js/photos-data.js generated - do not edit
assets/img/              logo, favicons, social-share image
build.py                 the image pipeline
```

## Changing wording or prices

Open `index.html`. The packages are plain HTML inside
`<section class="investment">`; the name, phone number and email are inside
`<section class="contact">`.

## Good to know

- Each photograph is served in WebP with a JPEG fallback at four widths, so phones
  download small files and large screens get sharp ones.
- Sizes are known before loading, so the page never jumps while images arrive.
- The gallery lays itself out in justified rows that adapt to the window, and
  becomes a single full-width column on phones.
- The viewer supports arrow keys, Escape, Home/End and swiping.
- Requires ImageMagick (`brew install imagemagick`) and Python 3 to rebuild.
