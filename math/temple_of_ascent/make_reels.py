"""Generate reel strips for Temple of Ascent.

Run: python games/temple_of_ascent/make_reels.py
Symbol counts per reel are defined below; strips are shuffled with a fixed seed
so that the output is reproducible. Scatters (S) are spaced so that at most one
can be visible per reel (4 rows) - required by the SDK's scatter forcing.
"""

import os
import random

NUM_REELS = 5
ROWS = 4
HERE = os.path.dirname(os.path.abspath(__file__))

# symbol -> count on each reel (list of 5) or int for all reels
STRIPS = {
    "BR0": {  # base game
        "H1": 3, "H2": 4, "H3": 5, "H4": 6,
        "L1": 8, "L2": 9, "L3": 9, "L4": 10, "L5": 10,
        "W": [0, 2, 2, 2, 2],
        "S": [2, 1, 1, 2, 2],
        "T": 2,
    },
    "FR0": {  # free spins
        "H1": 4, "H2": 5, "H3": 5, "H4": 6,
        "L1": 7, "L2": 8, "L3": 8, "L4": 9, "L5": 9,
        "W": [0, 4, 4, 4, 4],
        "S": [1, 1, 2, 1, 1],
        "T": 5,
    },
    "FRWCAP": {  # used only to generate max-win books
        "H1": 8, "H2": 6, "H3": 4, "H4": 3,
        "L1": 3, "L2": 3, "L3": 3, "L4": 3, "L5": 3,
        "W": [0, 5, 5, 5, 5],
        "S": 3,
        "T": 6,
    },
}


def build_reel(counts: dict, reel: int, rng: random.Random) -> list:
    syms = []
    for sym, c in counts.items():
        n = c[reel] if isinstance(c, list) else c
        syms += [sym] * n
    while True:
        rng.shuffle(syms)
        L = len(syms)
        ok = True
        s_idx = [i for i, s in enumerate(syms) if s == "S"]
        for a in s_idx:
            for b in s_idx:
                if a != b and min((a - b) % L, (b - a) % L) < ROWS:
                    ok = False
        if ok:
            return syms


def main():
    rng = random.Random(2026)
    for name, counts in STRIPS.items():
        reels = [build_reel(counts, r, rng) for r in range(NUM_REELS)]
        length = max(len(r) for r in reels)
        # pad shorter reels (reel 1 has no wilds) with extra low symbols
        for r in reels:
            while len(r) < length:
                r.insert(rng.randrange(len(r)), rng.choice(["L3", "L4", "L5"]))
        with open(os.path.join(HERE, "reels", f"{name}.csv"), "w", encoding="UTF-8") as f:
            for i in range(length):
                f.write(",".join(r[i] for r in reels) + "\n")
        print(name, "length", length)


if __name__ == "__main__":
    main()
