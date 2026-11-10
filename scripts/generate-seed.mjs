import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const words = JSON.parse(
  fs.readFileSync(path.join(root, 'apps/game/src/data/words.json'), 'utf8'),
);

function esc(s) {
  return String(s).replaceAll("'", "''");
}

const wordValues = words
  .map((w) => {
    const zin = w.zin ? `'${esc(w.zin)}'` : 'null';
    return `  ('${esc(w.woord)}', '${esc(w.soort)}', ${zin}, true)`;
  })
  .join(',\n');

const theory = [
  {
    sort: 1,
    nr: '1',
    title: 'Zelfstandig naamwoord',
    abbr: 'zn',
    soort: 'zelfstandig',
    body: `<p>Benoemt personen, dieren, dingen, plaatsen, gevoelens of begrippen.</p>
        <p class="theory-ex">→ de hond, een stoel, Gent, liefde.</p>
        <p>Je kunt er meestal een lidwoord bij zetten (de, het, een).</p>`,
  },
  {
    sort: 2,
    nr: '2',
    title: 'Lidwoord',
    abbr: 'lw',
    soort: 'lidwoord',
    body: `<p>Hoort altijd bij een zelfstandig naamwoord.</p>
        <ul class="theory-bullets">
          <li><strong>Bepaald:</strong> de, het</li>
          <li><strong>Onbepaald:</strong> een</li>
          <li><strong>Ontkennend:</strong> geen</li>
        </ul>
        <p class="theory-tip">Let op: staat ‘het’ niet bij een zn, dan is het géén lidwoord
          <em>(Het wordt mooi weer)</em>.</p>`,
  },
  {
    sort: 3,
    nr: '3',
    title: 'Bijvoeglijk naamwoord',
    abbr: 'bn',
    soort: 'bijvoeglijk',
    body: `<p>Zegt iets meer over een zelfstandig naamwoord.</p>
        <p class="theory-ex">→ de grote hond, een mooi huis, het rode kleed.</p>
        <p>Je kunt vaak ‘heel’ of ‘erg’ ervoor zetten: heel groot, erg lief.</p>`,
  },
  {
    sort: 4,
    nr: '4',
    title: 'Voornaamwoord',
    abbr: 'vnw',
    soort: 'voornaamwoord',
    body: `<p>Vervangt of verwijst naar een zelfstandig naamwoord. Acht soorten:</p>
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
        </div>`,
  },
  {
    sort: 5,
    nr: '5',
    title: 'Bijwoord',
    abbr: 'bw',
    soort: 'bijwoord',
    body: `<p>Zegt iets over een werkwoord, bijvoeglijk naamwoord of ander bijwoord.</p>
        <p class="theory-ex">→ Hij loopt snel. – Dat is erg mooi. – We komen morgen.</p>
        <p>Antwoord op vragen als: waar, wanneer, waarom, hoe.</p>
        <p class="theory-ex">→ hier, daar, gisteren, daarom, vaak.</p>`,
  },
  {
    sort: 6,
    nr: '6',
    title: 'Telwoord',
    abbr: 'tw',
    soort: 'telwoord',
    body: `<p>Geeft een hoeveelheid of volgorde aan.</p>
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
        </div>`,
  },
  {
    sort: 7,
    nr: '7',
    title: 'Voegwoord',
    abbr: 'vw',
    soort: 'voegwoord',
    body: `<p>Verbindt woorden of zinnen.</p>
        <ul class="theory-bullets">
          <li><strong>Nevenschikkend:</strong> en, maar, want, of, dus</li>
          <li><strong>Onderschikkend:</strong> omdat, als, hoewel, terwijl, zodat …</li>
        </ul>
        <p class="theory-tip">Kun je de zinnen apart zetten → nevenschikkend; niet apart → onderschikkend.</p>`,
  },
  {
    sort: 8,
    nr: '8',
    title: 'Voorzetsel',
    abbr: 'vz',
    soort: 'voorzetsel',
    body: `<p>Geeft plaats, tijd, oorzaak, richting of middel aan.</p>
        <p class="theory-ex">→ op, onder, naast, achter, tijdens, dankzij.</p>
        <p class="theory-tip">Testzin: “De aap springt … de ton.”</p>`,
  },
  {
    sort: 9,
    nr: '9',
    title: 'Tussenwerpsel',
    abbr: 'twp',
    soort: 'tussenwerpsel',
    body: `<p>Drukt een gevoel of reactie uit.</p>
        <p class="theory-ex">→ Amai! Oei! Hé! Verdorie!</p>
        <p>Vaak kun je het weglaten zonder dat de zin fout is.</p>`,
  },
  {
    sort: 10,
    nr: '10',
    title: 'Werkwoord',
    abbr: 'ww',
    soort: 'werkwoord',
    body: `<p>Zegt wat iemand doet of overkomt.</p>
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
        <p class="theory-tip">Alle andere werkwoorden in de zin zijn hulpwerkwoorden.</p>`,
  },
];

const theoryValues = theory
  .map(
    (t) =>
      `  (${t.sort}, '${esc(t.nr)}', '${esc(t.title)}', '${esc(t.abbr)}', '${esc(t.soort)}', '${esc(t.body.trim())}', true)`,
  )
  .join(',\n');

const sql = `-- Seed: woorden + theorie (idempotent voor lege tabellen)
-- Voer uit NA schema.sql. Slaat over als words / theory_sections al rijen hebben.

do $$
begin
  if (select count(*) from public.words) = 0 then
    insert into public.words (woord, soort, zin, active) values
${wordValues};
  end if;

  if (select count(*) from public.theory_sections) = 0 then
    insert into public.theory_sections (sort_order, nr, title, abbr, in_game_soort, body_html, active) values
${theoryValues};
  end if;
end
$$;
`;

fs.writeFileSync(path.join(root, 'supabase/seed.sql'), sql);
console.log(`Wrote seed.sql (${words.length} words, ${theory.length} theory sections)`);
