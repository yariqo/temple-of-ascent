"""Main file for generating results for Temple of Ascent."""

from gamestate import GameState
from game_config import GameConfig
from game_optimization import OptimizationSetup
from optimization_program.run_script import OptimizationExecution
from utils.game_analytics.run_analysis import create_stat_sheet
from utils.rgs_verification import execute_all_tests
from src.state.run_sims import create_books
from src.write_data.write_configs import generate_configs

if __name__ == "__main__":
    import sys
    N = float(sys.argv[1]) if len(sys.argv) > 1 else 1e5

    num_threads = 2
    rust_threads = 2
    batching_size = 5000
    compression = True
    profiling = False

    num_sim_args = {
        "base": int(N),
        "bonushunt": int(N),
        "jaguar": int(N),
        "jaguarking": int(N),
        "bonus": int(N),
        "superbonus": int(N),
        "godbonus": int(N),
    }

    run_conditions = {
        "run_sims": "nosim" not in sys.argv,
        "run_optimization": False,  # SDK Gaussian optimiser (not used, see natural_weights.py)
        "natural_weights": True,
        "run_analysis": True,
        "run_format_checks": True,
    }
    target_modes = list(num_sim_args.keys())

    config = GameConfig()
    gamestate = GameState(config)
    if run_conditions["run_optimization"] or run_conditions["run_analysis"]:
        optimization_setup_class = OptimizationSetup(config)

    if run_conditions["run_sims"]:
        create_books(
            gamestate,
            config,
            num_sim_args,
            batching_size,
            num_threads,
            compression,
            profiling,
        )

    generate_configs(gamestate)

    if run_conditions["run_optimization"]:
        OptimizationExecution().run_all_modes(config, target_modes, rust_threads)
        generate_configs(gamestate)

    if run_conditions["natural_weights"]:
        import natural_weights

        natural_weights.main()
        generate_configs(gamestate)

    if run_conditions["run_analysis"]:
        custom_keys = [{"symbol": "scatter"}, {"jaguar": "1"}, {"jaguar": "2"}, {"jaguar": "3"}, {"jaguar": "4"}]
        create_stat_sheet(gamestate, custom_keys=custom_keys)

    if run_conditions["run_format_checks"]:
        execute_all_tests(config)
