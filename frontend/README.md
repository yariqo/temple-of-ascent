# Temple of Ascent – Frontend (v0.1, Platzhalter-Grafik)

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
│  ├─ board.ts          Walzen und Symbole (PixiJS). Platzhalter-Kacheln, die später durch echte Grafik ersetzt werden
│  ├─ ui.ts             Guthaben, Einsatz, Modi, Tempel-Pyramide, Banner
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
- Einsatz = Basiseinsatz. Der Modus wird groß geschrieben gesendet (`BASE`, `BONUSHUNT`, `JAGUAR`, `BONUS`), Kosten = Basiseinsatz × Modus-Kosten.
- Gewinne ohne Freispiele werden sofort mit end-round abgeschlossen, Bonusrunden nach der Animation (wie im Stake web-sdk).
- Unterbrochene aktive Runden werden nach dem Laden fortgesetzt.
- Replay-Links (`replay=true&game=…&version=…&mode=…&event=…`) werden abgespielt.
- Jurisdiktions-Flags: socialCasino (andere Wortwahl), disabledTurbo, disabledSlamstop, disabledSpacebar, disabledBuyFeature, minimumRoundDuration.
- Große Gewinnbanner nur, wenn der Gewinn mindestens die Kosten der Runde erreicht.

## Offen
- Echte Grafik, Animationen und Sound (siehe THEMA.md)
- Autoplay (mit Jurisdiktions-Regeln)
- Mit der Stake-Engine-Testumgebung prüfen
