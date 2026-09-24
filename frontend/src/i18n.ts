type Dict = Record<string, string>;

const en: Dict = {
  balance: 'Balance',
  bet: 'Bet',
  win: 'Win',
  spin: 'SPIN',
  spinJaguar: 'ROAR',
  skip: 'SKIP',
  turbo: 'Turbo',
  bonushunt: 'Bonus Hunt',
  bonushuntDesc: '2× free spin chance',
  jaguar: 'Jaguar Spin',
  jaguarDesc: 'golden steles every spin',
  buy: 'Buy Bonus',
  buyFrom: 'from {v}',
  buyTitle: 'Buy Bonus',
  buyName_bonus: 'Temple Bonus',
  buyName_superbonus: 'Super Bonus',
  buyName_godbonus: 'Gods Bonus',
  buyDesc: 'Free spins start on stage {n} · steles {v}',
  choose: 'Choose',
  buyNow: 'Buy for {v}',
  buyConfirm: 'Buy the free spins for {cost}?',
  yes: 'Buy',
  no: 'Cancel',
  freeSpins: 'FREE SPINS',
  freeSpin: 'Free spin {n} / {t}',
  stage: 'Stage {n}',
  stageUp: 'STAGE {n}',
  stageNames1: 'Jungle floor',
  stageNames2: 'Temple stairs',
  stageNames3: 'Sacrifice platform',
  stageNames4: 'Eclipse at the summit',
  startsHigher: 'Your bonus starts higher up the temple',
  extraSpins: '+{n} spins',
  newTotems: 'steles now {v}',
  runesToNext: '{n} more rune(s) to the next stage',
  pyrIdle: '3 sun glyphs open the temple',
  maxStage: 'Summit reached',
  lineWin: 'Line win',
  jaguarRoar: 'JAGUAR ROAR',
  goldenJaguar: 'GOLDEN JAGUAR',
  templeAwakes: 'The temple awakes',
  fsIntroSub: 'Collect runes to climb the pyramid',
  fsOver: 'Free spins complete',
  totalFs: 'Total win',
  maxWin: 'MAX WIN',
  winBig: 'BIG WIN',
  winJaguar: 'JAGUAR WIN',
  winEagle: 'EAGLE WIN',
  winSun: 'SUN WIN',
  winGod: 'GODS WIN',
  tapContinue: 'tap to continue',
  demo: 'Demo · play money',
  replay: 'Replay',
  insufficient: 'Your balance is too low for this bet. Lower the bet or choose a cheaper mode.',
  error: 'Connection problem ({code}). Please reload the game.',
  noSession: 'No game session. Please start the game via Stake.',
  resume: 'Resuming your unfinished round…',
  rules: 'Rules',
  close: 'Close',
  pyramid: 'Temple',
};

const de: Dict = {
  balance: 'Guthaben',
  bet: 'Einsatz',
  win: 'Gewinn',
  spin: 'DREHEN',
  spinJaguar: 'BRÜLLEN',
  skip: 'SKIP',
  turbo: 'Turbo',
  bonushunt: 'Bonus-Jagd',
  bonushuntDesc: '2× Freispiel-Chance',
  jaguar: 'Jaguar-Spin',
  jaguarDesc: 'goldene Stelen bei jedem Spin',
  buy: 'Bonus kaufen',
  buyFrom: 'ab {v}',
  buyTitle: 'Bonus kaufen',
  buyName_bonus: 'Tempel-Bonus',
  buyName_superbonus: 'Super-Bonus',
  buyName_godbonus: 'Götter-Bonus',
  buyDesc: 'Freispiele starten auf Stufe {n} · Stelen {v}',
  choose: 'Wählen',
  buyNow: 'Kaufen für {v}',
  buyConfirm: 'Freispiele für {cost} kaufen?',
  yes: 'Kaufen',
  no: 'Abbrechen',
  freeSpins: 'FREISPIELE',
  freeSpin: 'Freispiel {n} / {t}',
  stage: 'Stufe {n}',
  stageUp: 'STUFE {n}',
  stageNames1: 'Dschungelboden',
  stageNames2: 'Tempeltreppe',
  stageNames3: 'Opferplattform',
  stageNames4: 'Sonnenfinsternis am Gipfel',
  startsHigher: 'Dein Bonus startet weiter oben im Tempel',
  extraSpins: '+{n} Spins',
  newTotems: 'Stelen jetzt {v}',
  runesToNext: 'noch {n} Rune(n) bis zur nächsten Stufe',
  pyrIdle: '3 Sonnen-Glyphen öffnen den Tempel',
  maxStage: 'Gipfel erreicht',
  lineWin: 'Liniengewinn',
  jaguarRoar: 'JAGUAR-RUF',
  goldenJaguar: 'GOLDENER JAGUAR',
  templeAwakes: 'Der Tempel erwacht',
  fsIntroSub: 'Sammle Runen und steig die Pyramide hinauf',
  fsOver: 'Freispiele beendet',
  totalFs: 'Gesamtgewinn',
  maxWin: 'MAX-GEWINN',
  winBig: 'GROSSER GEWINN',
  winJaguar: 'JAGUAR-GEWINN',
  winEagle: 'ADLER-GEWINN',
  winSun: 'SONNEN-GEWINN',
  winGod: 'GÖTTER-GEWINN',
  tapContinue: 'tippen zum Fortfahren',
  demo: 'Demo · Spielgeld',
  replay: 'Wiederholung',
  insufficient: 'Dein Guthaben reicht für diesen Einsatz nicht. Senke den Einsatz oder wähle einen günstigeren Modus.',
  error: 'Verbindungsproblem ({code}). Bitte lade das Spiel neu.',
  noSession: 'Keine Spielsitzung. Bitte starte das Spiel über Stake.',
  resume: 'Deine unterbrochene Runde wird fortgesetzt…',
  rules: 'Regeln',
  close: 'Schließen',
  pyramid: 'Tempel',
};

