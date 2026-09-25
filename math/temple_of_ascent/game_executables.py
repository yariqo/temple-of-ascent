"""Game-specific executables for Temple of Ascent."""

import random

from game_calculations import GameCalculations
from game_events import totem_mult_event, rune_collect_event, stage_up_event, jaguar_roar_event, mult_collect_event, extra_spin_event
from src.calculations.statistics import get_random_outcome
from src.calculations.lines import Lines
from src.events.events import win_info_event, set_win_event, set_total_event


class GameExecutables(GameCalculations):

    # ---------- totems ----------
    def get_totems_on_board(self) -> list:
        totems = []
        for reel, column in enumerate(self.board):
            for row, sym in enumerate(column):
                if sym.name == "T":
                    totems.append({"reel": reel, "row": row, "value": int(sym.get_attribute("multiplier"))})
        return totems

    def evaluate_totem_lines(self):
        """Evaluate line wins, then multiply the spin win by the SUM of all totems on the board."""
        self.win_data = Lines.get_lines(self.board, self.config, multiplier_method="global", global_multiplier=1)
        Lines.record_lines_wins(self)
        base_win = self.win_data["totalWin"]

        totems = self.get_totems_on_board()
        board_mult = sum(t["value"] for t in totems)
        # Divine Bonus: the collected multiplier stays and is added to every later win
        kept = self.collected if self.divine else 0
        total_mult = board_mult + kept
        final_win = base_win
        if base_win > 0 and total_mult > 0:
            final_win = round(base_win * total_mult, 2)

        self.win_manager.update_spinwin(final_win)

        if base_win > 0:
            win_info_event(self)
            if total_mult > 0:
                totem_mult_event(self, totems, total_mult, base_win, final_win, kept)
                self.record({"totemMult": self.bucket_mult(total_mult), "gametype": self.gametype})
            if self.divine and board_mult > 0:
                self.collected += board_mult
                mult_collect_event(self, totems, board_mult, self.collected)
            self.evaluate_wincap()
            set_win_event(self)
        set_total_event(self)

    @staticmethod
    def bucket_mult(m: int) -> str:
        for lo, hi in ((0, 5), (5, 20), (20, 100), (100, 500)):
            if lo < m <= hi:
                return f"{lo + 1}-{hi}"
        return "500+"

    # ---------- jaguar roar ----------
    def maybe_jaguar_roar(self):
        """Base-game modifier: with a small chance (always in Jaguar-Spins) the jaguar roars
        and throws extra totems onto non-special positions of the board."""
        cond = self.get_current_distribution_conditions().get("jaguar")
        if cond is None or self.gametype != self.config.basegame_type:
            return
        if random.random() >= cond["chance"]:
            return
        n = get_random_outcome(cond["count"])
        free = [
            (r, w)
            for r, column in enumerate(self.board)
            for w, sym in enumerate(column)
            if not sym.is_special
        ]
        chosen = random.sample(free, min(n, len(free)))
        totems = []
        for r, w in sorted(chosen):
            sym = self.create_symbol("T")
            value = get_random_outcome(cond["values"])
            sym.assign_attribute({"multiplier": value})
            self.board[r][w] = sym
            totems.append({"reel": r, "row": w, "value": value})
        self.get_special_symbols_on_board()
        jaguar_roar_event(self, totems, cond.get("golden", False))
        self.record({"jaguar": len(totems), "gametype": self.gametype})

    # ---------- runes / stages ----------
    def runes_to_next_stage(self) -> int:
        if self.stage >= self.config.max_stage:
            return 0
        return self.stage * self.config.runes_per_stage - self.runes

    def collect_runes(self):
        """Collect runes landed in free spins; every 3 runes upgrade the stage (+spins, better totems)."""
        positions = [
            {"reel": r, "row": w}
            for r, column in enumerate(self.board)
            for w, sym in enumerate(column)
            if sym.name == "S"
        ]
        if not positions:
            return
        at_max = self.stage >= self.config.max_stage
        self.runes += len(positions)
        rune_collect_event(self, positions)
        if at_max:
            # on the top stage every BONUS symbol adds one more free spin
            self.tot_fs += len(positions)
            extra_spin_event(self, len(positions))
        while self.stage < self.config.max_stage and self.runes >= self.stage * self.config.runes_per_stage:
            self.stage += 1
            self.tot_fs += self.config.stage_up_spins
            stage_up_event(self, self.config.stage_up_spins)
