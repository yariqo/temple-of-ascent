/**
 * Game info / rules ("?" button). Structured in sections with a tab bar, pictures of every
 * symbol and stele, and worked examples. English + German.
 */
import { MODES, PAYTABLE } from './config';

/** 20 paylines (row index per reel, 0 = top) – must match math/temple_of_ascent/game_config.py */
export const PAYLINES: number[][] = [
  [0, 0, 0, 0, 0], [1, 1, 1, 1, 1], [2, 2, 2, 2, 2], [3, 3, 3, 3, 3],
  [0, 1, 2, 1, 0], [3, 2, 1, 2, 3], [1, 2, 3, 2, 1], [2, 1, 0, 1, 2],
  [0, 0, 1, 0, 0], [3, 3, 2, 3, 3], [1, 0, 0, 0, 1], [2, 3, 3, 3, 2],
  [0, 1, 1, 1, 0], [3, 2, 2, 2, 3], [1, 2, 2, 2, 1], [2, 1, 1, 1, 2],
  [0, 1, 0, 1, 0], [3, 2, 3, 2, 3], [1, 1, 0, 1, 1], [2, 2, 3, 2, 2],
];

function lineSvg(line: number[], n: number): string {
  const cells = line
    .map((row, reel) =>
      [0, 1, 2, 3].map((r) => `<rect x="${reel * 12 + 1}" y="${r * 12 + 1}" width="10" height="10" rx="2" class="${r === row ? 'on' : ''}"/>`).join(''),
    )
    .join('');
  const pts = line.map((row, reel) => `${reel * 12 + 6},${row * 12 + 6}`).join(' ');
  return `<figure class="pl"><svg viewBox="0 0 60 48">${cells}<polyline points="${pts}"/></svg><figcaption>${n}</figcaption></figure>`;
}

type Icon = (name: string) => string;

interface Ctx {
  icon: Icon;
  bet: number;
  money: (v: number) => string;
}

