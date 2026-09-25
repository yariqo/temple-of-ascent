"""Optimization targets for Temple of Ascent (target RTP 96.00%)."""

from optimization_program.optimization_config import (
    ConstructScaling,
    ConstructParameters,
    ConstructConditions,
    ConstructFenceBias,
    verify_optimization_input,
)


class OptimizationSetup:

    def __init__(self, game_config):
        self.game_config = game_config
        wincaps = {bm.get_name(): bm.get_wincap() for bm in game_config.bet_modes}

        self.game_config.opt_params = {
            "base": {
                "conditions": {
                    "wincap": ConstructConditions(
                        rtp=0.001, av_win=wincaps["base"], search_conditions=wincaps["base"]
                    ).return_dict(),
                    "0": ConstructConditions(rtp=0, av_win=0, search_conditions=0).return_dict(),
                    # free spins: ~1 in 200 spins, 50% of RTP
                    "freegame": ConstructConditions(
                        rtp=0.500, hr=200, search_conditions={"symbol": "scatter"}
                    ).return_dict(),
                    # base game wins: 45.9% of RTP, hit ~1 in 3.6
                    "basegame": ConstructConditions(hr=3.6, rtp=0.459).return_dict(),
                },
                "scaling": ConstructScaling(
                    [
                        {"criteria": "basegame", "scale_factor": 1.2, "win_range": (1, 2), "probability": 1.0},
                        {"criteria": "freegame", "scale_factor": 2.0, "win_range": (1000, 9999), "probability": 1.0},
                    ]
                ).return_dict(),
                "parameters": ConstructParameters(
                    num_show=5000,
                    num_per_fence=10000,
                    min_m2m=1.5,
                    max_m2m=4,
                    pmb_rtp=1.0,
                    sim_trials=5000,
                    test_spins=[50, 100, 200],
                    test_weights=[0.3, 0.4, 0.3],
                    score_type="rtp",
                ).return_dict(),
                "distribution_bias": ConstructFenceBias(
                    applied_criteria=["basegame"],
                    bias_ranges=[(2.0, 3.0)],
                    bias_weights=[0.5],
                ).return_dict(),
            },
            "bonus": {
                "conditions": {
                    "wincap": ConstructConditions(
                        rtp=0.001, av_win=wincaps["bonus"], search_conditions=wincaps["bonus"]
                    ).return_dict(),
                    "freegame": ConstructConditions(rtp=0.959, hr="x").return_dict(),
                },
                "scaling": ConstructScaling(
                    [
                        {"criteria": "freegame", "scale_factor": 0.9, "win_range": (1, 20), "probability": 1.0},
                        {"criteria": "freegame", "scale_factor": 1.2, "win_range": (50, 200), "probability": 1.0},
                        {"criteria": "freegame", "scale_factor": 1.5, "win_range": (1000, 9999), "probability": 1.0},
                    ]
                ).return_dict(),
                "parameters": ConstructParameters(
                    num_show=5000,
                    num_per_fence=10000,
                    min_m2m=2,
                    max_m2m=5,
                    pmb_rtp=1.0,
                    sim_trials=5000,
                    test_spins=[10, 20, 50],
                    test_weights=[0.6, 0.2, 0.2],
                    score_type="rtp",
                ).return_dict(),
                "distribution_bias": ConstructFenceBias(
                    applied_criteria=["freegame"],
                    bias_ranges=[(100.0, 300.0)],
                    bias_weights=[0.3],
                ).return_dict(),
            },
        }

        def params(test_spins, test_weights, m2m):
            return ConstructParameters(
                num_show=5000,
                num_per_fence=10000,
                min_m2m=m2m[0],
                max_m2m=m2m[1],
                pmb_rtp=1.0,
                sim_trials=5000,
                test_spins=test_spins,
                test_weights=test_weights,
                score_type="rtp",
            ).return_dict()

        # Bonus-Jagd: 1.5x cost, free spins 1 in 100 (2x the base-game chance) - NOTE: optimiser not used, see natural_weights.py
        self.game_config.opt_params["bonushunt"] = {
            "conditions": {
                "wincap": ConstructConditions(
                    rtp=0.001, av_win=wincaps["bonushunt"], search_conditions=wincaps["bonushunt"]
                ).return_dict(),
                "0": ConstructConditions(rtp=0, av_win=0, search_conditions=0).return_dict(),
                "freegame": ConstructConditions(
                    rtp=0.500, hr=100, search_conditions={"symbol": "scatter"}
                ).return_dict(),
                "basegame": ConstructConditions(hr=3.6, rtp=0.459).return_dict(),
            },
            "scaling": ConstructScaling(
                [
                        {"criteria": "freegame", "scale_factor": 2.0, "win_range": (1000, 9999), "probability": 1.0},
                ]
            ).return_dict(),
            "parameters": params([50, 100, 200], [0.3, 0.4, 0.3], (1.5, 4)),
            "distribution_bias": ConstructFenceBias(
                applied_criteria=["basegame"], bias_ranges=[(2.0, 3.0)], bias_weights=[0.5]
            ).return_dict(),
        }

        # Jaguar-Spin: single criteria, every spin pays
        self.game_config.opt_params["jaguar"] = {
            "conditions": {
                "jaguarspin": ConstructConditions(rtp=0.960, hr="x").return_dict(),
            },
            "scaling": ConstructScaling(
                [
                    {"criteria": "jaguarspin", "scale_factor": 1.5, "win_range": (250, 9999), "probability": 1.0},
                ]
            ).return_dict(),
            "parameters": params([10, 20, 50], [0.6, 0.2, 0.2], (1.3, 3)),
            "distribution_bias": ConstructFenceBias(
                applied_criteria=["jaguarspin"], bias_ranges=[(40.0, 100.0)], bias_weights=[0.3]
            ).return_dict(),
        }

        # Jaguar-King spin: single criteria, every spin pays
        self.game_config.opt_params["jaguarking"] = {
            "conditions": {
                "kingspin": ConstructConditions(rtp=0.960, hr="x").return_dict(),
                "0": ConstructConditions(rtp=0, av_win=0, search_conditions=0).return_dict(),
            },
            "scaling": ConstructScaling(
                [
                    {"criteria": "kingspin", "scale_factor": 1.2, "win_range": (2000, 9999), "probability": 1.0},
                ]
            ).return_dict(),
            "parameters": params([10, 20, 50], [0.6, 0.2, 0.2], (1.3, 3)),
            "distribution_bias": ConstructFenceBias(
                applied_criteria=["kingspin"], bias_ranges=[(300.0, 800.0)], bias_weights=[0.3]
            ).return_dict(),
        }

        verify_optimization_input(self.game_config, self.game_config.opt_params)
