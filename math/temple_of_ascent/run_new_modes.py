"""Simulate only the new bonus-buy modes (keeps the other modes' books)."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from gamestate import GameState
from game_config import GameConfig
from src.state.run_sims import create_books
if __name__ == "__main__":
    config = GameConfig()
    gs = GameState(config)
    create_books(gs, config, {"superbonus": int(1e5), "godbonus": int(1e5)}, 5000, 2, True, False)
