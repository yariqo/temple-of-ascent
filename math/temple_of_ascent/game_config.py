"""Temple of Ascent - game configuration."""

import os
from src.config.config import Config
from src.config.distributions import Distribution
from src.config.betmode import BetMode


class GameConfig(Config):

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        super().__init__()
        self.game_id = "temple_of_ascent"
        self.provider_number = 0
        self.working_name = "Temple of Ascent"
        self.wincap = 10000.0
        self.win_type = "lines"
        self.rtp = 0.9600
        self.construct_paths()

        # ---------------- Board ----------------
        self.num_reels = 5
        self.num_rows = [4] * self.num_reels

        # Pays are in multiples of the total bet (20 fixed lines)
        self.paytable = {
            (5, "H1"): 30, (4, "H1"): 6, (3, "H1"): 1.5,
            (5, "H2"): 20, (4, "H2"): 5, (3, "H2"): 1.2,
            (5, "H3"): 12, (4, "H3"): 3, (3, "H3"): 1.0,
            (5, "H4"): 10, (4, "H4"): 2.5, (3, "H4"): 0.8,
            (5, "L1"): 5, (4, "L1"): 1.2, (3, "L1"): 0.5,
            (5, "L2"): 4, (4, "L2"): 1.0, (3, "L2"): 0.4,
            (5, "L3"): 3, (4, "L3"): 0.8, (3, "L3"): 0.3,
            (5, "L4"): 2.5, (4, "L4"): 0.6, (3, "L4"): 0.2,
            (5, "L5"): 2, (4, "L5"): 0.5, (3, "L5"): 0.2,
        }

        # 20 paylines on a 5x4 grid (row index per reel, 0 = top)
        self.paylines = {
            1: [0, 0, 0, 0, 0],
            2: [1, 1, 1, 1, 1],
            3: [2, 2, 2, 2, 2],
            4: [3, 3, 3, 3, 3],
            5: [0, 1, 2, 1, 0],
            6: [3, 2, 1, 2, 3],
            7: [1, 2, 3, 2, 1],
            8: [2, 1, 0, 1, 2],
            9: [0, 0, 1, 0, 0],
            10: [3, 3, 2, 3, 3],
            11: [1, 0, 0, 0, 1],
            12: [2, 3, 3, 3, 2],
            13: [0, 1, 1, 1, 0],
            14: [3, 2, 2, 2, 3],
            15: [1, 2, 2, 2, 1],
            16: [2, 1, 1, 1, 2],
            17: [0, 1, 0, 1, 0],
            18: [3, 2, 3, 2, 3],
            19: [1, 1, 0, 1, 1],
            20: [2, 2, 3, 2, 2],
        }

        self.include_padding = True
        # W = Wild, S = Spirit Rune (scatter), T = Totem (carries a multiplier)
        self.special_symbols = {"wild": ["W"], "scatter": ["S"], "multiplier": ["T"]}

        # Free spins awarded by Runes in the base game
        self.freespin_triggers = {
            self.basegame_type: {3: 10, 4: 10, 5: 8},  # Temple/Super 10 spins, Divine 8 (collected multis stay)
            self.freegame_type: {3: 0},  # runes do not retrigger, they upgrade the stage
        }
        self.anticipation_triggers = {
            self.basegame_type: 2,
            self.freegame_type: 99,  # no anticipation in free spins
        }

        # ---------------- Totem / Stage feature ----------------
        # Base game totem values
        self.base_totem_values = {2: 50, 3: 30, 5: 15, 10: 5}
        # Totem values per free-spin stage ("better totems" on each stage)
        self.stage_totem_values = {
            1: {2: 35, 3: 30, 5: 22, 10: 10, 25: 3},
            2: {5: 40, 10: 30, 15: 15, 25: 10, 50: 5},
            3: {10: 35, 20: 30, 25: 15, 50: 12, 100: 6, 250: 2},
            4: {25: 40, 50: 32, 100: 18, 250: 7, 500: 3},
        }
        self.max_stage = 4
        self.runes_per_stage = 3  # every 3 runes collected -> next stage
        self.stage_up_spins = 4  # extra spins awarded on every stage-up
        self.jaguar_spin_cost = 25.0  # cost of one Jaguar-Spin (feature spin) in bets
        self.superbonus_cost = 200.0  # bonus buy starting on stage 2
        self.godbonus_cost = 500.0  # Divine Bonus buy (stage 3 + collected multiplier stays)
        # how many runes trigger which bonus: 3 -> Temple Bonus, 4 -> Super Bonus, 5 -> Divine Bonus
        self.scatter_start_stage = {3: 1, 4: 2, 5: 3}
        self.divine_stage = 3  # bonuses starting on this stage keep their collected multipliers

        # ---------------- Reels ----------------
        reels = {"BR0": "BR0.csv", "FR0": "FR0.csv", "WCAP": "FRWCAP.csv"}
        self.reels = {}
        for r, f in reels.items():
            self.reels[r] = self.read_reels_csv(os.path.join(self.reels_path, f))

        self.padding_reels[self.basegame_type] = self.reels["BR0"]
        self.padding_reels[self.freegame_type] = self.reels["FR0"]
        self.padding_symbol_values = {"T": {"multiplier": self.base_totem_values}}

        # ---------------- Jaguar roar (base-game modifier) ----------------
        # Normal spins: small chance that the jaguar throws 1-3 extra totems (stage-1 values)
        self.jaguar_roar = {
            "chance": 1 / 25,
            "count": {1: 50, 2: 35, 3: 15},
            "values": {2: 30, 3: 30, 5: 25, 10: 12, 25: 3},
            "golden": False,
        }
        # Jaguar-Spin (feature spin): the jaguar ALWAYS roars and throws 2-4 GOLDEN totems
        # carrying stage-2 values; every Jaguar-Spin is guaranteed to pay (no free spins).
        self.jaguar_spin_roar = {
            "chance": 1.0,
            "count": {2: 45, 3: 35, 4: 20},
            "values": {5: 40, 10: 30, 15: 15, 25: 10, 50: 5},
            "golden": True,
        }

        # ---------------- Distributions ----------------
        freegame_condition = {
            "reel_weights": {
                self.basegame_type: {"BR0": 1},
                self.freegame_type: {"FR0": 1},
            },
            # base game: most bonuses are Temple Bonuses, some Super, a few Divine
            "scatter_triggers": {3: 85, 4: 12, 5: 3},
            "jaguar": self.jaguar_roar,
            "force_wincap": False,
            "force_freegame": True,
        }

        basegame_condition = {
            "reel_weights": {self.basegame_type: {"BR0": 1}},
            "jaguar": self.jaguar_roar,
            "force_wincap": False,
            "force_freegame": False,
        }

        wincap_condition = {
            "reel_weights": {
                self.basegame_type: {"BR0": 1},
                self.freegame_type: {"FR0": 1, "WCAP": 4},
            },
            "scatter_triggers": {4: 1, 5: 2},
            "force_wincap": True,
            "force_freegame": True,
        }

        zerowin_condition = {
            "reel_weights": {self.basegame_type: {"BR0": 1}},
            "jaguar": self.jaguar_roar,
            "force_wincap": False,
            "force_freegame": False,
        }

        jaguar_spin_condition = {
            "reel_weights": {self.basegame_type: {"BR0": 1}},
            "jaguar": self.jaguar_spin_roar,
            "force_wincap": False,
            "force_freegame": False,
        }

        # bonus buys force exactly 3 / 4 / 5 runes (Temple / Super / Divine Bonus)
        def with_runes(cond: dict, n: int) -> dict:
            c = dict(cond)
            c["scatter_triggers"] = {n: 1}
            return c

        mode_maxwins = {"base": 10000, "bonushunt": 10000, "jaguar": 10000, "bonus": 10000,
                        "superbonus": 10000, "godbonus": 10000}
        self.bet_modes = [
            # Normal spin
            BetMode(
                name="base",
                cost=1.0,
                rtp=self.rtp,
                max_win=mode_maxwins["base"],
                auto_close_disabled=False,
                is_feature=True,
                is_buybonus=False,
                distributions=[
                    Distribution(
                        criteria="wincap",
                        quota=0.001,
                        win_criteria=mode_maxwins["base"],
                        conditions=wincap_condition,
                    ),
                    Distribution(criteria="freegame", quota=0.1, conditions=freegame_condition),
                    Distribution(criteria="0", quota=0.4, win_criteria=0.0, conditions=zerowin_condition),
                    Distribution(criteria="basegame", quota=0.5, conditions=basegame_condition),
                ],
            ),
            # Bonus-Jagd: 1.5x bet, 2x the chance to trigger free spins (1 in 100 instead of 1 in 200)
            BetMode(
                name="bonushunt",
                cost=1.5,
                rtp=self.rtp,
                max_win=mode_maxwins["bonushunt"],
                auto_close_disabled=False,
                is_feature=True,
                is_buybonus=False,
                distributions=[
                    Distribution(
                        criteria="wincap",
                        quota=0.002,
                        win_criteria=mode_maxwins["bonushunt"],
                        conditions=wincap_condition,
                    ),
                    Distribution(criteria="freegame", quota=0.25, conditions=freegame_condition),
                    Distribution(criteria="0", quota=0.3, win_criteria=0.0, conditions=zerowin_condition),
                    Distribution(criteria="basegame", quota=0.448, conditions=basegame_condition),
                ],
            ),
            # Jaguar-Spin (feature spin): guaranteed golden jaguar roar + guaranteed win
            BetMode(
                name="jaguar",
                cost=self.jaguar_spin_cost,
                rtp=self.rtp,
                max_win=mode_maxwins["jaguar"],
                auto_close_disabled=False,
                is_feature=True,
                is_buybonus=False,
                distributions=[
                    Distribution(criteria="jaguarspin", quota=1.0, conditions=jaguar_spin_condition),
                ],
            ),
            # Bonus buy
            BetMode(
                name="bonus",
                cost=100.0,
                rtp=self.rtp,
                max_win=mode_maxwins["bonus"],
                auto_close_disabled=False,
                is_feature=False,
                is_buybonus=True,
                distributions=[
                    Distribution(
                        criteria="wincap",
                        quota=0.001,
                        win_criteria=mode_maxwins["bonus"],
                        conditions=with_runes(wincap_condition, 3),
                    ),
                    Distribution(criteria="freegame", quota=0.999, conditions=with_runes(freegame_condition, 3)),
                ],
            ),
            # Super Bonus buy (4 runes): starts on stage 2 (steles 5x-50x)
            BetMode(
                name="superbonus",
                cost=self.superbonus_cost,
                rtp=self.rtp,
                max_win=mode_maxwins["superbonus"],
                auto_close_disabled=False,
                is_feature=False,
                is_buybonus=True,
                distributions=[
                    Distribution(
                        criteria="wincap",
                        quota=0.001,
                        win_criteria=mode_maxwins["superbonus"],
                        conditions=with_runes(wincap_condition, 4),
                    ),
                    Distribution(criteria="freegame", quota=0.999, conditions=with_runes(freegame_condition, 4)),
                ],
            ),
            # Divine Bonus buy (5 runes): starts on stage 3, steles that win are collected and stay
            BetMode(
                name="godbonus",
                cost=self.godbonus_cost,
                rtp=self.rtp,
                max_win=mode_maxwins["godbonus"],
                auto_close_disabled=False,
                is_feature=False,
                is_buybonus=True,
                distributions=[
                    Distribution(
                        criteria="wincap",
                        quota=0.001,
                        win_criteria=mode_maxwins["godbonus"],
                        conditions=with_runes(wincap_condition, 5),
                    ),
                    Distribution(criteria="freegame", quota=0.999, conditions=with_runes(freegame_condition, 5)),
                ],
            ),
        ]