// Stake US (social casino) must not use gambling wording.
const socialOverrides: Record<string, Dict> = {
  en: { bet: 'Play amount', buy: 'Get Bonus', buyTitle: 'Get Bonus', buyNow: 'Get for {v}', buyConfirm: 'Get the free spins for {cost}?', yes: 'Get' },
  de: { bet: 'Spielbetrag', buy: 'Bonus holen', buyTitle: 'Bonus holen', buyNow: 'Holen für {v}', buyConfirm: 'Freispiele für {cost} holen?', yes: 'Holen' },
};

let dict: Dict = en;

export function setLanguage(lang: string, social: boolean) {
  const base = lang === 'de' ? de : en;
  dict = { ...base, ...(social ? socialOverrides[lang === 'de' ? 'de' : 'en'] : {}) };
}

export function t(key: string, vars: Record<string, string | number> = {}): string {
  let s = dict[key] ?? en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

export function rulesHtml(lang: string): string {
  if (lang === 'de') {
    return `
<h3>Temple of Ascent</h3>
<p>5 Walzen × 4 Reihen, 20 feste Gewinnlinien, Gewinne von links nach rechts. Alle Gewinne in × Einsatz. RTP: <b>96,00 %</b> in allen Modi. Max. Gewinn: <b>10.000×</b> Einsatz.</p>
<h4>Götter-Stelen</h4>
<p>Jede Stele trägt einen Multiplikator (Basisspiel 2×–10×). Gibt es im Spin einen Liniengewinn, werden alle Stelen auf dem Feld <b>addiert</b> und multiplizieren den <b>Liniengewinn</b> dieses Spins, nicht den Einsatz. Beispiel: Liniengewinn 0,40 € und Stelen 5× + 10× = 15× ergibt 6,00 €. Ohne Liniengewinn zahlen die Stelen nichts.</p>
<h4>Jaguar-Ruf</h4>
<p>Nach dem Walzenstopp kann der Jaguar 1–3 zusätzliche Stelen (2×–25×) auf normale Felder werfen.</p>
<h4>Freispiele und Pyramide</h4>
<p>3 / 4 / 5 Sonnen-Glyphen geben 10 / 12 / 15 Freispiele auf Stufe 1. In den Freispielen gesammelte Glyphen füllen die Pyramide: alle 3 Glyphen steigt man eine Stufe auf (max. Stufe 4) und erhält +4 Freispiele. Stelen-Werte: Stufe 1: 2–25×, Stufe 2: 5–50×, Stufe 3: 10–250×, Stufe 4: 25–500×.</p>
<h4>Modi</h4>
<p><b>Bonus-Jagd (1,5× Einsatz):</b> doppelte Chance auf Freispiele.<br>
<b>Jaguar-Spin (25× Einsatz):</b> Der Jaguar wirft bei jedem Spin 2–4 goldene Stelen (5×–50×). Jeder Jaguar-Spin zahlt einen Gewinn, der kleiner als der Einsatz sein kann. Keine Freispiele.<br>
<b>Tempel-Bonus (100× Einsatz):</b> Freispiele starten auf Stufe 1.<br>
<b>Super-Bonus (200× Einsatz):</b> Freispiele starten auf Stufe 2.<br>
<b>Götter-Bonus (300× Einsatz):</b> Freispiele starten auf Stufe 3.</p>
<p>Fehlfunktionen machen alle Gewinne und Spiele ungültig.</p>`;
  }
  return `
<h3>Temple of Ascent</h3>
<p>5 reels × 4 rows, 20 fixed paylines, wins pay left to right. All wins in × bet. RTP: <b>96.00%</b> in all modes. Max win: <b>10,000×</b> bet.</p>
<h4>God Steles</h4>
<p>Every stele carries a multiplier (base game 2×–10×). If the spin has a line win, all steles on the board are <b>added</b> and multiply that spin's <b>line win</b>, not the bet. Example: a line win of $0.40 with steles 5× + 10× = 15× pays $6.00. Without a line win the steles pay nothing.</p>
<h4>Jaguar Roar</h4>
<p>After the reels stop, the jaguar may throw 1–3 extra steles (2×–25×) onto regular positions.</p>
<h4>Free Spins and Pyramid</h4>
<p>3 / 4 / 5 sun glyphs award 10 / 12 / 15 free spins at stage 1. Glyphs collected during free spins fill the pyramid: every 3 glyphs move you up one stage (max stage 4) and award +4 free spins. Stele values: stage 1: 2–25×, stage 2: 5–50×, stage 3: 10–250×, stage 4: 25–500×.</p>
<h4>Modes</h4>
<p><b>Bonus Hunt (1.5× bet):</b> double chance to trigger free spins.<br>
<b>Jaguar Spin (25× bet):</b> the jaguar throws 2–4 golden steles (5×–50×) every spin. Every Jaguar Spin pays a win, which may be less than its cost. No free spins.<br>
<b>Temple Bonus (100× bet):</b> free spins start on stage 1.<br>
<b>Super Bonus (200× bet):</b> free spins start on stage 2.<br>
<b>Gods Bonus (300× bet):</b> free spins start on stage 3.</p>
<p>Malfunction voids all pays and plays.</p>`;
}
