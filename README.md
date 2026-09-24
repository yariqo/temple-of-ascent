# StakeGame – Temple of Ascent

```
StakeGame/
├─ KONZEPT.md                       Spielregeln, Modi, Multis, Stufen, Events, Statistik
├─ THEMA.md                         Azteken-Dschungel-Look, Sound, Momente
└─ math/temple_of_ascent/               Spiel-Mathe (Stake Math SDK)
   ├─ game_config.py                Paytable, Linien, Totem-Tabellen, Bet-Modes
   ├─ gamestate.py                  Ablauf Basisspiel / Freispiele
   ├─ game_executables.py           Totem-Multi & Runen/Stufen-Logik
   ├─ game_events.py                eigene Events fürs Frontend
   ├─ game_override.py              Totem-Werte je Stufe
   ├─ game_optimization.py          (alte SDK-Optimierer-Ziele, aktuell nicht genutzt)
   ├─ reels/ + make_reels.py        Walzenstreifen (generiert)
   ├─ run.py                        komplette Simulation + Gewichtung + Analyse + Checks
   │                                 (python run.py 1e5  |  python run.py 1e5 nosim = nur neu gewichten)
   ├─ natural_weights.py            natürliche Gewichtung, trifft RTP exakt
   ├─ report.py                     Statistik der finalen Lookup-Tables
   ├─ quicktest.py / stats.py / natural_base.py   Test- und Tuning-Tools
   └─ library/publish_files/        >>> DIESE Dateien werden bei Stake hochgeladen <<<
```

## Lokal ausführen (optional)
1. Python 3.12+ installieren (Rust wird nur für den alten SDK-Optimierer gebraucht).
2. `git clone https://github.com/StakeEngine/math-sdk.git` und darin `make setup` ausführen.
3. Den Ordner `math/temple_of_ascent` nach `math-sdk/games/` kopieren.
4. `python games/temple_of_ascent/run.py 1e5` startet Simulation, Gewichtung, Analyse und Format-Checks.

## Git
Die Books-Dateien (`library/publish_files/*.jsonl.zst`, zusammen ca. 250 MB) sind nicht im Git-Repository. GitHub erlaubt höchstens 100 MB pro Datei. Sie liegen im lokalen Ordner `StakeGame` und lassen sich jederzeit mit `run.py 1e5` neu erzeugen. Die Simulation ist per Seed reproduzierbar.
