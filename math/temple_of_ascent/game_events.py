"""Custom events for Temple of Ascent.

All row positions include the padding offset (+1), matching the SDK's standard events.
All win amounts are integers in cents of the bet multiplier (x100), like the SDK.
"""

TOTEM_MULT = "totemMultiplier"
RUNE_COLLECT = "runeCollect"
STAGE_UP = "stageUp"
STAGE_INFO = "stageInfo"


def _cents(gamestate, amount: float) -> int:
    return int(round(min(amount, gamestate.config.wincap) * 100, 0))


def totem_mult_event(gamestate, totems: list, total_mult: int, base_win: float, final_win: float, kept: int = 0):
    """Totems on the board carved their multipliers; their SUM (+ the kept Divine multiplier)
    multiplies the spin's line wins."""
    pad = 1 if gamestate.config.include_padding else 0
    event = {
        "index": len(gamestate.book.events),
        "type": TOTEM_MULT,
        "totems": [{"reel": t["reel"], "row": t["row"] + pad, "multiplier": t["value"]} for t in totems],
        "totalMult": int(total_mult),
        "keptMult": int(kept),
        "baseWin": _cents(gamestate, base_win),
        "totalWin": _cents(gamestate, final_win),
    }
    gamestate.book.add_event(event)


JAGUAR_ROAR = "jaguarRoar"


def jaguar_roar_event(gamestate, totems: list, golden: bool):
    """The jaguar roars after the reveal and throws extra totems onto the board.
    These positions are replaced by a totem (T) carrying the given multiplier."""
    pad = 1 if gamestate.config.include_padding else 0
    event = {
        "index": len(gamestate.book.events),
        "type": JAGUAR_ROAR,
        "golden": golden,
        "totems": [{"reel": t["reel"], "row": t["row"] + pad, "multiplier": t["value"]} for t in totems],
    }
    gamestate.book.add_event(event)


def stage_info_event(gamestate):
    """Sent at free-spin start: current stage, rune progress and the stage's possible totem values.
    divine = True for the Divine Bonus (collected multiplier stays)."""
    event = {
        "index": len(gamestate.book.events),
        "type": STAGE_INFO,
        "stage": gamestate.stage,
        "divine": bool(gamestate.divine),
        "runes": gamestate.runes,
        "runesToNext": gamestate.runes_to_next_stage(),
        "totemValues": sorted(gamestate.config.stage_totem_values[gamestate.stage].keys()),
    }
    gamestate.book.add_event(event)


def rune_collect_event(gamestate, positions: list):
    """Runes (scatters) landed during free spins and are collected into the stage meter."""
    pad = 1 if gamestate.config.include_padding else 0
    event = {
        "index": len(gamestate.book.events),
        "type": RUNE_COLLECT,
        "positions": [{"reel": p["reel"], "row": p["row"] + pad} for p in positions],
        "runes": gamestate.runes,
        "runesToNext": gamestate.runes_to_next_stage(),
    }
    gamestate.book.add_event(event)


def stage_up_event(gamestate, extra_spins: int):
    """Stage upgrade: better totem values and extra free spins."""
    event = {
        "index": len(gamestate.book.events),
        "type": STAGE_UP,
        "stage": gamestate.stage,
        "extraSpins": extra_spins,
        "totalFs": gamestate.tot_fs,
        "totemValues": sorted(gamestate.config.stage_totem_values[gamestate.stage].keys()),
    }
    gamestate.book.add_event(event)


MULT_COLLECT = "multCollect"


def mult_collect_event(gamestate, totems: list, added: int, total: int):
    """Divine Bonus: steles that took part in a win are collected; their value stays for the rest of the bonus."""
    pad = 1 if gamestate.config.include_padding else 0
    event = {
        "index": len(gamestate.book.events),
        "type": MULT_COLLECT,
        "totems": [{"reel": t["reel"], "row": t["row"] + pad, "multiplier": t["value"]} for t in totems],
        "added": int(added),
        "total": int(total),
    }
    gamestate.book.add_event(event)


EXTRA_SPIN = "extraSpin"


def extra_spin_event(gamestate, spins: int):
    """Top stage reached: every BONUS symbol that lands adds one free spin."""
    event = {
        "index": len(gamestate.book.events),
        "type": EXTRA_SPIN,
        "extraSpins": int(spins),
        "totalFs": gamestate.tot_fs,
    }
    gamestate.book.add_event(event)
