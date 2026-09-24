# TEMPLE OF ASCENT – Spielkonzept (v0.4)

*Name: Temple of Ascent. Thema: Azteken-Dschungel (siehe THEMA.md).*

## Kurzbeschreibung
Ein 5×4-Slot mit 20 festen Gewinnlinien. Statt Glücksrädern gibt es **Totems**: geschnitzte Säulen, die sich beim Landen wie eine Walze drehen und auf einem **Multiplikator** stehen bleiben. Alle Totems auf dem Feld werden **addiert** und multiplizieren den Liniengewinn dieses Spins.
In den Freispielen sammelt man **Runen**. Alle 3 Runen steigt man eine **Stufe** auf (max. Stufe 4). Das bringt **+4 Freispiele**, und die Totems tragen **deutlich höhere Multis**.

## Eckdaten
| | |
|---|---|
| Raster | 5 Walzen × 4 Reihen, 20 Linien |
| RTP | **96,00 %** in allen 4 Spielmodi |
| Max. Gewinn | **10.000×** Einsatz |
| Trefferquote Basis | ca. 1 von 3,5 Spins |
| Freispiele im Basisspiel | 1 von 200 Spins (Bonus-Jagd: 1 von 100) |
| Volatilität | hoch |

## Spielmodi
| Modus | Kosten | Was passiert |
|---|---|---|
| **Normaler Spin** | 1× | Basisspiel. Jeder 25. Spin im Schnitt mit Jaguar-Ruf, Freispiele ca. 1 von 200 |
| **Bonus-Jagd** | 1,5× | **Doppelte Chance** auf Freispiele (1 von 100), sonst wie ein normaler Spin |
| **Jaguar-Spin** (Feature-Spin) | 25× | Der Jaguar brüllt **bei jedem Spin** und wirft **2–4 goldene Stelen** mit 5×–50× aufs Feld. **Jeder Jaguar-Spin bringt einen Gewinn**, oft aber weniger als die 25× Einsatz. Keine Freispiele in diesem Modus |
| **Bonus-Kauf** | 100× | Freispiele sofort |

Bonus-Jagd und Jaguar-Spin sind Schalter wie bei Hacksaw: einmal an, gelten sie für jeden Spin, bis man sie ausschaltet.

## Jaguar-Ruf (Basisspiel)
Nach dem Walzenstopp brüllt mit ca. 4 % Chance der Jaguar aus dem Dschungel und wirft **1–3 Stelen** auf zufällige normale Felder (keine Wilds oder Runen). Die Stelen tragen Werte von 2×–25× und zählen sofort mit. Im Jaguar-Spin passiert das immer, mit 2–4 **goldenen** Stelen (5×–50×) und garantiertem Gewinn.

## Statistik je Modus (100.000 Runden pro Modus, finale Gewichte)
| | Normal (1×) | Bonus-Jagd (1,5×) | Jaguar-Spin (25×) | Bonus-Kauf (100×) |
|---|---|---|---|---|
| RTP | 96,00 % | 96,00 % | 96,00 % | 96,00 % |
| Gewinn ≥ Einsatz | 13,4 % | 9,7 % | 27,8 % | 22,9 % |
| Median-Gewinn | 0 | 0 | 14× | 34× |
| Gewinn ≥ 1.000× | 1 von 33.000 | 1 von 14.000 | 1 von 16.800 | 1 von 116 |
| Max-Gewinn 10.000× | 1 von 10 Mio. | 1 von 2,2 Mio. | – | 1 von 65.000 |

**Gewichtung:** Die Books werden mit ihrer natürlichen Wahrscheinlichkeit gewichtet (`natural_weights.py`). Die sehr großen Gewinne werden leicht abgeschwächt, und die 96 % werden mit einer minimalen Korrektur exakt getroffen. Den Gauß-Optimierer des SDK nutzen wir nicht mehr, weil er die Gewinnverteilung stark verzerrt hat: Kleine Gewinne von 1–2× kamen dort praktisch nie vor.

**Stake-Prüfung:** Alle 4 Modi bestehen die Prüfungen des SDK ohne Warnung: Format, RTP höchstens 96,7 % und die Volatilitätsgrenzen (prob5k, prob10k, etl40b, etl10k, cvar). Die Bonus-Jagd wurde dafür von „5× Chance für 3×“ auf „2× Chance für 1,5×“ umgestellt. Mit 5× für 3× lässt sich die Grenze etl40b ≤ 0,9 nur einhalten, wenn die Boni in der Jagd deutlich schwächer wären als normale Boni.

