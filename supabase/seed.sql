-- Seed: woorden + theorie (idempotent voor lege tabellen)
-- Voer uit NA schema.sql. Slaat over als words / theory_sections al rijen hebben.

do $$
begin
  if (select count(*) from public.words) = 0 then
    insert into public.words (woord, soort, zin, active) values
  ('kast', 'zelfstandig', 'De oude kast stond jarenlang op zolder.', true),
  ('zolder', 'zelfstandig', 'De oude kast stond jarenlang op zolder.', true),
  ('nieuws', 'zelfstandig', 'Het onverwachte nieuws maakte iedereen stil.', true),
  ('wandeling', 'zelfstandig', 'Tijdens een lange wandeling bereikten we eindelijk Brugge.', true),
  ('Brugge', 'zelfstandig', 'Tijdens een lange wandeling bereikten we eindelijk Brugge.', true),
  ('enthousiasme', 'zelfstandig', 'Haar enthousiasme werkte aanstekelijk.', true),
  ('schrijver', 'zelfstandig', 'De Nederlandse schrijver won een belangrijke prijs.', true),
  ('prijs', 'zelfstandig', 'De Nederlandse schrijver won een belangrijke prijs.', true),
  ('leerling', 'zelfstandig', 'Geen leerling kende het volledige antwoord.', true),
  ('antwoord', 'zelfstandig', 'Geen leerling kende het volledige antwoord.', true),
  ('verhaal', 'zelfstandig', 'Het onbekende verhaal maakt hem bang.', true),
  ('soldaat', 'zelfstandig', 'De gewonde soldaat werd naar het ziekenhuis gebracht.', true),
  ('ziekenhuis', 'zelfstandig', 'De gewonde soldaat werd naar het ziekenhuis gebracht.', true),
  ('hond', 'zelfstandig', 'De hond blaft luid in de tuin.', true),
  ('tuin', 'zelfstandig', 'De hond blaft luid in de tuin.', true),
  ('tekst', 'zelfstandig', 'Wij hebben de tekst gisteren gelezen.', true),
  ('project', 'zelfstandig', 'Jullie zullen morgen samen werken aan het project.', true),
  ('kinderen', 'zelfstandig', 'De kinderen worden stil wanneer de leraar de klas binnengaat.', true),
  ('leraar', 'zelfstandig', 'De kinderen worden stil wanneer de leraar de klas binnengaat.', true),
  ('ochtend', 'zelfstandig', 'Ik ben altijd vrolijk in de ochtend.', true),
  ('koor', 'zelfstandig', 'Ze kunnen goed zingen in het koor.', true),
  ('bloemen', 'zelfstandig', 'De bloemen zijn prachtig rood in de zon.', true),
  ('stad', 'zelfstandig', 'Wij zijn gisteren naar de stad gegaan.', true),
  ('film', 'zelfstandig', 'Wij hebben de nieuwe film al gezien.', true),
  ('cadeau', 'zelfstandig', 'Ik ben blij met mijn cadeau.', true),
  ('kamers', 'zelfstandig', 'Zij zijn de kamers snel aan het poetsen.', true),
  ('straat', 'zelfstandig', 'De straat werd donker toen de lantaarns niet meer brandden.', true),
  ('taart', 'zelfstandig', 'De taart is lekker, omdat ze vers is gebakken.', true),
  ('huis', 'zelfstandig', 'Het huis wordt groter naarmate er meer kamers bij worden gebouwd.', true),
  ('oplossing', 'zelfstandig', 'De jongen zag geen oplossing voor het probleem.', true),
  ('probleem', 'zelfstandig', 'De jongen zag geen oplossing voor het probleem.', true),
  ('klas', 'zelfstandig', 'Hij vertelde zijn verhaal aan de klas.', true),
  ('vrouw', 'zelfstandig', 'Die vrouw woont in een huis dat honderd jaar oud is.', true),
  ('bal', 'zelfstandig', 'Dat kind speelt met de bal, maar het is geen nieuwe bal.', true),
  ('kind', 'zelfstandig', 'Dat kind speelt met de bal, maar het is geen nieuwe bal.', true),
  ('dorpje', 'zelfstandig', 'In het rustige dorpje aan de rivier woonde een oude man.', true),
  ('rivier', 'zelfstandig', 'In het rustige dorpje aan de rivier woonde een oude man.', true),
  ('man', 'zelfstandig', 'In het rustige dorpje aan de rivier woonde een oude man.', true),
  ('kat', 'zelfstandig', 'Hij had een trouwe metgezel, de zwarte kat Luna.', true),
  ('paden', 'zelfstandig', 'Elke ochtend maakte Anton een wandeling langs de kronkelende paden.', true),
  ('natuur', 'zelfstandig', 'Samen genoten ze van de rust en de schoonheid van de natuur.', true),
  ('huiswerk', 'zelfstandig', 'De broers hielpen elkaar met het huiswerk.', true),
  ('Ardennen', 'zelfstandig', 'De maxima schommelen tussen 4 graden in de hoge Ardennen en 9 graden in Vlaanderen.', true),
  ('park', 'zelfstandig', 'De man was aan het joggen in een park in de buurt van het meer.', true),
  ('politie', 'zelfstandig', 'Volgens de politie waren de drie dieren uit een nabijgelegen huis ontsnapt.', true),
  ('school', 'zelfstandig', '85 procent van de kleuters is voldoende taalvaardig om straks te starten in de lagere school.', true),
  ('Nederlands', 'zelfstandig', 'Voor 4 procent van de kleuters is intensieve begeleiding voor Nederlands nodig.', true),
  ('de', 'lidwoord', 'De oude kast stond jarenlang op zolder.', true),
  ('het', 'lidwoord', 'Het onverwachte nieuws maakte iedereen stil.', true),
  ('een', 'lidwoord', 'Tijdens een lange wandeling bereikten we eindelijk Brugge.', true),
  ('geen', 'lidwoord', 'Geen leerling kende het volledige antwoord.', true),
  ('oude', 'bijvoeglijk', 'De oude kast stond jarenlang op zolder.', true),
  ('onverwachte', 'bijvoeglijk', 'Het onverwachte nieuws maakte iedereen stil.', true),
  ('stil', 'bijvoeglijk', 'Het onverwachte nieuws maakte iedereen stil.', true),
  ('lange', 'bijvoeglijk', 'Tijdens een lange wandeling bereikten we eindelijk Brugge.', true),
  ('Nederlandse', 'bijvoeglijk', 'De Nederlandse schrijver won een belangrijke prijs.', true),
  ('belangrijke', 'bijvoeglijk', 'De Nederlandse schrijver won een belangrijke prijs.', true),
  ('volledige', 'bijvoeglijk', 'Geen leerling kende het volledige antwoord.', true),
  ('onbekende', 'bijvoeglijk', 'Het onbekende verhaal maakt hem bang.', true),
  ('bang', 'bijvoeglijk', 'Het onbekende verhaal maakt hem bang.', true),
  ('gewonde', 'bijvoeglijk', 'De gewonde soldaat werd naar het ziekenhuis gebracht.', true),
  ('snelle', 'bijvoeglijk', 'De snelle leerling liep snel naar buiten.', true),
  ('duidelijk', 'bijvoeglijk', 'Ze gaf een duidelijk antwoord.', true),
  ('vroege', 'bijvoeglijk', 'De vroege trein vertrekt erg vroeg.', true),
  ('moeilijke', 'bijvoeglijk', 'Het is een moeilijke oefening, maar ze werkt snel.', true),
  ('nieuwe', 'bijvoeglijk', 'Dat kind speelt met de bal, maar het is geen nieuwe bal.', true),
  ('rustige', 'bijvoeglijk', 'In het rustige dorpje aan de rivier woonde een oude man.', true),
  ('trouwe', 'bijvoeglijk', 'Hij had een trouwe metgezel, de zwarte kat Luna.', true),
  ('zwarte', 'bijvoeglijk', 'Hij had een trouwe metgezel, de zwarte kat Luna.', true),
  ('kronkelende', 'bijvoeglijk', 'Elke ochtend maakte Anton een wandeling langs de kronkelende paden.', true),
  ('nieuwsgierige', 'bijvoeglijk', 'Luna volgde hem met nieuwsgierige ogen.', true),
  ('andere', 'bijvoeglijk', 'Soms ontmoetten ze andere dorpelingen tijdens hun tochten.', true),
  ('zwaarbewolkt', 'bijvoeglijk', 'Vandaag wordt het zwaarbewolkt, met buien die van west naar oost trekken.', true),
  ('hoge', 'bijvoeglijk', 'De maxima schommelen tussen 4 graden in de hoge Ardennen.', true),
  ('nabijgelegen', 'bijvoeglijk', 'Volgens de politie waren de drie dieren uit een nabijgelegen huis ontsnapt.', true),
  ('Italiaanse', 'bijvoeglijk', 'Manziana is een stadje ten noordoosten van de Italiaanse hoofdstad Rome.', true),
  ('prachtig', 'bijvoeglijk', 'De bloemen zijn prachtig rood in de zon.', true),
  ('lekker', 'bijvoeglijk', 'De taart is lekker, omdat ze vers is gebakken.', true),
  ('vrolijk', 'bijvoeglijk', 'Ik ben altijd vrolijk in de ochtend.', true),
  ('ziek', 'bijvoeglijk', 'Hij lijkt erg ziek vandaag.', true),
  ('moe', 'bijvoeglijk', 'Zij zijn moe na de lange wandeling.', true),
  ('blaft', 'werkwoord', 'De hond blaft luid in de tuin.', true),
  ('zijn', 'werkwoord', 'Zij zijn moe na de lange wandeling.', true),
  ('hebben', 'werkwoord', 'Wij hebben de tekst gisteren gelezen.', true),
  ('gelezen', 'werkwoord', 'Wij hebben de tekst gisteren gelezen.', true),
  ('lijkt', 'werkwoord', 'Hij lijkt erg ziek vandaag.', true),
  ('zullen', 'werkwoord', 'Jullie zullen morgen samen werken aan het project.', true),
  ('werken', 'werkwoord', 'Jullie zullen morgen samen werken aan het project.', true),
  ('worden', 'werkwoord', 'De kinderen worden stil wanneer de leraar de klas binnengaat.', true),
  ('ben', 'werkwoord', 'Ik ben altijd vrolijk in de ochtend.', true),
  ('kunnen', 'werkwoord', 'Ze kunnen goed zingen in het koor.', true),
  ('zingen', 'werkwoord', 'Ze kunnen goed zingen in het koor.', true),
  ('gegaan', 'werkwoord', 'Wij zijn gisteren naar de stad gegaan.', true),
  ('heeft', 'werkwoord', 'Hij heeft geen geld bij zich.', true),
  ('gezien', 'werkwoord', 'Wij hebben de nieuwe film al gezien.', true),
  ('wordt', 'werkwoord', 'Jij wordt leraar later, dat weet ik zeker.', true),
  ('poetsen', 'werkwoord', 'Zij zijn de kamers snel aan het poetsen.', true),
  ('brandden', 'werkwoord', 'De straat werd donker toen de lantaarns niet meer brandden.', true),
  ('gebakken', 'werkwoord', 'De taart is lekker, omdat ze vers is gebakken.', true),
  ('gemist', 'werkwoord', 'Je hebt groot gelijk, maar je hebt je afspraak helaas gemist.', true),
  ('gebouwd', 'werkwoord', 'Het huis wordt groter naarmate er meer kamers bij worden gebouwd.', true),
  ('gebleven', 'werkwoord', 'Zij zijn vrienden gebleven, ook al zijn ze naar verschillende scholen gegaan.', true),
  ('speelt', 'werkwoord', 'Dat kind speelt met de bal, maar het is geen nieuwe bal.', true),
  ('woonde', 'werkwoord', 'In het rustige dorpje aan de rivier woonde een oude man.', true),
  ('bleef', 'werkwoord', 'De zwarte kat Luna bleef altijd aan zijn zijde.', true),
  ('maakte', 'werkwoord', 'Elke ochtend maakte Anton een wandeling langs de kronkelende paden.', true),
  ('volgde', 'werkwoord', 'Luna volgde hem met nieuwsgierige ogen.', true),
  ('genoten', 'werkwoord', 'Samen genoten ze van de rust en de schoonheid van de natuur.', true),
  ('hielpen', 'werkwoord', 'De broers hielpen elkaar met het huiswerk.', true),
  ('trekken', 'werkwoord', 'Vandaag wordt het zwaarbewolkt, met buien die van west naar oost over het land trekken.', true),
  ('joggen', 'werkwoord', 'De man was aan het joggen in een park in de buurt van het meer.', true),
  ('ontsnapt', 'werkwoord', 'Volgens de politie waren de drie dieren uit een nabijgelegen huis ontsnapt.', true),
  ('starten', 'werkwoord', '85 procent van de kleuters is voldoende taalvaardig om straks te starten in de lagere school.', true),
  ('blijkt', 'werkwoord', 'Dat blijkt uit de resultaten van de Taalscreening.', true),
  ('zij', 'voornaamwoord', 'Zij vertelde niemand wat er gebeurd was.', true),
  ('jouw', 'voornaamwoord', 'Is dit jouw jas?', true),
  ('die', 'voornaamwoord', 'Die leerlingen vertrekken morgen.', true),
  ('wie', 'voornaamwoord', 'Wie heeft dat gezegd?', true),
  ('mijn', 'voornaamwoord', 'Is dit mijn jas?', true),
  ('haar', 'voornaamwoord', 'Haar enthousiasme werkte aanstekelijk.', true),
  ('zich', 'voornaamwoord', 'Hij schaamt zich voor zijn reactie.', true),
  ('elkaar', 'voornaamwoord', 'De twee vrienden helpen elkaar altijd.', true),
  ('iedereen', 'voornaamwoord', 'Iedereen mag deelnemen.', true),
  ('welke', 'voornaamwoord', 'Welke boeken heb je gelezen?', true),
  ('niets', 'voornaamwoord', 'Ik heb niets gehoord.', true),
  ('wat', 'voornaamwoord', 'Wat bedoel je?', true),
  ('dat', 'voornaamwoord', 'Dat verhaal ken ik.', true),
  ('hij', 'voornaamwoord', 'Hij vertelde zijn verhaal aan de klas.', true),
  ('wij', 'voornaamwoord', 'Wij wassen ons elke ochtend snel.', true),
  ('ons', 'voornaamwoord', 'Wij wassen ons elke ochtend snel.', true),
  ('hen', 'voornaamwoord', 'Anton begroette hen hartelijk.', true),
  ('dit', 'voornaamwoord', 'Dit schooljaar is de Taalscreening opnieuw georganiseerd.', true),
  ('snel', 'bijwoord', 'De snelle leerling liep snel naar buiten.', true),
  ('bijzonder', 'bijwoord', 'Dat is een bijzonder moeilijke oefening.', true),
  ('vroeg', 'bijwoord', 'De vroege trein vertrekt erg vroeg.', true),
  ('ongelooflijk', 'bijwoord', 'Hij sprak ongelooflijk zacht.', true),
  ('hier', 'bijwoord', 'Kom hier zitten.', true),
  ('daarom', 'bijwoord', 'Daarom bleef hij thuis.', true),
  ('door', 'bijwoord', 'Werk maar door.', true),
  ('samen', 'bijwoord', 'Samen genoten ze van de rust en de schoonheid van de natuur.', true),
  ('voldoende', 'bijwoord', '85 procent van de kleuters is voldoende taalvaardig.', true),
  ('straks', 'bijwoord', 'Ze zijn voldoende taalvaardig om straks te starten in de lagere school.', true),
  ('altijd', 'bijwoord', 'De twee vrienden helpen elkaar altijd.', true),
  ('gisteren', 'bijwoord', 'Wij hebben de tekst gisteren gelezen.', true),
  ('morgen', 'bijwoord', 'Die leerlingen vertrekken morgen.', true),
  ('vaak', 'bijwoord', 'Zij vergissen zich vaak tijdens het spel.', true),
  ('luid', 'bijwoord', 'De hond blaft luid in de tuin.', true),
  ('drie', 'telwoord', 'Drie leerlingen kwamen te laat in de les.', true),
  ('tweede', 'telwoord', 'Zij eindigde als tweede in de wedstrijd.', true),
  ('veel', 'telwoord', 'Veel jongeren gebruiken dagelijks sociale media.', true),
  ('zoveelste', 'telwoord', 'Hij stelde voor de zoveelste keer dezelfde vraag.', true),
  ('twaalf', 'telwoord', 'We kochten twaalf broodjes voor de uitstap.', true),
  ('eerste', 'telwoord', 'De eerste leerling mocht naar voren komen.', true),
  ('enkele', 'telwoord', 'Enkele leerlingen hadden hun boek niet bij.', true),
  ('honderd', 'telwoord', 'Er stonden honderd mensen aan de ingang.', true),
  ('weinig', 'telwoord', 'Weinig deelnemers bereikten de finish.', true),
  ('tiende', 'telwoord', 'Zij woont op de tiende verdieping.', true),
  ('middelste', 'telwoord', 'Dit is al de middelste oefening van de reeks.', true),
  ('vier', 'telwoord', 'De maxima schommelen tussen 4 graden in de hoge Ardennen.', true),
  ('omdat', 'voegwoord', 'We gingen naar huis omdat het laat werd.', true),
  ('hoewel', 'voegwoord', 'Hoewel hij moe was, werkte hij verder.', true),
  ('terwijl', 'voegwoord', 'Anton wandelde, terwijl Luna hem volgde.', true),
  ('maar', 'voegwoord', 'Het is een moeilijke oefening, maar ze werkt snel.', true),
  ('want', 'voegwoord', 'Hij bleef thuis, want hij was ziek.', true),
  ('of', 'voegwoord', 'Kom je mee of blijf je hier?', true),
  ('dus', 'voegwoord', 'Het regende, dus we bleven binnen.', true),
  ('als', 'voegwoord', 'Als het mooi weer is, gaan we wandelen.', true),
  ('tot', 'voegwoord', 'Wacht hier tot ik terugkom.', true),
  ('en', 'voegwoord', 'Samen genoten ze van de rust en de schoonheid.', true),
  ('naast', 'voorzetsel', 'Ze zat naast mij.', true),
  ('na', 'voorzetsel', 'We vertrekken na de les.', true),
  ('op', 'voorzetsel', 'De oude kast stond jarenlang op zolder.', true),
  ('onder', 'voorzetsel', 'De kat kroop onder de tafel.', true),
  ('tijdens', 'voorzetsel', 'Tijdens een lange wandeling bereikten we eindelijk Brugge.', true),
  ('langs', 'voorzetsel', 'Elke ochtend maakte Anton een wandeling langs de kronkelende paden.', true),
  ('volgens', 'voorzetsel', 'Volgens de politie waren de drie dieren ontsnapt.', true),
  ('vanuit', 'voorzetsel', 'In de loop van de namiddag wordt het vanuit het westen droger.', true),
  ('voor', 'voorzetsel', 'De jongen zag geen oplossing voor het probleem.', true),
  ('in', 'voorzetsel', 'Die vrouw woont in een huis dat honderd jaar oud is.', true),
  ('met', 'voorzetsel', 'Dat kind speelt met de bal.', true),
  ('aan', 'voorzetsel', 'Hij vertelde zijn verhaal aan de klas.', true),
  ('amai', 'tussenwerpsel', 'Amai, dat is een moeilijke oefening!', true),
  ('oei', 'tussenwerpsel', 'Oei, ik ben te laat voor de les.', true),
  ('hé', 'tussenwerpsel', 'Hé, wacht even op mij!', true),
  ('verdorie', 'tussenwerpsel', 'Verdorie, ik ben mijn boek vergeten.', true),
  ('hoera', 'tussenwerpsel', 'Hoera, we hebben de wedstrijd gewonnen!', true),
  ('au', 'tussenwerpsel', 'Au, dat deed pijn!', true),
  ('sst', 'tussenwerpsel', 'Sst, de leraar begint zo.', true),
  ('wow', 'tussenwerpsel', 'Wow, wat een prachtig uitzicht!', true);
  end if;

  if (select count(*) from public.theory_sections) = 0 then
    insert into public.theory_sections (sort_order, nr, title, abbr, in_game_soort, body_html, active) values
  (1, '1', 'Zelfstandig naamwoord', 'zn', 'zelfstandig', '<p>Benoemt personen, dieren, dingen, plaatsen, gevoelens of begrippen.</p>
        <p class="theory-ex">→ de hond, een stoel, Gent, liefde.</p>
        <p>Je kunt er meestal een lidwoord bij zetten (de, het, een).</p>', true),
  (2, '2', 'Lidwoord', 'lw', 'lidwoord', '<p>Hoort altijd bij een zelfstandig naamwoord.</p>
        <ul class="theory-bullets">
          <li><strong>Bepaald:</strong> de, het</li>
          <li><strong>Onbepaald:</strong> een</li>
          <li><strong>Ontkennend:</strong> geen</li>
        </ul>
        <p class="theory-tip">Let op: staat ‘het’ niet bij een zn, dan is het géén lidwoord
          <em>(Het wordt mooi weer)</em>.</p>', true),
  (3, '3', 'Bijvoeglijk naamwoord', 'bn', 'bijvoeglijk', '<p>Zegt iets meer over een zelfstandig naamwoord.</p>
        <p class="theory-ex">→ de grote hond, een mooi huis, het rode kleed.</p>
        <p>Je kunt vaak ‘heel’ of ‘erg’ ervoor zetten: heel groot, erg lief.</p>', true),
  (4, '4', 'Voornaamwoord', 'vnw', 'voornaamwoord', '<p>Vervangt of verwijst naar een zelfstandig naamwoord. Acht soorten:</p>
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
        </div>', true),
  (5, '5', 'Bijwoord', 'bw', 'bijwoord', '<p>Zegt iets over een werkwoord, bijvoeglijk naamwoord of ander bijwoord.</p>
        <p class="theory-ex">→ Hij loopt snel. – Dat is erg mooi. – We komen morgen.</p>
        <p>Antwoord op vragen als: waar, wanneer, waarom, hoe.</p>
        <p class="theory-ex">→ hier, daar, gisteren, daarom, vaak.</p>', true),
  (6, '6', 'Telwoord', 'tw', 'telwoord', '<p>Geeft een hoeveelheid of volgorde aan.</p>
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
        </div>', true),
  (7, '7', 'Voegwoord', 'vw', 'voegwoord', '<p>Verbindt woorden of zinnen.</p>
        <ul class="theory-bullets">
          <li><strong>Nevenschikkend:</strong> en, maar, want, of, dus</li>
          <li><strong>Onderschikkend:</strong> omdat, als, hoewel, terwijl, zodat …</li>
        </ul>
        <p class="theory-tip">Kun je de zinnen apart zetten → nevenschikkend; niet apart → onderschikkend.</p>', true),
  (8, '8', 'Voorzetsel', 'vz', 'voorzetsel', '<p>Geeft plaats, tijd, oorzaak, richting of middel aan.</p>
        <p class="theory-ex">→ op, onder, naast, achter, tijdens, dankzij.</p>
        <p class="theory-tip">Testzin: “De aap springt … de ton.”</p>', true),
  (9, '9', 'Tussenwerpsel', 'twp', 'tussenwerpsel', '<p>Drukt een gevoel of reactie uit.</p>
        <p class="theory-ex">→ Amai! Oei! Hé! Verdorie!</p>
        <p>Vaak kun je het weglaten zonder dat de zin fout is.</p>', true),
  (10, '10', 'Werkwoord', 'ww', 'werkwoord', '<p>Zegt wat iemand doet of overkomt.</p>
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
        <p class="theory-tip">Alle andere werkwoorden in de zin zijn hulpwerkwoorden.</p>', true);
  end if;
end
$$;