const T = {
  en: {
    tabs: ['Overview', 'Symbols', 'Steles', 'Bonus', 'Features', 'Lines', 'Controls'],
    overview: (c: Ctx) => `
      <p class="lead"><b>BALAM</b> – the temple of the jaguar. Land carved <b>steles</b> that multiply your line wins, collect <b>BONUS</b> symbols and climb the temple pyramid for bigger and bigger multipliers.</p>
      <div class="facts">
        <div><b>5 × 4</b><span>reels × rows</span></div>
        <div><b>20</b><span>fixed paylines</span></div>
        <div><b>96.00%</b><span>RTP in every mode</span></div>
        <div><b>10,000×</b><span>max win</span></div>
      </div>
      <p>Wins pay from left to right on adjacent reels, starting on reel 1. Only the highest win per payline is paid; wins on different lines are added. All values in the paytable are multiples of the bet (${c.money(c.bet)} at your current bet).</p>
      <p>If a round reaches the maximum win of <b>10,000× the bet</b>, it ends immediately and the max win is paid.</p>`,
    symbols: (c: Ctx) => `
      <p>Pays for 3, 4 or 5 matching symbols on a payline (× bet, in brackets at your current bet).</p>
      <div class="pt">${Object.entries(PAYTABLE)
        .map(
          ([s, p]) => `<div class="pt-row"><img src="${c.icon(s)}" alt="${s}"><div>${p
            .map((v, i) => `<span><i>${i + 3}×</i> ${v}× <small>(${c.money(v * c.bet)})</small></span>`)
            .join('')}</div></div>`,
        )
        .join('')}</div>
      <div class="sym-card"><img src="${c.icon('W')}" alt="Wild"><div><b>WILD</b> appears on reels 2–5 and substitutes for all regular symbols. It does not substitute for BONUS symbols or steles.</div></div>
      <div class="sym-card"><img src="${c.icon('S')}" alt="Bonus"><div><b>BONUS</b> symbols (scatter) trigger the free-spin bonus: 3, 4 or 5 anywhere on the reels. During free spins they are collected to climb the pyramid.</div></div>`,
    steles: (c: Ctx) => `
      <p><b>Steles</b> are carved pillars that carry a multiplier. When they land, their value rattles and stops. If the spin has <b>at least one line win</b>, the values of <b>all steles on the board are added</b> and multiply the <b>line win of that spin</b> (not the bet). Without a line win the steles pay nothing.</p>
      <div class="example"><b>Example:</b> line win ${c.money(0.4 * c.bet)} and steles 5× + 10× on the board → 15× → ${c.money(6 * c.bet)}.</div>
      <p>The material shows how strong a stele can be:</p>
      <div class="steles">
        <div><img src="${c.icon('T')}" alt=""><b>Stone</b><span>base game 2×–10×<br>stage 1: 2×–25×</span></div>
        <div><img src="${c.icon('TB')}" alt=""><b>Bronze</b><span>stage 2<br>5×–50×</span></div>
        <div><img src="${c.icon('TD')}" alt=""><b>Diamond</b><span>stage 3<br>10×–250×</span></div>
        <div><img src="${c.icon('TO')}" alt=""><b>Obsidian</b><span>stage 4<br>25×–500×</span></div>
        <div><img src="${c.icon('TG')}" alt=""><b>Gold</b><span>Jaguar Spin<br>5×–50×</span></div>
      </div>
      <h4>Jaguar Roar</h4>
      <p>In the base game the jaguar Balam sometimes roars after the reels stop and throws <b>1–3 extra stone steles</b> (2×–25×) onto regular positions of the board.</p>`,
    bonus: (c: Ctx) => `
      <p>The number of BONUS symbols decides which bonus you get. Every bonus starts with <b>10 free spins</b>.</p>
      <div class="bonus3">
        <div><div class="bx">${('<img src="' + c.icon('S') + '" alt="">').repeat(3)}</div><b>Temple Bonus</b><span>starts on stage 1 · stone steles 2×–25×</span></div>
        <div><div class="bx">${('<img src="' + c.icon('S') + '" alt="">').repeat(4)}</div><b>Super Bonus</b><span>starts on stage 2 · bronze steles 5×–50×</span></div>
        <div class="divine"><div class="bx">${('<img src="' + c.icon('S') + '" alt="">').repeat(5)}</div><b>Divine Bonus</b><span>starts on stage 3 · diamond steles 10×–250× · collected multipliers stay</span></div>
      </div>
      <h4>The temple pyramid</h4>
      <p>During free spins every BONUS symbol is collected. Every <b>3 collected symbols</b> move you one stage up the pyramid (maximum stage 4). Each stage-up awards <b>+4 free spins</b>, and from the next spin on the steles are made of a stronger material.</p>
      <table class="stages"><tr><th>Stage</th><th>Steles</th><th>Values</th></tr>
        <tr><td>1</td><td>Stone</td><td>2×–25×</td></tr>
        <tr><td>2</td><td>Bronze</td><td>5×–50×</td></tr>
        <tr><td>3</td><td>Diamond</td><td>10×–250×</td></tr>
        <tr><td>4</td><td>Obsidian</td><td>25×–500×</td></tr></table>
      <h4>Divine Bonus – the multiplier stays</h4>
      <p>Every stele that takes part in a win (the spin has a line win) is <b>collected</b> into the golden sun at the top left. Its value <b>stays until the end of the bonus</b> and is added to the steles of every later win.</p>
      <div class="example"><b>Example:</b> 40× collected. A new line win of ${c.money(0.5 * c.bet)} with a 10× stele → ${c.money(0.5 * c.bet)} × (40 + 10) = ${c.money(25 * c.bet)}. Afterwards 50× are collected.</div>`,
    features: (_c: Ctx) => `
      <p>Open the <b>BONUS</b> button to choose a feature spin or to buy a bonus. Every mode has an RTP of 96.00%.</p>
      <table class="modes"><tr><th>Option</th><th>Cost</th><th>What happens</th></tr>
        <tr><td><b>Bonus Hunt</b></td><td>${MODES.bonushunt.cost}× bet</td><td>Twice the chance to trigger a bonus on every spin. Stays active until you turn it off.</td></tr>
        <tr><td><b>Jaguar Spin</b></td><td>${MODES.jaguar.cost}× bet</td><td>The jaguar throws 2–4 golden steles (5×–50×) onto every spin. Every Jaguar Spin pays, but the win can be lower than its cost. No free spins in this mode.</td></tr>
        <tr><td><b>Temple Bonus</b></td><td>${MODES.bonus.cost}× bet</td><td>Same as 3 BONUS symbols.</td></tr>
        <tr><td><b>Super Bonus</b></td><td>${MODES.superbonus.cost}× bet</td><td>Same as 4 BONUS symbols.</td></tr>
        <tr><td><b>Divine Bonus</b></td><td>${MODES.godbonus.cost}× bet</td><td>Same as 5 BONUS symbols.</td></tr></table>
      <h4>Big wins</h4>
      <p>Wins of at least 20× the bet are celebrated. While the amount counts up, the title climbs: <b>BIG WIN</b> (20×) → <b>MEGA WIN</b> (50×) → <b>EPIC WIN</b> (100×) → <b>LEGENDARY WIN</b> (500×) → <b>BALAM WIN</b> (1,000×). In free spins every single spin can be a big win, and the bonus total is celebrated at the end.</p>`,
    lines: () => `<p>20 fixed paylines. Wins count from reel 1 (left) to the right.</p><div class="lines">${PAYLINES.map((l, i) => lineSvg(l, i + 1)).join('')}</div>`,
    controls: () => `
      <ul class="ctl">
        <li><b>SPIN</b> (or the space bar) starts a spin. Pressing it again during a spin skips the animations.</li>
        <li><b>− / +</b> change the bet.</li>
        <li><b>TURBO</b>: one lit bolt = turbo (faster), two lit bolts = super turbo (fastest). Press again to switch off.</li>
        <li><b>AUTO</b>: choose the number of spins and the speed. Press AUTO or SPIN to stop autoplay. Autoplay also stops when the balance is too low.</li>
        <li><b>BONUS</b>: feature spins and bonus buys.</li>
        <li>Top right: sound, music and this info.</li>
      </ul>
      <p class="legal">The theoretical return to player (RTP) is 96.00% in every mode. Malfunction voids all pays and plays. An unfinished round is resumed when the game is opened again.</p>`,
  },
  de: {
    tabs: ['Übersicht', 'Symbole', 'Stelen', 'Bonus', 'Features', 'Linien', 'Bedienung'],
    overview: (c: Ctx) => `
      <p class="lead"><b>BALAM</b> – der Tempel des Jaguars. Geschnitzte <b>Stelen</b> multiplizieren deine Liniengewinne, <b>BONUS</b>-Symbole öffnen den Tempel, und auf der Pyramide werden die Multiplikatoren immer größer.</p>
      <div class="facts">
        <div><b>5 × 4</b><span>Walzen × Reihen</span></div>
        <div><b>20</b><span>feste Gewinnlinien</span></div>
        <div><b>96,00 %</b><span>RTP in jedem Modus</span></div>
        <div><b>10.000×</b><span>Max. Gewinn</span></div>
      </div>
      <p>Gewinne zählen von links nach rechts auf benachbarten Walzen, beginnend bei Walze 1. Pro Linie wird nur der höchste Gewinn gezahlt; Gewinne auf verschiedenen Linien werden addiert. Alle Werte sind Vielfache des Einsatzes (${c.money(c.bet)} bei deinem aktuellen Einsatz).</p>
      <p>Erreicht eine Runde den Max-Gewinn von <b>10.000× Einsatz</b>, endet sie sofort und der Max-Gewinn wird ausgezahlt.</p>`,
    symbols: (c: Ctx) => `
      <p>Gewinne für 3, 4 oder 5 gleiche Symbole auf einer Linie (× Einsatz, in Klammern bei deinem Einsatz).</p>
      <div class="pt">${Object.entries(PAYTABLE)
        .map(
          ([s, p]) => `<div class="pt-row"><img src="${c.icon(s)}" alt="${s}"><div>${p
            .map((v, i) => `<span><i>${i + 3}×</i> ${v}× <small>(${c.money(v * c.bet)})</small></span>`)
            .join('')}</div></div>`,
        )
        .join('')}</div>
      <div class="sym-card"><img src="${c.icon('W')}" alt="Wild"><div><b>WILD</b> erscheint auf Walze 2–5 und ersetzt alle normalen Symbole, aber keine BONUS-Symbole und keine Stelen.</div></div>
      <div class="sym-card"><img src="${c.icon('S')}" alt="Bonus"><div><b>BONUS</b>-Symbole (Scatter) lösen den Freispiel-Bonus aus: 3, 4 oder 5 irgendwo auf den Walzen. In den Freispielen werden sie gesammelt und bringen dich die Pyramide hinauf.</div></div>`,
    steles: (c: Ctx) => `
      <p><b>Stelen</b> sind geschnitzte Säulen mit einem Multiplikator. Beim Landen rattert ihr Wert und bleibt stehen. Hat der Spin <b>mindestens einen Liniengewinn</b>, werden die Werte <b>aller Stelen auf dem Feld addiert</b> und multiplizieren den <b>Liniengewinn dieses Spins</b> (nicht den Einsatz). Ohne Liniengewinn zahlen die Stelen nichts.</p>
      <div class="example"><b>Beispiel:</b> Liniengewinn ${c.money(0.4 * c.bet)} und Stelen 5× + 10× auf dem Feld → 15× → ${c.money(6 * c.bet)}.</div>
      <p>Am Material erkennst du, wie stark eine Stele sein kann:</p>
      <div class="steles">
        <div><img src="${c.icon('T')}" alt=""><b>Stein</b><span>Basisspiel 2×–10×<br>Stufe 1: 2×–25×</span></div>
        <div><img src="${c.icon('TB')}" alt=""><b>Bronze</b><span>Stufe 2<br>5×–50×</span></div>
        <div><img src="${c.icon('TD')}" alt=""><b>Diamant</b><span>Stufe 3<br>10×–250×</span></div>
        <div><img src="${c.icon('TO')}" alt=""><b>Obsidian</b><span>Stufe 4<br>25×–500×</span></div>
        <div><img src="${c.icon('TG')}" alt=""><b>Gold</b><span>Jaguar-Spin<br>5×–50×</span></div>
      </div>
      <h4>Jaguar-Ruf</h4>
      <p>Im Basisspiel brüllt der Jaguar Balam manchmal nach dem Walzenstopp und wirft <b>1–3 zusätzliche Stein-Stelen</b> (2×–25×) auf normale Felder.</p>`,
    bonus: (c: Ctx) => `
      <p>Die Anzahl der BONUS-Symbole entscheidet über den Bonus. Jeder Bonus startet mit <b>10 Freispielen</b>.</p>
      <div class="bonus3">
        <div><div class="bx">${('<img src="' + c.icon('S') + '" alt="">').repeat(3)}</div><b>Tempel-Bonus</b><span>Start auf Stufe 1 · Stein-Stelen 2×–25×</span></div>
        <div><div class="bx">${('<img src="' + c.icon('S') + '" alt="">').repeat(4)}</div><b>Super-Bonus</b><span>Start auf Stufe 2 · Bronze-Stelen 5×–50×</span></div>
        <div class="divine"><div class="bx">${('<img src="' + c.icon('S') + '" alt="">').repeat(5)}</div><b>Göttlicher Bonus</b><span>Start auf Stufe 3 · Diamant-Stelen 10×–250× · gesammelte Multis bleiben</span></div>
      </div>
      <h4>Die Tempel-Pyramide</h4>
      <p>In den Freispielen wird jedes BONUS-Symbol gesammelt. Alle <b>3 gesammelten Symbole</b> steigst du eine Stufe auf (höchstens Stufe 4). Jeder Aufstieg bringt <b>+4 Freispiele</b>, und ab dem nächsten Spin sind die Stelen aus einem stärkeren Material.</p>
      <table class="stages"><tr><th>Stufe</th><th>Stelen</th><th>Werte</th></tr>
        <tr><td>1</td><td>Stein</td><td>2×–25×</td></tr>
        <tr><td>2</td><td>Bronze</td><td>5×–50×</td></tr>
        <tr><td>3</td><td>Diamant</td><td>10×–250×</td></tr>
        <tr><td>4</td><td>Obsidian</td><td>25×–500×</td></tr></table>
      <h4>Göttlicher Bonus – der Multi bleibt</h4>
      <p>Jede Stele, die an einem Gewinn beteiligt ist (der Spin hat einen Liniengewinn), wird in die goldene Sonne oben links <b>eingesammelt</b>. Ihr Wert <b>bleibt bis zum Ende des Bonus</b> und wird zu den Stelen jedes späteren Gewinns addiert.</p>
      <div class="example"><b>Beispiel:</b> 40× gesammelt. Neuer Liniengewinn ${c.money(0.5 * c.bet)} mit einer 10×-Stele → ${c.money(0.5 * c.bet)} × (40 + 10) = ${c.money(25 * c.bet)}. Danach sind 50× gesammelt.</div>`,
    features: (_c: Ctx) => `
      <p>Über den <b>BONUS</b>-Knopf wählst du Feature-Spins oder kaufst einen Bonus. Jeder Modus hat einen RTP von 96,00 %.</p>
      <table class="modes"><tr><th>Option</th><th>Kosten</th><th>Was passiert</th></tr>
        <tr><td><b>Bonus-Jagd</b></td><td>${MODES.bonushunt.cost}× Einsatz</td><td>Doppelte Chance auf einen Bonus bei jedem Spin. Bleibt aktiv, bis du sie ausschaltest.</td></tr>
        <tr><td><b>Jaguar-Spin</b></td><td>${MODES.jaguar.cost}× Einsatz</td><td>Der Jaguar wirft bei jedem Spin 2–4 goldene Stelen (5×–50×). Jeder Jaguar-Spin zahlt, der Gewinn kann aber kleiner als die Kosten sein. Keine Freispiele in diesem Modus.</td></tr>
        <tr><td><b>Tempel-Bonus</b></td><td>${MODES.bonus.cost}× Einsatz</td><td>Wie 3 BONUS-Symbole.</td></tr>
        <tr><td><b>Super-Bonus</b></td><td>${MODES.superbonus.cost}× Einsatz</td><td>Wie 4 BONUS-Symbole.</td></tr>
        <tr><td><b>Göttlicher Bonus</b></td><td>${MODES.godbonus.cost}× Einsatz</td><td>Wie 5 BONUS-Symbole.</td></tr></table>
      <h4>Große Gewinne</h4>
      <p>Gewinne ab 20× Einsatz werden gefeiert. Während der Betrag hochzählt, steigt der Titel: <b>BIG WIN</b> (20×) → <b>MEGA WIN</b> (50×) → <b>EPIC WIN</b> (100×) → <b>LEGENDARY WIN</b> (500×) → <b>BALAM WIN</b> (1.000×). In den Freispielen kann jeder einzelne Spin ein Big Win sein, am Ende wird der Bonus-Gesamtgewinn gefeiert.</p>`,
    lines: () => `<p>20 feste Gewinnlinien. Gewinne zählen ab Walze 1 (links) nach rechts.</p><div class="lines">${PAYLINES.map((l, i) => lineSvg(l, i + 1)).join('')}</div>`,
    controls: () => `
      <ul class="ctl">
        <li><b>SPIN</b> (oder Leertaste) startet einen Spin. Nochmal drücken während des Spins überspringt die Animationen.</li>
        <li><b>− / +</b> ändern den Einsatz.</li>
        <li><b>TURBO</b>: ein Blitz leuchtet = Turbo (schneller), zwei Blitze = Super-Turbo (am schnellsten). Nochmal drücken schaltet aus.</li>
        <li><b>AUTO</b>: Anzahl der Spins und Tempo wählen. AUTO oder SPIN stoppt Autoplay. Autoplay stoppt auch, wenn das Guthaben nicht reicht.</li>
        <li><b>BONUS</b>: Feature-Spins und Bonus-Käufe.</li>
        <li>Oben rechts: Sound, Musik und diese Info.</li>
      </ul>
      <p class="legal">Die theoretische Auszahlungsquote (RTP) beträgt in jedem Modus 96,00 %. Fehlfunktionen machen alle Gewinne und Spiele ungültig. Eine unterbrochene Runde wird beim nächsten Öffnen fortgesetzt.</p>`,
  },
};

export function rulesPage(lang: string, icon: Icon, bet: number, money: (v: number) => string): string {
  const L = lang === 'de' ? T.de : T.en;
  const c: Ctx = { icon, bet, money };
  const ids = ['overview', 'symbols', 'steles', 'bonus', 'features', 'lines', 'controls'] as const;
  const tabs = ids.map((id, i) => `<button class="rt-tab${i === 0 ? ' on' : ''}" data-go="rs-${id}">${L.tabs[i]}</button>`).join('');
  const body = ids.map((id, i) => `<section id="rs-${id}" class="rs"><h3>${L.tabs[i]}</h3>${(L[id] as (c: Ctx) => string)(c)}</section>`).join('');
  return `<div class="rt-tabs">${tabs}</div><div class="rt-body">${body}</div>`;
}