## Symbole
| Code | Symbol (Vorschlag) | 3 / 4 / 5 gleiche |
|---|---|---|
| H1 | Jaguar-Maske | 1,5 / 6 / 30 |
| H2 | Adler | 1,2 / 5 / 20 |
| H3 | Schlange | 1,0 / 3 / 12 |
| H4 | Frosch-Idol | 0,8 / 2,5 / 10 |
| L1–L5 | Steinrunen/Edelsteine | 0,2–0,5 / 0,5–1,2 / 2–5 |
| W | Wild (Walze 2–5) | ersetzt alle normalen Symbole |
| S | **Geister-Rune** (Scatter) | 3/4/5 = 10/12/15 Freispiele |
| T | **Totem** (Multiplikator) | trägt einen Multi, alle Totems werden addiert |

Gewinne in × Gesamteinsatz, gezählt von links nach rechts.

## Totem-Multis pro Stufe
| Stufe | Mögliche Totem-Werte | Freischaltung |
|---|---|---|
| Basisspiel | 2×, 3×, 5×, 10× | – |
| Stufe 1 | 2×, 3×, 5×, 10×, 25× | Start der Freispiele |
| Stufe 2 | 5×, 10×, 15×, 25×, 50× | 3 Runen, +4 Spins |
| Stufe 3 | 10×, 20×, 25×, 50×, 100×, 250× | 6 Runen, +4 Spins |
| Stufe 4 | 25×, 50×, 100×, 250×, 500× | 9 Runen, +4 Spins |

Wie oft man welche Stufe erreicht (Rohdaten vor der Optimierung): Stufe 1 ≈ 31 %, Stufe 2 ≈ 34 %, Stufe 3 ≈ 20 %, Stufe 4 ≈ 15 %.

## Ablauf eines Spins
1. Die Walzen stoppen. Totems drehen sich und zeigen ihren Multi.
   Eventuell brüllt der Jaguar und wirft zusätzliche Stelen aufs Feld.
2. Die Linien werden ausgewertet.
3. Wenn es einen Gewinn gibt und Totems auf dem Feld sind, wird der Gewinn × (Summe aller Totems) gerechnet.
4. Basisspiel: Bei 3 oder mehr Runen starten die Freispiele.
5. Freispiele: Runen fliegen in die Stufen-Leiste. Bei 3/6/9 Runen folgt der Stufen-Aufstieg mit +4 Spins und neuen Totem-Werten ab dem nächsten Spin.

## Events für das Frontend
Standard-Events des SDK: `reveal`, `winInfo`, `setWin`, `setTotalWin`, `freeSpinTrigger`, `updateFreeSpin`, `freeSpinEnd`, `finalWin`, `wincap`.
Eigene Events:
- `totemMultiplier`: `totems[{reel,row,multiplier}]`, `totalMult`, `baseWin`, `totalWin`
- `stageInfo` (zu Beginn der Freispiele): `stage`, `runes`, `runesToNext`, `totemValues`
- `runeCollect`: `positions`, `runes`, `runesToNext`
- `stageUp`: `stage`, `extraSpins`, `totalFs`, `totemValues`
- `jaguarRoar` (direkt nach `reveal`): `golden` (true beim Jaguar-Spin), `totems[{reel,row,multiplier}]`. Diese Felder werden durch Stelen ersetzt

Im `reveal`-Board trägt jedes Totem seinen Wert als `multiplier`.

## Stand und nächste Schritte
- [x] Mathe-Modell im Stake Math SDK (Ordner `math/temple_of_ascent`)
- [x] 100.000 Runden pro Modus in allen 4 Modi, RTP exakt 96,00 %
- [x] Große Gewinne erreichbar gemacht und leicht nachjustiert (1.000×+ im Basisspiel: 1 von 33.000)
- [x] Alle 4 Modi bestehen die Stake-Prüfungen des SDK (Format, RTP ≤ 96,7 %, Volatilitätsgrenzen)
- [x] Thema: Azteken-Dschungel (siehe THEMA.md)
- [x] Name: Temple of Ascent
- [ ] Grafik
- [ ] Frontend mit dem Web SDK (Svelte + PixiJS)
- [x] Jaguar-Ruf, Bonus-Jagd (1,5×) und Jaguar-Spin (25×) eingebaut
- [ ] Optional: „Super Bonus“-Kauf, der auf Stufe 2 startet
- [ ] Upload und Test auf Stake Engine
