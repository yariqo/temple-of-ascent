"""Quick raw statistics (before optimisation) for tuning reels/tables."""
import sys, os, json, collections, itertools
sys.path.insert(0, os.path.dirname(__file__))
from game_config import GameConfig

def analyse(mode):
    cost = [bm.get_cost() for bm in GameConfig().bet_modes if bm.get_name() == mode][0]
    d = json.load(open(os.path.join(os.path.dirname(__file__), "library/books", f"books_{mode}.json")))
    by = collections.defaultdict(list); stages = collections.Counter()
    for bk in d:
        by[bk["criteria"]].append(bk["payoutMultiplier"] / 100)
        st = None
        for e in bk["events"]:
            if e["type"] == "stageInfo": st = 1
            if e["type"] == "stageUp": st = e["stage"]
        if st: stages[st] += 1
    for c, p in by.items():
        p.sort()
        print(f"{mode:9s} cost={cost:5.0f} {c:9s} n={len(p):6d} mean={sum(p)/len(p):9.3f} median={p[len(p)//2]:8.2f} max={p[-1]:8.1f} hit={sum(x>0 for x in p)/len(p):.3f} mean/cost={sum(p)/len(p)/cost:.3f}")
    tot = sum(stages.values())
    print("  stage reached:", {k: round(v / tot, 3) for k, v in sorted(stages.items())})

def scatter_prob():
    cfg = GameConfig(); reels = cfg.reels["BR0"]
    p = [sum(1 for i in range(len(r)) if "S" in [r[(i + k) % len(r)] for k in range(4)]) / len(r) for r in reels]
    tot = 0
    for combo in itertools.product([0, 1], repeat=5):
        if sum(combo) >= 3:
            pr = 1
            for i, c in enumerate(combo): pr *= p[i] if c else 1 - p[i]
            tot += pr
    print(f"natural FS trigger chance base: 1 in {1/tot:.0f}")

for m in sys.argv[1:] or [bm.get_name() for bm in GameConfig().bet_modes]:
    analyse(m)
scatter_prob()
