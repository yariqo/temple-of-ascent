"""Natural (un-forced) base game stats: hit rate and base-game RTP without free spins."""
import sys, os, random
sys.path.insert(0, os.path.dirname(__file__))
from gamestate import GameState
from game_config import GameConfig
cfg = GameConfig(); gs = GameState(cfg)
gs.betmode = "base"; gs.criteria = "basegame"
n = int(sys.argv[1]) if len(sys.argv) > 1 else 50000
random.seed(1); tot = 0; hits = 0
for i in range(n):
    gs.reset_book(); gs.draw_board(emit_event=False); gs.maybe_jaguar_roar()
    gs.evaluate_totem_lines()
    w = gs.win_manager.spin_win; tot += w; hits += w > 0
print(f"base-only RTP={tot/n:.3f} hit-rate=1 in {n/hits:.2f}")
