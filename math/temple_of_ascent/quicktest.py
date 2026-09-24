"""Small uncompressed run for debugging books output."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from gamestate import GameState
from game_config import GameConfig
from src.state.run_sims import create_books
from src.write_data.write_configs import generate_configs

if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 100
    config = GameConfig()
    gamestate = GameState(config)
    modes = sys.argv[2].split(",") if len(sys.argv) > 2 else [bm.get_name() for bm in config.bet_modes]
    create_books(gamestate, config, {m: n for m in modes}, n, 1, False, False)
    generate_configs(gamestate)
