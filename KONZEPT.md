# BALAM RISING – Spielkonzept (v0.19)

*Name: **BALAM RISING** (Balam = Maya-Wort für Jaguar, „Rising“ = der Aufstieg auf der Tempelpyramide; Arbeitstitel vorher „Temple of Ascent“). Die internen IDs bleiben: game_id `temple_of_ascent`, Ordner `math/temple_of_ascent`. Thema: Azteken-Dschungel (siehe THEMA.md). Maskottchen: der Jaguar Balam.*

## Kurzbeschreibung
Ein 5×4-Slot mit 20 festen Gewinnlinien. Statt Glücksrädern gibt es **Stelen**: geschnitzte Säulen, die beim Landen rattern und auf einem **Multiplikator** stehen bleiben. Gibt es im Spin einen Liniengewinn, werden alle Stelen auf dem Feld **addiert** und multiplizieren diesen Gewinn.

Die Anzahl der **BONUS-Symbole** entscheidet über den Bonus:

| BONUS-Symbole | Bonus | Start |
|---|---|---|
| 3 | **Tempel-Bonus** | Stufe 1 |
| 4 | **Super-Bonus** | Stufe 2 |
| 5 | **Göttlicher Bonus** | Stufe 3, gesammelte Multis bleiben |

Tempel- und Super-Bonus haben 10 Freispiele, der Göttliche Bonus 8. In den Freispielen füllen BONUS-Symbole die Tempel-Pyramide. Alle 3 Symbole steigt man eine **Stufe** auf (max. Stufe 4). Das bringt **+4 Freispiele**, und die Stelen tragen **höhere Multis**. **Auf Stufe 4 bringt jedes BONUS-Symbol +1 Freispiel.** Die Werte der Stufe 4 (Obsidian) sind dafür etwas seltener: 25× 40 %, 50× 32 %, 100× 18 %, 250× 7 %, 500× 3 %.

**Göttlicher Bonus:** Jede Stele, die an einem Gewinn beteiligt ist, wird eingesammelt, und ihr Wert **bleibt** bis zum Ende des Bonus. Jeder spätere Gewinn wird mit „gesammelt + neue Stelen“ multipliziert.

## Eckdaten
| | |
|---|---|
| Raster | 5 Walzen × 4 Reihen, 20 Linien |
| RTP | **96,00 %** in allen 6 Spielmodi |
| Max. Gewinn | **10.000×** Einsatz |
| Trefferquote Basis | ca. 1 von 3,6 Spins |
| Bonus im Basisspiel | 1 von 200 Spins (Bonus-Jagd: 1 von 100) |
| Aufteilung der Boni im Basisspiel | 85 % Tempel, 12 % Super, 3 % Göttlich |
| Volatilität | hoch |

## Spielmodi
| Modus | Kosten | Was passiert |
|---|---|---|
| **Normaler Spin** | 1× | Basisspiel, im Schnitt jeder 25. Spin mit Jaguar-Ruf |
| **Bonus-Jagd** | 1,5× | Doppelte Chance auf einen Bonus |
| **Jaguar-Spin** (Feature-Spin) | 25× | 2–4 goldene Stelen (5×–50×) bei jedem Spin; sie zahlen nur mit Liniengewinn, 25 % der Spins zahlen 0. Keine Freispiele |
| **Jaguar-König** (Premium-Feature-Spin) | 250× | 2–4 Königsstelen bei jedem Spin, jede 50×/100×/250×/500×/1000× (Gewichte 40/32/18/7/3). Alles oder nichts: sie zahlen nur mit Liniengewinn, 40 % der Spins zahlen 0. Keine Freispiele |
| **Tempel-Bonus** (Kauf) | 100× | wie 3 BONUS-Symbole |
| **Super-Bonus** (Kauf) | 200× | wie 4 BONUS-Symbole |
| **Göttlicher Bonus** (Kauf) | **500×** | wie 5 BONUS-Symbole, Multis bleiben |

Weitere Funktionen:
- **Autoplay:**
  - Man wählt nur die Anzahl der Spins (10/25/50/100/250) und das Tempo: Normal, Turbo oder Super-Turbo.
  - Der Drehen-Knopf stoppt Autoplay.
  - Autoplay stoppt auch, wenn das Guthaben nicht mehr reicht.
  - Bei `disabledAutoplay` ist der Knopf ausgeblendet.
- **Turbo-Knopf:** Er schaltet der Reihe nach aus → Turbo (1 Blitz leuchtet, 2× so schnell) → Super-Turbo (2 Blitze, 3,6× so schnell). `disabledTurbo` blendet ihn aus, `disabledSuperTurbo` begrenzt ihn auf Turbo.
- **Musik:** generierte, kinoreife Tempelmusik aus Streichern, Chor und Hall.
  - Im Bonus kommen Taiko-Trommeln und ein Streicher-Ostinato dazu.
  - Man kann sie separat ein- und ausschalten.

## Stelen-Materialien (ab v0.19: nach Stufe)
Das Material zeigt die **Bonus-Stufe**, nicht den einzelnen Wert. Alle Stelen einer Stufe sind aus demselben Material und leuchten in dessen Farbe; beim Aufstieg wechseln auch die Stelen auf dem Feld sofort mit.

