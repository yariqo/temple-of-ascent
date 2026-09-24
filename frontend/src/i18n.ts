type Dict = Record<string, string>;

const en: Dict = {
  title: 'TEMPLE OF ASCENT',
  balance: 'Balance',
  bet: 'Bet',
  win: 'Win',
  spin: 'SPIN',
  skip: 'SKIP',
  turbo: 'Turbo',
  bonushunt: 'Bonus Hunt',
  bonushuntDesc: '2× free spin chance',
  jaguar: 'Jaguar Spin',
  jaguarDesc: 'golden steles every spin',
  buy: 'Buy Bonus',
  buyConfirm: 'Buy the free spins for {cost}?',
  yes: 'Buy',
  no: 'Cancel',
  freeSpins: 'FREE SPINS',
  freeSpin: 'Free spin {n} / {t}',
  stage: 'Stage {n}',
  stageUp: 'STAGE {n}!',
  extraSpins: '+{n} SPINS',
  newTotems: 'Steles now {v}',
  runes: 'Runes {r}',
  runesToNext: '{n} more rune(s) to the next stage',
  maxStage: 'Summit reached',
  jaguarRoar: 'JAGUAR ROAR!',
  goldenJaguar: 'GOLDEN JAGUAR!',
  totalFs: 'FREE SPINS WIN',
  maxWin: 'MAX WIN',
  winBig: 'BIG WIN',
  winJaguar: 'JAGUAR WIN',
  winEagle: 'EAGLE WIN',
  winSun: 'SUN WIN',
  winGod: 'GODS WIN',
  demo: 'DEMO – play money',
  replay: 'REPLAY',
  insufficient: 'Balance too low for this bet.',
  error: 'Connection problem ({code}). Please reload the game.',
  noSession: 'No game session. Please start the game via Stake.',
  resume: 'Resuming your unfinished round…',
  rules: 'Rules',
  close: 'Close',
  pyramid: 'Temple',
};

const de: Dict = {
  title: 'TEMPLE OF ASCENT',
  balance: 'Guthaben',
  bet: 'Einsatz',
  win: 'Gewinn',
  spin: 'DREHEN',
  skip: 'SKIP',
  turbo: 'Turbo',
  bonushunt: 'Bonus-Jagd',
  bonushuntDesc: '2× Freispiel-Chance',
  jaguar: 'Jaguar-Spin',
  jaguarDesc: 'goldene Stelen bei jedem Spin',
  buy: 'Bonus kaufen',
  buyConfirm: 'Freispiele für {cost} kaufen?',
  yes: 'Kaufen',
  no: 'Abbrechen',
  freeSpins: 'FREISPIELE',
  freeSpin: 'Freispiel {n} / {t}',
  stage: 'Stufe {n}',
  stageUp: 'STUFE {n}!',
  extraSpins: '+{n} SPINS',
  newTotems: 'Stelen jetzt {v}',
  runes: 'Runen {r}',
  runesToNext: 'noch {n} Rune(n) bis zur nächsten Stufe',
  maxStage: 'Gipfel erreicht',
  jaguarRoar: 'JAGUAR-RUF!',
  goldenJaguar: 'GOLDENER JAGUAR!',
  totalFs: 'FREISPIEL-GEWINN',
  maxWin: 'MAX-GEWINN',
  winBig: 'GROSSER GEWINN',
  winJaguar: 'JAGUAR-GEWINN',
  winEagle: 'ADLER-GEWINN',
  winSun: 'SONNEN-GEWINN',
  winGod: 'GÖTTER-GEWINN',
  demo: 'DEMO – Spielgeld',
  replay: 'WIEDERHOLUNG',
  insufficient: 'Guthaben reicht für diesen Einsatz nicht.',
  error: 'Verbindungsproblem ({code}). Bitte Spiel neu laden.',
  noSession: 'Keine Spielsitzung. Bitte das Spiel über Stake starten.',
  resume: 'Deine unterbrochene Runde wird fortgesetzt…',
  rules: 'Regeln',
  close: 'Schließen',
  pyramid: 'Tempel',
};

// Stake US (social casino) must not use gambling wording.
const socialOverrides: Record<string, Dict> = {
  en: { bet: 'Play amount', buy: 'Get Bonus', buyConfirm: 'Get the free spins for {cost}?', yes: 'Get' },
  de: { bet: 'Spielbetrag', buy: 'Bonus holen', buyConfirm: 'Freispiele für {cost} holen?', yes: 'Holen' },
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
<p>Jede Stele trägt einen Multiplikator. Gibt es im Spin einen Liniengewinn, werden alle Stelen auf dem Feld <b>addiert</b> und multiplizieren den Gewinn dieses Spins.</p>
<h4>Jaguar-Ruf</h4>
<p>Nach dem Walzenstopp kann der Jaguar 1–3 zusätzliche Stelen (2×–25×) auf normale Felder werfen.</p>
<h4>Freispiele & Pyramide</h4>
<p>3 / 4 / 5 Sonnen-Glyphen geben 10 / 12 / 15 Freispiele auf Stufe 1. In den Freispielen gesammelte Glyphen füllen die Pyramide: alle 3 Glyphen steigt man eine Stufe auf (max. Stufe 4) und erhält +4 Freispiele. Stelen-Werte: Stufe 1: 2–25×, Stufe 2: 5–50×, Stufe 3: 10–250×, Stufe 4: 25–500×.</p>
<h4>Modi</h4>
<p><b>Bonus-Jagd (1,5× Einsatz):</b> doppelte Chance auf Freispiele.<br><b>Jaguar-Spin (25× Einsatz):</b> der Jaguar wirft bei jedem Spin 2–4 goldene Stelen (5×–50×), jeder Jaguar-Spin zahlt einen Gewinn (kann kleiner als der Einsatz sein), keine Freispiele.<br><b>Bonus kaufen (100× Einsatz):</b> startet die Freispiele sofort.</p>
<p>Fehlfunktionen machen alle Gewinne und Spiele ungültig.</p>`;
  }
  return `
<h3>Temple of Ascent</h3>
<p>5 reels × 4 rows, 20 fixed paylines, wins pay left to right. All wins in × bet. RTP: <b>96.00%</b> in all modes. Max win: <b>10,000×</b> bet.</p>
<h4>God Steles</h4>
<p>Every stele carries a multiplier. If the spin has a line win, all steles on the board are <b>added</b> and multiply that spin's win.</p>
<h4>Jaguar Roar</h4>
<p>After the reels stop, the jaguar may throw 1–3 extra steles (2×–25×) onto regular positions.</p>
<h4>Free Spins & Pyramid</h4>
<p>3 / 4 / 5 sun glyphs award 10 / 12 / 15 free spins at stage 1. Glyphs collected during free spins fill the pyramid: every 3 glyphs move you up one stage (max stage 4) and award +4 free spins. Stele values: stage 1: 2–25×, stage 2: 5–50×, stage 3: 10–250×, stage 4: 25–500×.</p>
<h4>Modes</h4>
<p><b>Bonus Hunt (1.5× bet):</b> double chance to trigger free spins.<br><b>Jaguar Spin (25× bet):</b> the jaguar throws 2–4 golden steles (5×–50×) every spin, every Jaguar Spin pays a win (may be less than its cost), no free spins.<br><b>Buy Bonus (100× bet):</b> starts the free spins immediately.</p>
<p>Malfunction voids all pays and plays.</p>`;
}
