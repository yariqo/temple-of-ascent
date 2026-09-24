"""Final stats from the OPTIMISED lookup tables (what players actually get)."""
import csv, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from game_config import GameConfig
lib = os.path.join(os.path.dirname(__file__), "library")
for bm in GameConfig().bet_modes:
    mode, cost = bm.get_name(), bm.get_cost()
    rows = {int(a): (int(b), int(c) / 100) for a, b, c in csv.reader(open(f"{lib}/publish_files/lookUpTable_{mode}_0.csv"))}
    seg = {int(r[0]): r[1] for r in csv.reader(open(f"{lib}/lookup_tables/lookUpTableSegmented_{mode}.csv"))}
    W = sum(w for w, _ in rows.values())
    rtp = sum(w * p for w, p in rows.values()) / W / cost
    hit = sum(w for w, p in rows.values() if p > 0) / W
    line = f"{mode:10s} cost {cost:>5g}x  RTP {rtp*100:.3f}%  hit 1 in {1/hit:.2f}"
    fs = sum(w for i, (w, p) in rows.items() if seg[i] in ("freegame", "wincap"))
    if fs and mode != "bonus":
        line += f"  FS 1 in {W/fs:.1f}"
    print(line)
    for lo, hi in ((0.01, 1), (1, 2), (2, 5), (5, 20), (20, 100), (100, 1000), (1000, 10000), (10000, 1e9)):
        pr = sum(w for w, p in rows.values() if lo <= p < hi) / W
        print(f"      win {lo:>6.0f}x+ (<{hi:.0f}): 1 in {1/pr:,.0f}" if pr else f"      win {lo}x-{hi}x: never")