| Material | Wo | Werte |
|---|---|---|
| Stein | Basisspiel · Stufe 1 | 2×–10× · 2×–25× |
| Bronze | Stufe 2 | 5×–50× |
| Diamant | Stufe 3 | 10×–250× |
| Obsidian mit Goldglut | Stufe 4 | 25×–500× |
| Gold | Jaguar-Spin · Jaguar-König | 5×–50× · 50×–1000× |

Werte ab 100× bekommen beim Enthüllen einen Extra-Effekt (Zittern, Funken, Klang), ohne das Material zu ändern.
Starke Stelen rattern länger.

Der Multiplikator wird **Stele für Stele hochgezählt** (z. B. ×3 → ×13 → ×63), mit steigendem Ton. Erst danach kommt der Gewinn.

Fehlt in den Freispielen nur noch ein BONUS-Symbol zur nächsten Stufe, pulsiert diese Stufe in der Pyramide.

## Präsentation
- **Start-Screen:**
  - Logo und drei Steintafeln: „3 · 4 · 5 BONUS“, „MAX WIN 10.000×“ mit brüllendem Jaguar, „MULTIS BLEIBEN“.
  - Dazu der Knopf SPIELEN und „Nicht mehr anzeigen“.
  - Bei einer fortgesetzten Runde erscheint der Start-Screen nicht.
- **Animierter Hintergrund (`src/backdrop.ts`):** Ebenen mit Parallaxe.
  - Himmel mit Sternen, Mond, Sonne oder Finsternis und Wolken
  - Berge und Dunst
  - große Stufenpyramide mit Fackeln
  - Klippe mit Wasserfall, Bäume, Ranken
  - Vordergrundblätter, Nebel, Glühwürmchen
  - Lichtstrahlen und eine langsame Kamerafahrt
  - Jede Bonus-Stufe hat eine eigene Stimmung: Nacht, Morgen, Goldene Stunde, Blutrot, Finsternis.
- **Info-Menü (?):** Reiter für Übersicht, Symbole, Stelen, Bonus, Features, Linien und Bedienung, mit Bildern, Beispielen und einer Grafik der 20 Linien.

## Anzeige kleiner Gewinne
- Goldene Gewinnlinien und kleine Betragsschilder am Ende jeder Linie.
- Eine Plakette am unteren Rand des Spielfelds zeigt die Zusammensetzung: `$0.30 ×13 = $3.90`.
- Die Stelen fliegen einzeln in den Multiplikator.

## Bonus-Präsentation
- Beim Stufenaufstieg erscheint eine Einblendung mit den Stelen der neuen Stufe, „Stelen jetzt 5×–50×“ und „+4 Freispiele“.
- Auf Stufe 4 erscheint pro BONUS-Symbol das Banner „+1 FREISPIEL“.
- Nach jedem Bonus kommt der **TOTAL WIN**-Screen mit dem Gesamtgewinn und der Zahl der gespielten Freispiele, bei großen Gewinnen nach der Big-Win-Feier.

## Big-Win-Stufen
Ein großer Gewinn wird gefeiert, wenn er mindestens 20× Einsatz beträgt und nicht unter den Kosten der Runde liegt. Beim Hochzählen steigt der Titel Stufe für Stufe:

| ab | Titel | Effekt |
|---|---|---|
| 20× | BIG WIN | Gold, Münzfontäne |
| 50× | MEGA WIN | Sonnenstrahlen, Jaguar-Medaillon, mehr Münzen, Jaguar springt |
| 100× | EPIC WIN | Türkis, Edelsteine, Schütteln |
| 500× | LEGENDARY WIN | violette Sonnenfinsternis, Münzregen, der Jaguar brüllt |
| 1000× | BALAM WIN | Regenbogen-Sonne, alles zusammen |

Max-Win: **MAX WIN** in der höchsten Stufe. Der Betrag zählt bis zur nächsten Schwelle, hält kurz an, dann springt der Titel mit neuer Animation eine Stufe höher (wie bei Hacksaw). Antippen springt zum Endbetrag.

## Statistik je Modus (100.000 Runden pro Modus, finale Gewichte, v0.17)
| Modus | RTP | Gewinn ≥ Einsatz | Median | ≥ 1.000× | ≥ 5.000× | Max 10.000× |
|---|---|---|---|---|---|---|
| Normal (1×) | 96,00 % | 13,4 % | 0 | 1 von 28.400 | 1 von 569.000 | 1 von 1,6 Mio. |
| Bonus-Jagd (1,5×) | 96,00 % | 9,7 % | 0 | 1 von 11.800 | 1 von 268.000 | 1 von 789.000 |
| Jaguar-Spin (25×) | 96,00 % | 27,9 % | 12× | 1 von 7.060 | – | – |
| Jaguar-König (250×) | 96,00 % | 26,3 % | 80× | 1 von 20 | 1 von 574 | 1 von 13.700 |
| Tempel-Bonus (100×) | 96,00 % | 22,1 % | 32× | 1 von 113 | 1 von 12.250 | 1 von 51.700 |
| Super-Bonus (200×) | 96,00 % | 26,5 % | 83× | 1 von 40 | 1 von 1.900 | 1 von 30.200 |
| Göttlicher Bonus (500×) | 96,00 % | 25,9 % | 166× | 1 von 8 | 1 von 138 | 1 von 13.800 |

