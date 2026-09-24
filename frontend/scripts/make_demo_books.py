"""Build src/demo/books.json: a weighted random sample of real books per bet mode.

The demo RGS (only used when the game is opened WITHOUT an rgs_url, e.g. locally or as a
preview page) draws uniformly from this sample, which approximates the real, weighted
distribution of the published lookup tables.

Usage:  python3 scripts/make_demo_books.py [path/to/library/publish_files]
Needs:  pip install zstandard
"""

import csv
import json
import os
import random
import sys

import zstandard as zstd

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_PUB = os.path.join(HERE, "..", "..", "math", "temple_of_ascent", "library", "publish_files")
PUB = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_PUB
OUT = os.path.join(HERE, "..", "src", "demo", "books.json")

SAMPLE = {"base": 600, "bonushunt": 600, "jaguar": 300, "bonus": 120}


def main():
    rng = random.Random(7)
    index = json.load(open(os.path.join(PUB, "index.json")))
    out = {"modes": {}}
    for m in index["modes"]:
        name = m["name"]
        ids, weights = [], []
        for a, w, _ in csv.reader(open(os.path.join(PUB, m["weights"]))):
            ids.append(int(a))
            weights.append(int(w))
        picked = rng.choices(ids, weights=weights, k=SAMPLE.get(name, 300))
        wanted = set(picked)
        books = {}
        with open(os.path.join(PUB, m["events"]), "rb") as f:
            reader = zstd.ZstdDecompressor().stream_reader(f)
            buf = b""
            while True:
                chunk = reader.read(1 << 20)
                if not chunk:
                    break
                buf += chunk
                *lines, buf = buf.split(b"\n")
                for line in lines:
                    if not line.strip():
                        continue
                    # cheap id check before full parse
                    head = line[:40].decode()
                    bid = int(head.split('"id":')[1].split(",")[0])
                    if bid in wanted:
                        b = json.loads(line)
                        books[bid] = {"id": bid, "payoutMultiplier": b["payoutMultiplier"], "events": b["events"]}
        # keep sample multiplicity (duplicates = more likely)
        out["modes"][name] = {"cost": m["cost"], "books": [books[i] for i in picked]}
        pays = [books[i]["payoutMultiplier"] / 100 for i in picked]
        print(f"{name:10s} {len(picked)} books ({len(books)} unique), mean payout {sum(pays)/len(pays):.2f}x")
    # de-duplicate storage: store unique books once + list of ids
    compact = {"modes": {}}
    for name, d in out["modes"].items():
        uniq = {b["id"]: b for b in d["books"]}
        compact["modes"][name] = {
            "cost": d["cost"],
            "draw": [b["id"] for b in d["books"]],
            "books": list(uniq.values()),
        }
    with open(OUT, "w", encoding="UTF-8") as f:
        json.dump(compact, f, separators=(",", ":"))
    print("wrote", OUT, os.path.getsize(OUT) // 1024, "KB")


if __name__ == "__main__":
    main()
