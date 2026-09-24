from game_override import GameStateOverride
from game_events import stage_info_event


class GameState(GameStateOverride):
    """Handles game logic and events for a single simulation number/game-round."""

    def run_spin(self, sim, simulation_seed=None):
        self.reset_seed(sim)
        self.repeat = True
        while self.repeat:
            self.reset_book()
            self.draw_board()
            self.maybe_jaguar_roar()

            self.evaluate_totem_lines()
            self.win_manager.update_gametype_wins(self.gametype)

            if self.check_fs_condition() and self.check_freespin_entry():
                self.run_freespin_from_base()

            self.evaluate_finalwin()
            self.check_repeat()
        self.imprint_wins()

    def run_freespin(self):
        self.reset_fs_spin()
        # 3 / 4 / 5 runes (scatters) decide which bonus starts:
        #   3 -> Temple Bonus (stage 1), 4 -> Super Bonus (stage 2), 5 -> Divine Bonus (stage 3)
        self.stage = self.config.scatter_start_stage[min(5, self.trigger_scatters)]
        self.runes = (self.stage - 1) * self.config.runes_per_stage
        # Divine Bonus: steles that take part in a win are collected and their value stays
        self.divine = self.stage >= self.config.divine_stage
        self.collected = 0
        stage_info_event(self)
        while self.fs < self.tot_fs and not self.wincap_triggered:
            self.update_freespin()
            self.draw_board()

            self.evaluate_totem_lines()
            self.collect_runes()

            self.win_manager.update_gametype_wins(self.gametype)

        self.record({"stage": self.stage, "gametype": self.gametype})
        self.end_freespin()
