/** Theorie woordsoorten — lesmateriaal bij Blokwoorden. */

import type { Woordsoort } from '../game/types';

export function theorieHtml(): string {
  return `
    <p class="menu-lead theory-intro">
      De tien woordsoorten komen allemaal in het spel voor.
      Bij een Taal-Check zie je een zin uit de oefenbundel met een gemarkeerd woord.
    </p>

    <div class="theory-list">
      ${card(
        '1',
        'Zelfstandig naamwoord',
        'zn',
        'zelfstandig',
        `
        <p>Benoemt personen, dieren, dingen, plaatsen, gevoelens of begrippen.</p>
        <p class="theory-ex">→ de hond, een stoel, Gent, liefde.</p>
        <p>Je kunt er meestal een lidwoord bij zetten (de, het, een).</p>
        `,
      )}

      ${card(
        '2',
        'Lidwoord',
        'lw',
        'lidwoord',
        `
        <p>Hoort altijd bij een zelfstandig naamwoord.</p>
        <ul class="theory-bullets">
          <li><strong>Bepaald:</strong> de, het</li>
          <li><strong>Onbepaald:</strong> een</li>
          <li><strong>Ontkennend:</strong> geen</li>
        </ul>
        <p class="theory-tip">Let op: staat ‘het’ niet bij een zn, dan is het géén lidwoord
          <em>(Het wordt mooi weer)</em>.</p>
        `,
      )}

      ${card(
        '3',
        'Bijvoeglijk naamwoord',
        'bn',
        'bijvoeglijk',
        `
        <p>Zegt iets meer over een zelfstandig naamwoord.</p>
        <p class="theory-ex">→ de grote hond, een mooi huis, het rode kleed.</p>
        <p>Je kunt vaak ‘heel’ of ‘erg’ ervoor zetten: heel groot, erg lief.</p>
        `,
      )}

      ${card(
        '4',
        'Voornaamwoord',
        'vnw',
        'voornaamwoord',
        `
        <p>Vervangt of verwijst naar een zelfstandig naamwoord. Acht soorten:</p>
        <div class="theory-table-wrap">
          <table class="theory-table">
            <thead>
              <tr><th>Soort</th><th>Functie</th><th>Voorbeelden</th></tr>
            </thead>
            <tbody>
              <tr><td>Persoonlijk</td><td>Verwijst naar personen/dingen zonder ze te noemen</td><td>ik, jij, hem, zij, wij</td></tr>
              <tr><td>Bezittelijk</td><td>Geeft aan van wie iets is</td><td>mijn, jouw, zijn, haar, hun</td></tr>
              <tr><td>Aanwijzend</td><td>Wijst iets of iemand aan</td><td>die, dat, deze, dit, zo’n</td></tr>
              <tr><td>Vragend</td><td>Stelt een vraag</td><td>wie, wat, welke, wat voor (een)</td></tr>
              <tr><td>Betrekkelijk</td><td>Verwijst terug naar een woord eerder in de zin</td><td>die, dat, wat, wie</td></tr>
              <tr><td>Wederkerend</td><td>Verwijst terug naar het onderwerp</td><td>me, je, zich, ons</td></tr>
              <tr><td>Wederkerig</td><td>Drukt wederzijdse actie uit</td><td>elkaar, mekaar</td></tr>
              <tr><td>Onbepaald</td><td>Verwijst vaag naar iets of iemand</td><td>iemand, iets, niets, alles, sommige</td></tr>
            </tbody>
          </table>
        </div>
        `,
      )}

      ${card(
        '5',
        'Bijwoord',
        'bw',
        'bijwoord',
        `
        <p>Zegt iets over een werkwoord, bijvoeglijk naamwoord of ander bijwoord.</p>
        <p class="theory-ex">→ Hij loopt snel. – Dat is erg mooi. – We komen morgen.</p>
        <p>Antwoord op vragen als: waar, wanneer, waarom, hoe.</p>
        <p class="theory-ex">→ hier, daar, gisteren, daarom, vaak.</p>
        `,
      )}

      ${card(
        '6',
        'Telwoord',
        'tw',
        'telwoord',
        `
        <p>Geeft een hoeveelheid of volgorde aan.</p>
        <div class="theory-table-wrap">
          <table class="theory-table">
            <thead>
              <tr><th>Type</th><th>Voorbeeld</th></tr>
            </thead>
            <tbody>
              <tr><td>Bepaald hoofdtelwoord</td><td>vijf, honderd</td></tr>
              <tr><td>Bepaald rangtelwoord</td><td>tweede, tiende</td></tr>
              <tr><td>Onbepaald hoofdtelwoord</td><td>veel, enkele</td></tr>
              <tr><td>Onbepaald rangtelwoord</td><td>zoveelste, middelste</td></tr>
            </tbody>
          </table>
        </div>
        `,
      )}

      ${card(
        '7',
        'Voegwoord',
        'vw',
        'voegwoord',
        `
        <p>Verbindt woorden of zinnen.</p>
        <ul class="theory-bullets">
          <li><strong>Nevenschikkend:</strong> en, maar, want, of, dus</li>
          <li><strong>Onderschikkend:</strong> omdat, als, hoewel, terwijl, zodat …</li>
        </ul>
        <p class="theory-tip">Kun je de zinnen apart zetten → nevenschikkend; niet apart → onderschikkend.</p>
        `,
      )}

      ${card(
        '8',
        'Voorzetsel',
        'vz',
        'voorzetsel',
        `
        <p>Geeft plaats, tijd, oorzaak, richting of middel aan.</p>
        <p class="theory-ex">→ op, onder, naast, achter, tijdens, dankzij.</p>
        <p class="theory-tip">Testzin: “De aap springt … de ton.”</p>
        `,
      )}

      ${card(
        '9',
        'Tussenwerpsel',
        'twp',
        'tussenwerpsel',
        `
        <p>Drukt een gevoel of reactie uit.</p>
        <p class="theory-ex">→ Amai! Oei! Hé! Verdorie!</p>
        <p>Vaak kun je het weglaten zonder dat de zin fout is.</p>
        `,
      )}

      ${card(
        '10',
        'Werkwoord',
        'ww',
        'werkwoord',
        `
        <p>Zegt wat iemand doet of overkomt.</p>
        <ul class="theory-bullets">
          <li><strong>Zelfstandig werkwoord (zww):</strong> heeft betekenis, kan alleen staan
            <em>(Hij loopt.)</em></li>
          <li><strong>Hulpwerkwoord (hww):</strong> helpt het hoofdwerkwoord
            <em>(Hij heeft gelopen.)</em></li>
          <li><strong>Koppelwerkwoord (kww):</strong> verbindt onderwerp en naamwoordelijk deel
            <em>(Hij is moe.)</em></li>
        </ul>
        <p class="theory-tip"><strong>ZWOBBELS(H):</strong> zijn – worden – blijven – blijken – lijken – schijnen – heten.</p>

        <h4 class="theory-subhead">Stappenplan: werkwoorden in een zin</h4>
        <ol class="theory-steps">
          <li>
            <strong>Wat zijn de werkwoorden in de zin?</strong>
            Zoek alle werkwoorden (pv, infinitieven, voltooid deelwoorden).
          </li>
          <li>
            <strong>Wat is het belangrijkste werkwoord?</strong>
            Dat is het werkwoord met de echte betekenis.
          </li>
          <li>
            <strong>Is het een ZWOBBELS-werkwoord?</strong>
            <ul class="theory-bullets">
              <li>Ja → koppelwerkwoord → naamwoordelijk gezegde</li>
              <li>Nee → zelfstandig werkwoord → werkwoordelijk gezegde</li>
            </ul>
          </li>
        </ol>
        <p class="theory-tip">Alle andere werkwoorden in de zin zijn hulpwerkwoorden.</p>
        `,
      )}
    </div>
  `;
}

function card(
  nr: string,
  title: string,
  abbr: string,
  inGame: Woordsoort | null,
  body: string,
): string {
  const badge = inGame
    ? `<span class="theory-badge in-game soort-${inGame}">In het spel</span>`
    : '';
  return `
    <article class="theory-card${inGame ? ` soort-${inGame}` : ''}">
      <header class="theory-card-head">
        <span class="theory-nr">${nr}</span>
        <div class="theory-card-titles">
          <h3>${title} <span class="theory-abbr">(${abbr})</span></h3>
          ${badge}
        </div>
      </header>
      <div class="theory-card-body">${body}</div>
    </article>
  `;
}
