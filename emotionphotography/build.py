#!/usr/bin/env python3
"""
e'MoTIoN Photography - gallery build.

Reads the photographs in gallery-photos/ and the running order in gallery.tsv,
then writes web-sized versions into photos/ and the list the page reads.

Usage:  ./build-photos.sh        (or: python3 build.py)
"""
import base64, json, os, subprocess, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PHOTOS_IN  = os.path.join(ROOT, "gallery-photos")
PHOTOS_OUT = os.path.join(ROOT, "photos")
LIST       = os.path.join(ROOT, "gallery.tsv")

WIDTHS      = [480, 960, 1440, 2000]
HERO_WIDTHS = [1280, 1920, 2560]
HERO_FILE   = "hero-palace-arch"      # the photograph behind the name
JPG_Q, WEBP_Q = 84, 80
EXTS = (".jpg", ".JPG", ".jpeg", ".JPEG", ".png", ".PNG")


def sh(*a):
    return subprocess.run(a, check=True, capture_output=True).stdout.decode().strip()


def find(stem):
    for e in EXTS:
        p = os.path.join(PHOTOS_IN, stem + e)
        if os.path.exists(p):
            return p
    return None


def dims(path):
    w, h = sh("magick", "identify", "-format", "%w %h", path + "[0]").split()
    return int(w), int(h)


def lqip(path):
    """Tiny blurred stand-in, shown while the real photograph loads."""
    tmp = os.path.join(PHOTOS_OUT, ".lqip.jpg")
    subprocess.run(["magick", path + "[0]", "-resize", "24x", "-quality", "40",
                    "-strip", tmp], check=True, capture_output=True)
    with open(tmp, "rb") as f:
        b = base64.b64encode(f.read()).decode()
    os.remove(tmp)
    return "data:image/jpeg;base64," + b


def derive(src, base, widths, ow, keep):
    made = []
    for w in widths:
        if w > ow and made:
            continue
        tw = min(w, ow)
        for ext, q, extra in (("jpg", JPG_Q, ["-interlace", "Plane"]),
                              ("webp", WEBP_Q, [])):
            name = f"{base}-{w}.{ext}"
            keep.add(name)
            dst = os.path.join(PHOTOS_OUT, name)
            if not os.path.exists(dst):
                subprocess.run(["magick", src + "[0]", "-resize", f"{tw}x",
                                "-strip", "-quality", str(q), *extra, dst],
                               check=True, capture_output=True)
        made.append(w)
    return made


def read_list():
    rows = []
    if not os.path.exists(LIST):
        return rows
    for line in open(LIST, encoding="utf-8"):
        line = line.rstrip("\n")
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        p = line.split("\t")
        if len(p) < 4:
            print(f"  ! skipping malformed line (needs 4 tab-separated "
                  f"columns): {line[:60]}")
            continue
        rows.append({"order": p[0].strip(), "file": p[1].strip(),
                     "size": p[2].strip(), "alt": p[3].strip()})
    return rows


def main():
    os.makedirs(PHOTOS_OUT, exist_ok=True)
    rows = read_list()

    named = {r["file"] for r in rows} | {HERO_FILE}
    unlisted = []
    for fn in sorted(os.listdir(PHOTOS_IN)):
        stem, ext = os.path.splitext(fn)
        if ext not in EXTS or stem.startswith("."):
            continue
        if stem not in named:
            unlisted.append(stem)

    add_new = "--add-new" in sys.argv
    if unlisted and add_new:
        nxt = max((int(r["order"]) for r in rows if r["order"].isdigit()),
                  default=0)
        with open(LIST, "a", encoding="utf-8") as f:
            for stem in unlisted:
                nxt += 1
                pretty = stem.replace("-", " ").replace("_", " ").strip()
                f.write(f"{nxt:02d}\t{stem}\tnormal\t{pretty}\n")
                rows.append({"order": f"{nxt:02d}", "file": stem,
                             "size": "normal", "alt": pretty})
        print(f"  + added {len(unlisted)} new photograph(s) to gallery.tsv: "
              + ", ".join(unlisted))
        print("    Open gallery.tsv and write a proper description for each.")
    elif unlisted:
        print(f"  i {len(unlisted)} photograph(s) in gallery-photos/ are not "
              f"listed in gallery.tsv, so they are not shown:")
        for stem in unlisted:
            print(f"      {stem}")
        print("    Add them with:  ./build-photos.sh --add-new")

    rows.sort(key=lambda r: (r["order"], r["file"]))

    keep = set()
    manifest = []
    for r in rows:
        src = find(r["file"])
        if not src:
            print(f"  - {r['file']}: no such photograph in gallery-photos/, "
                  f"leaving it out")
            continue
        w, h = dims(src)
        made = derive(src, r["file"], WIDTHS, w, keep)
        manifest.append({"base": r["file"], "w": w, "h": h, "widths": made,
                         "feature": r["size"], "alt": r["alt"],
                         "lqip": lqip(src)})
        print(f"  ok {r['file']}  {w}x{h}")

    hero = None
    hsrc = find(HERO_FILE)
    if hsrc:
        hw, hh = dims(hsrc)
        made = derive(hsrc, "hero", HERO_WIDTHS, hw, keep)
        hero = {"base": "hero", "w": hw, "h": hh, "widths": made,
                "lqip": lqip(hsrc),
                "alt": "A quinceanera in an ivory ball gown beneath the rotunda "
                       "of the Palace of Fine Arts at golden hour"}
        print(f"  ok hero  {hw}x{hh}")
    else:
        print(f"  ! no hero photograph found ({HERO_FILE})")

    # Delete renditions of photographs that are no longer in the gallery, so
    # removing a picture really does remove it.
    removed = 0
    for fn in os.listdir(PHOTOS_OUT):
        if fn.startswith("."):
            continue
        if fn not in keep:
            os.remove(os.path.join(PHOTOS_OUT, fn))
            removed += 1
    if removed:
        print(f"  - cleared {removed} file(s) for photographs no longer listed")

    payload = {"hero": hero, "photos": manifest}
    with open(os.path.join(ROOT, "photos.json"), "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=1, ensure_ascii=False)

    js = os.path.join(ROOT, "assets", "js", "photos-data.js")
    os.makedirs(os.path.dirname(js), exist_ok=True)
    with open(js, "w", encoding="utf-8") as f:
        f.write("/* generated by build.py - do not edit */\n")
        f.write("window.__PHOTOS__ = ")
        json.dump(payload, f, separators=(",", ":"), ensure_ascii=False)
        f.write(";\n")

    total = sum(os.path.getsize(os.path.join(PHOTOS_OUT, f))
                for f in os.listdir(PHOTOS_OUT) if not f.startswith("."))
    print(f"\n{len(manifest)} photographs in the gallery, plus the cover "
          f"({total/1048576:.1f} MB in photos/)")


if __name__ == "__main__":
    main()
