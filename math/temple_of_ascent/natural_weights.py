"""Weight the simulated books with their NATURAL probabilities instead of the
SDK's Gaussian optimiser (which distorted the win distribution of this game).

For every bet mode:
  * each criteria gets a fixed probability (free-spin frequency, base hit-rate, max-win chance)
  * inside a criteria every book is equally likely (= the natural outcome of the game logic)
  * the RTP is hit exactly by a minimal exponential tilt inside ONE criteria
    (w_i ~ exp(theta * win_i)), which keeps the natural shape of the distribution.

Writes library/publish_files/lookUpTable_<mode>_0.csv
Run after the simulations:  python games/temple_of_ascent/natural_weights.py
"""

import csv
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from game_config import GameConfig  # noqa: E402

LIB = os.path.join(os.path.dirname(__file__), "library")
TOTAL_WEIGHT = 10**13  # integer resolution of the lookup table

BASE_HIT = 1 / 3.6  # natural base-game hit-rate (incl. jaguar roar)

# criteria probabilities per mode; "tilt" = criteria used to hit the RTP exactly
# "tail": [(min_win, factor), ...] -> books paying >= min_win (in x bet) get their weight scaled by
# factor (cumulative) before the RTP tilt, i.e. the very big wins become a little rarer.
PLAN = {
    "base": {"probs": {"wincap": 1e-7, "freegame": 1 / 200, "basegame": BASE_HIT}, "zero": "0",
             "tilt": "freegame", "tail": [(500, 0.6), (1000, 0.8)]},
    "bonushunt": {"probs": {"wincap": 1.5e-7, "freegame": 1 / 100, "basegame": BASE_HIT}, "zero": "0",
                  "tilt": "freegame", "tail": [(500, 0.7), (1000, 0.85)]},
    "jaguar": {"probs": {"jaguarspin": 1.0}, "zero": None, "tilt": "jaguarspin", "tail": [(300, 0.75), (1000, 0.85)]},
    "jaguarking": {"probs": {"kingspin": 1.0}, "zero": None, "tilt": "kingspin", "tail": []},
    # bonus buy: wins >= 4000x reduced so that the SDK volatility check (etl40b <= 0.9) passes
    "bonus": {"probs": {"wincap": 5e-6, "freegame": 1 - 5e-6}, "zero": None, "tilt": "freegame",
              "tail": [(1000, 0.8), (4000, 0.3)]},
    # Super-Bonus (starts on stage 2): tails trimmed so etl40b (wins >= 8000x) and etl10k pass
    "superbonus": {"probs": {"wincap": 1e-6, "freegame": 1 - 1e-6}, "zero": None, "tilt": "freegame",
                   "tail": [(1000, 0.9), (8000, 0.25)]},
    # Divine Bonus (5 runes, 500x, collected multipliers stay): the max win (10000x) is trimmed
    # so that etl10k (<= 0.8, i.e. max win at most ~1 in 12500 bonuses) passes
    "godbonus": {"probs": {"wincap": 1e-6, "freegame": 1 - 1e-6}, "zero": None, "tilt": "freegame",
                 "tail": [(10000, 0.045)]},
}


def tilt_weights(x: np.ndarray, target_mean: float, prior: np.ndarray) -> np.ndarray:
    """Probability vector over x with mean == target_mean, closest (KL) to the prior among
    power tilts w ~ prior * (1+x)^theta (gentle on the extreme tail, unlike exp(theta*x))."""
    lx = np.log1p(x)

    def mean_for(theta):
        z = theta * lx
        z -= z.max()
        w = np.exp(z) * prior
        return (w * x).sum() / w.sum(), w

    lo, hi = -3.0, 3.0
    if not (mean_for(lo)[0] <= target_mean <= mean_for(hi)[0]):
        raise RuntimeError(f"target {target_mean:.3f} not reachable (natural mean {x.mean():.3f})")
    for _ in range(200):
        mid = (lo + hi) / 2
        if mean_for(mid)[0] < target_mean:
            lo = mid
        else:
            hi = mid
    m, w = mean_for((lo + hi) / 2)
    return w / w.sum()


def main():
    cfg = GameConfig()
    for bm in cfg.bet_modes:
        mode, cost, rtp = bm.get_name(), bm.get_cost(), bm.get_rtp()
        plan = PLAN[mode]
        ids, pays = [], []
        for a, _, c in csv.reader(open(f"{LIB}/lookup_tables/lookUpTable_{mode}.csv")):
            ids.append(int(a))
            pays.append(int(c) / 100)
        pays = np.array(pays)
        crit = {int(r[0]): r[1] for r in csv.reader(open(f"{LIB}/lookup_tables/lookUpTableSegmented_{mode}.csv"))}
        crit_arr = np.array([crit[i] for i in ids])

        probs = dict(plan["probs"])
        if plan["zero"]:
            probs[plan["zero"]] = 1 - sum(probs.values())

        weights = np.zeros(len(ids))
        fixed_rtp = 0.0
        for c, p in probs.items():
            if c == plan["tilt"]:
                continue
            mask = crit_arr == c
            assert mask.any(), f"no books for {mode}/{c}"
            weights[mask] = p / mask.sum()
            fixed_rtp += p * pays[mask].mean()

        tilt_c = plan["tilt"]
        mask = crit_arr == tilt_c
        target_mean = (rtp * cost - fixed_rtp) / probs[tilt_c]
        prior = np.ones(mask.sum())
        for tail_min, tail_factor in plan.get("tail", []):
            prior[pays[mask] >= tail_min] *= tail_factor
        weights[mask] = probs[tilt_c] * tilt_weights(pays[mask], target_mean, prior)

        int_w = np.maximum(1, np.round(weights * TOTAL_WEIGHT)).astype(np.int64)
        final_rtp = (int_w * pays).sum() / int_w.sum() / cost
        etl40 = (int_w * pays * (pays >= 40 * cost)).sum() / int_w.sum()
        print(f"{mode:10s} natural {tilt_c} mean {pays[mask].mean():8.2f} -> target {target_mean:8.2f}   RTP {final_rtp*100:.4f}%  etl40b {etl40:.3f}")

        with open(f"{LIB}/publish_files/lookUpTable_{mode}_0.csv", "w", encoding="UTF-8", newline="") as f:
            for i, w, p in zip(ids, int_w, pays):
                f.write(f"{i},{w},{int(round(p * 100))}\n")


if __name__ == "__main__":
    main()
