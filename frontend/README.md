# Temple of Ascent – Frontend (v0.2)

Statisches Web-Frontend (Vite + TypeScript + PixiJS 8) für Stake Engine.

## Ordner
```
frontend/
├─ dist/                ← Upload-Dateien für Stake Engine („Frontend files“), mit `npm run build` erzeugt
├─ index.html           Seitengerüst (UI-Leisten, Dialoge)
├─ src/
│  ├─ main.ts           Start, Steuerung, Runden-Ablauf (play → Animation → end-round)
│  ├─ rgs.ts            Stake-RGS-Client (/wallet/authenticate, /wallet/play, /wallet/end-round, Replay)
│  ├─ player.ts         spielt die Events einer Runde ab (reveal, jaguarRoar, winInfo, totemMultiplier, Freispiele, Runen, stageUp …)
│  ├─ board.ts          Walzen, Symbole, Stelen-Dreh-Animation, Jaguar-Augen, Gewinnlinien, Multiplikator-Strahlen (PixiJS)
│  ├─ art/              ALLE Grafiken werden per Code gezeichnet (Canvas2D → Textur): draw.ts Symbole, scene.ts Hintergründe pro Stufe, frame.ts Steinrahmen
│  ├─ fx/particles.ts   Partikel (Glühwürmchen, Glut, Funken, Staub, Münzen)
│  ├─ sound.ts          Soundeffekte + Trommel-Loop per Web Audio (keine Audiodateien), Stummschalter
│  ├─ fonts.ts          gebündelte Schriften (Cinzel, Cinzel Decorative, Alegreya Sans), kein externes CDN
│  ├─ ui.ts             Guthaben, Einsatz, Modi, Tempel-Pyramide, Bonus-Kauf-Menü, Freispiel-/Stufen-/Big-Win-Screens, Szenenwechsel
│  ├─ config.ts         Symbole, Modi, Stelen-Werte, Paytable (muss zur Mathe passen)
│  ├─ i18n.ts           Texte Deutsch/Englisch, Social-Casino-Wortwahl, Spielregeln
│  └─ demo/             Demo-RGS mit echten Beispielrunden (nur ohne rgs_url, nicht im Stake-Build)
└─ scripts/             Demo-Daten erzeugen, Demo-Seite bauen
```

## Befehle
```
npm install
npm run dev          # lokal im Browser, Demo-Modus mit Spielgeld
npm run build        # dist/ für Stake Engine
npm run build:demo   # dist-demo/index.html – eine einzelne Datei zum Ausprobieren
npm run demo-data    # Demo-Runden neu aus math/temple_of_ascent/library/publish_files ziehen (braucht python + zstandard)
```

## Verhalten bei Stake
- Die Stake-URL liefert `sessionID`, `rgs_url`, `lang`, `device`. Ohne `rgs_url` zeigt der Stake-Build einen Hinweis, im Dev- und Demo-Build startet der Demo-Modus.
- Einsatz = Basiseinsatz. Der Modus wird groß geschrieben gesendet (`BASE`, `BONUSHUNT`, `JAGUAR`, `BONUS`, `SUPERBONUS`, `GODBONUS`), Kosten = Basiseinsatz × Modus-Kosten.
- Gewinne ohne Freispiele werden sofort mit end-round abgeschlossen, Bonusrunden nach der Animation (wie im Stake web-sdk).
- Unterbrochene aktive Runden werden nach dem Laden fortgesetzt.
- Replay-Links (`replay=true&game=…&version=…&mode=…&event=…`) werden abgespielt.
- Jurisdiktions-Flags: socialCasino (andere Wortwahl), disabledTurbo, disabledSlamstop, disabledSpacebar, disabledBuyFeature, minimumRoundDuration.
- Große Gewinnbanner nur, wenn der Gewinn mindestens die Kosten der Runde erreicht.

## Getestet
- Demo und Stake-Build im Browser (Desktop, Handy hoch, Handy quer), 40 Chaos-Runden mit Skip, Turbo und Größenwechsel: keine JS-Fehler.
- Stake-Build gegen einen nachgebauten RGS (authenticate / play / end-round): Guthaben im Spiel = Guthaben auf dem Server.

## Offen
- Autoplay (mit Jurisdiktions-Regeln)
- Test in der echten Stake-Engine-Testumgebung
- Optional: professionelle Illustrationen / Sounds statt Code-Grafik