**Gewichtung:**
- Die Books werden mit ihrer natürlichen Wahrscheinlichkeit gewichtet (`natural_weights.py`).
- Nur die allergrößten Gewinne werden abgeschwächt, damit die Stake-Grenzen eingehalten werden.
- Die 96 % werden mit einer minimalen Korrektur exakt getroffen.

Alle 7 Modi bestehen die Prüfungen des SDK ohne Warnung. Zusätzlich prüft `bookcheck.py` alle 700.000 Runden auf innere Stimmigkeit (Gewinne, Multis, Stelenwerte, Stufen, Spins); es gab keinen Fehler.
- Format
- RTP ≤ 96,7 %
- prob5k
- prob10k
- etl40b
- etl10k
- cvar

## Symbole
| Code | Symbol | 3 / 4 / 5 gleiche |
|---|---|---|
| H1 | Jaguar-Maske | 1,5 / 6 / 30 |
| H2 | Quetzal | 1,2 / 5 / 20 |
| H3 | Schlange | 1,0 / 3 / 12 |
| H4 | Frosch-Idol | 0,8 / 2,5 / 10 |
| L1–L5 | Edelsteine | 0,2–0,5 / 0,5–1,2 / 2–5 |
| W | Wild (Walze 2–5) | ersetzt alle normalen Symbole |
| S | **BONUS** (Scatter, goldene Stufenpyramide mit Jade-Portal) | 3 / 4 / 5 = Tempel / Super / Göttlicher Bonus |
| T | **Stele** (Multiplikator) | trägt einen Multi, alle Stelen werden addiert |

## Stelen-Multis pro Stufe
| Stufe | Mögliche Werte |
|---|---|
| Basisspiel | 2×, 3×, 5×, 10× |
| Stufe 1 | 2×, 3×, 5×, 10×, 25× |
| Stufe 2 | 5×, 10×, 15×, 25×, 50× |
| Stufe 3 | 10×, 20×, 25×, 50×, 100×, 250× |
| Stufe 4 | 25×, 50×, 100×, 250×, 500× |

## Events für das Frontend
Standard-Events des SDK: `reveal`, `winInfo`, `setWin`, `setTotalWin`, `freeSpinTrigger`, `updateFreeSpin`, `freeSpinEnd`, `finalWin`, `wincap`.

Eigene Events:
- `totemMultiplier`: `totems[{reel,row,multiplier}]`, `totalMult`, `keptMult` (gesammelter Multi im Göttlichen Bonus), `baseWin`, `totalWin`
- `multCollect` (nur Göttlicher Bonus): `totems`, `added`, `total`
- `stageInfo`: `stage`, `divine`, `runes`, `runesToNext`, `totemValues`
- `runeCollect`: `positions`, `runes`, `runesToNext`
- `stageUp`: `stage`, `extraSpins`, `totalFs`, `totemValues`
- `extraSpin` (nur Stufe 4): `extraSpins`, `totalFs`
- `jaguarRoar`: `golden`, `king`, `totems[{reel,row,multiplier}]`

## Stand und nächste Schritte
- [x] Mathe-Modell, 6 Modi mit je 100.000 Runden, 96,00 %, alle Stake-Prüfungen bestanden
- [x] Frontend (Vite + PixiJS):
  - Azteken-Grafik und Jaguar-Maskottchen
  - Tempel-Tür
  - Musik und Sounds
  - Autoplay
  - BONUS-Menü
- [x] 3/4/5 BONUS-Symbole für Tempel-, Super- und Göttlichen Bonus, der Göttliche Bonus kostet 500× und behält die Multis
- [ ] Upload und Test auf Stake Engine
- [ ] Optional: professionelle Illustrationen und echte Musikaufnahmen

## Wie oft 4 und 5 BONUS-Symbole natürlich fallen (v0.18)
| Modus | 3 BONUS (Tempel) | 4 BONUS (Super) | 5 BONUS (Göttlich) |
|---|---|---|---|
| Normal (1×) | 1 von 232 Spins | 1 von 1.757 Spins | 1 von 8.005 Spins |
| Bonus-Jagd (1,5×) | 1 von 116 Spins | 1 von 872 Spins | 1 von 4.097 Spins |

## Gewinn-Animation bei Feature-Spins (v0.19)
Bei Jaguar-Spin und Jaguar-König startet die Big-Win-Animation ab 20× Grundeinsatz, auch wenn der Gewinn unter dem Preis des Feature-Spins liegt (Schalter `CELEBRATE_FEATURE_WINS` in `player.ts`). Hinweis: Manche Märkte verbieten das Feiern von Gewinnen unter dem Einsatz – dann den Schalter auf `false` setzen.
