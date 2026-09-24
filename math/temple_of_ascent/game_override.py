from game_executables import GameExecutables
from src.calculations.statistics import get_random_outcome


class GameStateOverride(GameExecutables):
    """Overrides / extensions of the universal state functions."""

    def reset_book(self):
        super().reset_book()
        self.stage = 0  # 0 = base game, 1..4 = free-spin stages
        self.runes = 0

    def assign_special_sym_function(self):
        self.special_symbol_functions = {"T": [self.assign_totem_value]}

    def assign_totem_value(self, symbol) -> None:
        """Every totem carves a multiplier from the table of the current stage."""
        if self.gametype == self.config.freegame_type and self.stage > 0:
            table = self.config.stage_totem_values[self.stage]
        else:
            table = self.config.base_totem_values
        symbol.assign_attribute({"multiplier": get_random_outcome(table)})

    def check_repeat(self):
        super().check_repeat()
        if self.repeat is False:
            win_criteria = self.get_current_betmode_distributions().get_win_criteria()
            if win_criteria is not None and self.final_win != win_criteria:
                self.repeat = True
                return
            if win_criteria is None and self.final_win == 0:
                self.repeat = True
                return
