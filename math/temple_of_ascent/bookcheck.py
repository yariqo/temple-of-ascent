"""Consistency checks over every simulated book (run from the math-sdk root after run.py).

Checks per book:
  * payoutMultiplier == finalWin event == sum of all spin wins (capped at the wincap)
  * every totemMultiplier: totalMult == sum(steles) + keptMult, totalWin == baseWin * totalMult
  * stele values in reveal boards match the totemMultiplier / jaguarRoar totems
  * stele values are from the table of the current stage (base / stage / roar / golden)
  * winInfo.totalWin == sum of line wins
  * number of scatters on the trigger board decides the start stage (3→1, 4→2, 5→3)
  * spins: updateFreeSpin counts 0..total-1 and the total matches start + stage-ups + extra spins
  * runes and stages move consistently (every 3 runes → stage-up, +4 spins; top stage → +1 per rune)
  * Divine bonus: kept multiplier == sum of collected steles
  * wins never exceed the wincap
Usage: python games/temple_of_ascent/bookcheck.py [mode ...]
"""

import json
import os
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(__file__))
from game_config import GameConfig  # noqa: E402

CFG = GameConfig()
LIB = os.path.join(os.path.dirname(__file__), "library", "books")
CAP = int(CFG.wincap * 100)


def check_book(bk, mode, errs, stats):
    ev = bk["events"]
    bid = bk["id"]

    def err(msg):
        errs[msg] += 1
        if errs[msg] <= 3:
            print(f"  [{mode} #{bid}] {msg}")

    final = [e for e in ev if e["type"] == "finalWin"]
    if len(final) != 1:
        err("finalWin missing or duplicated")
        return
    if final[0]["amount"] != bk["payoutMultiplier"]:
        err("finalWin != payoutMultiplier")
    if bk["payoutMultiplier"] > CAP:
        err("payout above wincap")

    stage = 0
    runes = 0
    kept = 0
    divine = False
    in_fs = False
    tot_fs = 0
    fs_seen = -1
    spin_sum = 0
    board_totems = {}
    last_set_win = 0
    last_total = 0
    for e in ev:
        t = e["type"]
        if t == "reveal":
            board_totems = {}
            for r, col in enumerate(e["board"]):
                for w, s in enumerate(col):
                    if s["name"] == "T":
                        board_totems[(r, w)] = s.get("multiplier")
            # stele values must come from the right table
            if in_fs:
                allowed = set(CFG.stage_totem_values[stage].keys())
            else:
                allowed = set(CFG.base_totem_values.keys())
            for (r, w), m in board_totems.items():
                if w == 0 or w == len(e["board"][r]) - 1:
                    continue  # padding rows
                if m not in allowed:
                    err(f"stele value {m} not in table of stage {stage if in_fs else 'base'}")
        elif t == "jaguarRoar":
            table = CFG.jaguar_spin_roar if e.get("golden") else CFG.jaguar_roar
            for tt in e["totems"]:
                board_totems[(tt["reel"], tt["row"])] = tt["multiplier"]
                if tt["multiplier"] not in table["values"]:
                    err("jaguar stele value not in its table")
        elif t == "winInfo":
            s = sum(x["win"] for x in e["wins"])
            if abs(s - e["totalWin"]) > 1:
                err("winInfo.totalWin != sum of line wins")
        elif t == "totemMultiplier":
            vals = [tt["multiplier"] for tt in e["totems"]]
            km = e.get("keptMult", 0)
            if sum(vals) + km != e["totalMult"]:
                err("totalMult != sum(steles) + kept")
            if km != (kept if divine else 0):
                err("keptMult does not match collected multiplier")
            for tt in e["totems"]:
                bv = board_totems.get((tt["reel"], tt["row"]))
                if bv is not None and bv != tt["multiplier"]:
                    err("stele value on board != value in totemMultiplier")
                if bv is None:
                    err("totemMultiplier stele not on the board")
            exp = min(CAP, round(e["baseWin"] * e["totalMult"]))
            if abs(exp - e["totalWin"]) > max(2, e["totalWin"] * 0.001) and e["totalWin"] < CAP:
                err("totalWin != baseWin * totalMult")
        elif t == "multCollect":
            if not divine:
                err("multCollect outside the divine bonus")
            kept += e["added"]
            if kept != e["total"]:
                err("multCollect total mismatch")
        elif t == "setWin":
            last_set_win = e["amount"]
            spin_sum += e["amount"]
        elif t == "setTotalWin":
            last_total = e["amount"]
        elif t == "freeSpinTrigger":
            n = len(e["positions"])
            exp_fs = CFG.freespin_triggers[CFG.basegame_type][min(5, n)]
            if e["totalFs"] != exp_fs:
                err(f"trigger with {n} scatters gives {e['totalFs']} spins, expected {exp_fs}")
            tot_fs = e["totalFs"]
            stats[f"trigger_{n}"] += 1
        elif t == "stageInfo":
            in_fs = True
            stage = e["stage"]
            runes = e["runes"]
            divine = bool(e.get("divine"))
            if runes != (stage - 1) * CFG.runes_per_stage:
                err("start runes do not match start stage")
        elif t == "updateFreeSpin":
            if e["amount"] != fs_seen + 1:
                err("free spin counter jumped")
            fs_seen = e["amount"]
            if e["total"] != tot_fs:
                err("updateFreeSpin total != expected total")
        elif t == "runeCollect":
            at_max = stage >= CFG.max_stage
            runes += len(e["positions"])
            if e["runes"] != runes:
                err("rune count mismatch")
            if at_max:
                stats["extraSpin_expected"] += 1
        elif t == "extraSpin":
            if stage < CFG.max_stage:
                err("extraSpin below the top stage")
            tot_fs += e["extraSpins"]
            if e["totalFs"] != tot_fs:
                err("extraSpin totalFs mismatch")
            stats["extraSpin"] += 1
        elif t == "stageUp":
            if e["stage"] != stage + 1:
                err("stage skipped")
            if runes < stage * CFG.runes_per_stage:
                err("stage-up without enough runes")
            stage = e["stage"]
            tot_fs += e["extraSpins"]
            if e["totalFs"] != tot_fs:
                err("stageUp totalFs mismatch")
            stats[f"stage_{stage}"] += 1
        elif t == "freeSpinEnd":
            if fs_seen + 1 != tot_fs and bk["payoutMultiplier"] < CAP:
                err(f"played {fs_seen + 1} of {tot_fs} free spins")
            stats["spins_played"] += fs_seen + 1
            stats["bonuses"] += 1
    if stats is not None and in_fs and stage < CFG.max_stage and runes >= stage * CFG.runes_per_stage and bk["payoutMultiplier"] < CAP:
        err("enough runes for a stage-up but no stage-up")
    if abs(last_total - bk["payoutMultiplier"]) > 1:
        err("running total win != payout")
    if bk["payoutMultiplier"] < CAP and abs(spin_sum - bk["payoutMultiplier"]) > max(2, bk["payoutMultiplier"] * 0.001):
        err("sum of spin wins != payout")


def main():
    modes = sys.argv[1:] or [bm.get_name() for bm in CFG.bet_modes]
    total_errs = 0
    for m in modes:
        pub = os.path.join(os.path.dirname(__file__), "library", "publish_files", f"books_{m}.jsonl.zst")
        import io
        import zstandard
        errs = Counter()
        stats = Counter()
        n = 0
        with open(pub, "rb") as fh:
            text = io.TextIOWrapper(zstandard.ZstdDecompressor().stream_reader(fh), encoding="utf-8")
            for line in text:
                if line.strip():
                    check_book(json.loads(line), m, errs, stats)
                    n += 1
        books = range(n)
        total_errs += sum(errs.values())
        print(f"{m:10s} {len(books):7d} books  errors: {dict(errs) or 'none'}")
        if stats:
            print("           ", dict(stats))
    sys.exit(1 if total_errs else 0)


if __name__ == "__main__":
    main()
