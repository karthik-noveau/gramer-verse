/* ============================================================
   formation.js — "how the sentence is built", drawn.

   English and Tamil say the same thing in a different order, and
   sometimes with a different number of words. Telling a learner that
   is a rule to be believed. Drawing a line from each English word to
   the Tamil word that does its job makes it something they can see:

     - the lines cross, because the verb moves to the end
     - two lines land on one Tamil word, because English needs
       "in + the box" where Tamil fuses both into பெட்டியில்
     - some English words have no line at all, because Tamil has no
       article

   Colour is the word's job, not its language: the same five roles are
   used here, in the scene renderer and in the zero-English page, so
   "orange is the thing" holds everywhere.

   --- the data ---------------------------------------------------
   The alignment cannot be derived. Nothing in the source says which
   Tamil word carries "in", and guessing would draw confident wrong
   lines. So it is authored, per row, below. Every English and Tamil
   string here is copied from the row it belongs to — the alignment is
   the only thing added.

   In React this becomes common/components/Formation, reading the same
   alignment table from content/.
   ============================================================ */
(function () {
  'use strict';

  /* Roles and colours, all defined in tokens.css. A trailing digit makes a
     second word of the same job — two places in one sentence — without
     inventing another colour that would mean nothing.

     The first five are the scene's own, and the legend on the zero-English
     page teaches them. The last three exist only in this diagram, for the
     tables it reaches beyond the scene: a word describing how something is
     or happens, a question word, a joiner. They are only ever seen here. */
  var COLOUR = {
    det:    'var(--r-det)',      /* which one   — எது      */
    figure: 'var(--r-figure)',   /* the thing   — பொருள்   */
    rel:    'var(--r-rel)',      /* the relation— தொடர்பு  */
    ground: 'var(--r-ground)',   /* the other noun — இடம்  */
    be:     'var(--r-be)',       /* the verb    — உள்ளது   */
    qual:   'var(--r-qual)',     /* how         — எப்படி   */
    ask:    'var(--r-ask)',      /* the question— வினா     */
    join:   'var(--r-join)'      /* the joiner  — இணைப்பு  */
  };
  var LABEL_TA = {
    det: 'எது', figure: 'பொருள்', rel: 'தொடர்பு', ground: 'இடம்', be: 'வினை',
    qual: 'எப்படி', ask: 'வினா', join: 'இணைப்பு'
  };
  function base(role) { return String(role).replace(/\d+$/, ''); }
  function colour(role) { return COLOUR[base(role)] || 'var(--muted)'; }

  /* ---- the drawing ------------------------------------------
     Tamil on top, English below, one curve per shared role. Both rows are
     spread evenly across the width; the curve is a vertical-tangent bezier
     so lines that cross stay readable where they overlap. */
  function draw(spec) {
    var W = 760, PAD = 20, yTa = 40, yEn = 138;

    function lay(tokens) {
      var n = tokens.length, out = [];
      for (var i = 0; i < n; i++) {
        out.push({ x: PAD + ((W - 2 * PAD) / (n + 1)) * (i + 1), tok: tokens[i] });
      }
      return out;
    }
    var A = lay(spec.ta), B = lay(spec.en);

    /* One curve per role. A Tamil token listing two roles gets two curves
       landing on it — that is the fusion, and it is the point of the
       picture, not a glitch to be tidied away. */
    var curves = '';
    A.forEach(function (a) {
      (a.tok.r || []).forEach(function (role) {
        var b = B.filter(function (x) { return (x.tok.r || []).indexOf(role) > -1; })[0];
        if (!b) return;
        curves += '<path d="M' + a.x.toFixed(1) + ' ' + (yTa + 12) +
          ' C' + a.x.toFixed(1) + ' ' + (yTa + 52) +
          ' ' + b.x.toFixed(1) + ' ' + (yEn - 52) +
          ' ' + b.x.toFixed(1) + ' ' + (yEn - 16) + '" fill="none" stroke="' +
          colour(role) + '" stroke-width="2.5" opacity=".55"/>';
      });
    });

    function text(list, y, font, extra) {
      return list.map(function (p) {
        var roles = p.tok.r || [];
        var fill = roles.length ? colour(roles[0]) : 'var(--muted)';
        var s = '<text x="' + p.x.toFixed(1) + '" y="' + y + '" text-anchor="middle" ' +
          'font-family="' + font + '" font-size="15"' +
          (roles.length ? ' font-weight="600"' : ' opacity=".55"') +
          ' fill="' + fill + '">' + esc(p.tok.t) + '</text>';
        /* Only the fused token gets a caption, and only in Tamil: it is the
           one thing on the picture that needs saying, and it is said to the
           reader who needs it. */
        if (extra && roles.length > 1) {
          s += '<text x="' + p.x.toFixed(1) + '" y="' + (y - 17) + '" text-anchor="middle" ' +
            'font-family="Noto Sans Tamil, sans-serif" font-size="11" fill="var(--muted)">' +
            roles.map(function (r) { return LABEL_TA[base(r)]; }).join(' + ') + '</text>';
        }
        return s;
      }).join('');
    }

    return '<svg viewBox="0 0 ' + W + ' 172" class="fm-svg" role="img" aria-label="' +
      esc(spec.enText + ' — ' + spec.taText) + '">' +
      curves +
      text(A, yTa, 'Noto Sans Tamil, sans-serif', true) +
      text(B, yEn + 4, 'Georgia, serif', false) +
      '</svg>';
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;');
  }

  /* What the picture is trying to say, in one line, in both languages.
     Derived from the alignment rather than written per row, so it can never
     drift from what is actually drawn — and both languages are built from
     the same three findings in the same order, so they cannot drift from
     each other either. Returns { ta, en }. */
  function headline(spec) {
    var fused = spec.ta.filter(function (t) { return (t.r || []).length > 1; });
    var orphan = spec.en.filter(function (t) { return !(t.r || []).length; });
    /* Tamil only. The note is the one thing on the card written for a reader
       who has no English yet — everything else here is the English sentence,
       the diagram of it, and the row it came from. Saying it again in English
       doubled the length of the line to tell that reader nothing. */
    var notes = [];

    if (fused.length) {
      var pair = spec.en.filter(function (t) {
        return (t.r || []).some(function (r) { return fused[0].r.indexOf(r) > -1; });
      }).map(function (t) { return t.t; }).join(' + ');
      notes.push('ஆங்கிலத்தில் <b>இரண்டு சொல்</b> — ' + pair +
                 '. தமிழில் <b>ஒரே சொல்</b> — ' + fused[0].t + '.');
    }
    if (orphan.length) {
      notes.push('<b>' + orphan.map(function (t) { return t.t; }).join(', ') +
                 '</b> — தமிழில் தனிச் சொல் இல்லை.');
    }
    /* Nothing is said about the verb moving to the end. It is true of every
       row here, so it was printed on every card — and the crossing lines
       say it better than a sentence repeated 115 times. A row where nothing
       fuses and nothing is orphaned now says nothing at all, and shows the
       picture instead. */
    return notes;
  }

  /* No heading. "The word order is different" is what the drawing beneath it
     shows; naming it first made the card explain its own picture. */
  /* One line per card, not one per finding: a card with both a fusion and an
     orphan was printing two, and two lines of small text above a diagram read
     as a paragraph to be got through. */
  function card(spec) {
    var note = headline(spec).join(' ');
    /* The diagram gets a scroller of its own rather than the card getting
       one: on a phone the drawing is wider than the screen and the note
       above it is not, so scrolling the whole card would drag the sentence
       sideways along with the picture it explains. */
    return '<div class="fm">' +
      (note ? '<p class="fm-note" lang="ta">' + note + '</p>' : '') +
      '<div class="fm-scroll">' + draw(spec) + '</div>' +
    '</div>';
  }

  /* ---- authoring shorthand ----------------------------------
     "The:det ball:figure is:be in:rel the box:ground" — a word, a colon,
     its job. No colon means the word has no counterpart on the other side,
     which is itself worth drawing. */
  function parse(line) {
    return line.split('|').map(function (chunk) {
      var bits = chunk.trim().split(':');
      var t = bits.shift().trim();
      return { t: t, r: bits.filter(Boolean).map(function (r) { return r.trim(); }) };
    });
  }
  function F(enText, en, taText, ta) {
    return { enText: enText, taText: taText, en: parse(en), ta: parse(ta) };
  }

  /* ============================================================
     the alignments

     Keyed tableId#rowIndex. English and Tamil strings are the row's own,
     after the corrections in content.js — a diagram of an uncorrected
     sentence would be a diagram of the mistake.
     ============================================================ */
  var DATA = {


    /* ---- sentence formation ---------------------------------
       Keyed by DATA row, not by row in the table: the renderer splits on the
       group headings and numbers what is left, so counting the headings put
       every alignment on the wrong sentence.
       Every row here is one sentence about playing cricket, said six ways.
       The Tamil keeps "cricket" in Latin script, which is how the notes wrote
       it, so the word appears untranslated on both lines — that is the source
       and not a gap.

       The recurring lesson: English puts the verb in the middle and Tamil
       puts it last, so the object and the verb cross on every single row. */
    'sentence-types#0': F(
      'I play cricket',
      'I:figure | play:be | cricket:ground',
      'நான் cricket விளையாடுறேன்',
      'நான்:figure | cricket:ground | விளையாடுறேன்:be'),
    'sentence-types#1': F(
      'I am playing cricket',
      'I:figure | am playing:be | cricket:ground',
      'நான் cricket விளையாடிக்கிட்டிருக்கேன்',
      'நான்:figure | cricket:ground | விளையாடிக்கிட்டிருக்கேன்:be'),
    'sentence-types#2': F(
      'I played cricket',
      'I:figure | played:be | cricket:ground',
      'நான் cricket விளையாடினேன்',
      'நான்:figure | cricket:ground | விளையாடினேன்:be'),
    'sentence-types#3': F(
      'I will play cricket',
      'I:figure | will play:be | cricket:ground',
      'நான் cricket விளையாட போறேன்',
      'நான்:figure | cricket:ground | விளையாட போறேன்:be'),

    'sentence-types#4': F(
      'I do not play cricket',
      'I:figure | do not play:be | cricket:ground',
      'நான் cricket விளையாட மாட்டேன்',
      'நான்:figure | cricket:ground | விளையாட மாட்டேன்:be'),
    'sentence-types#5': F(
      'I am not playing cricket',
      'I:figure | am not playing:be | cricket:ground',
      'நான் cricket விளையாடல',
      'நான்:figure | cricket:ground | விளையாடல:be'),
    'sentence-types#6': F(
      'I did not play cricket',
      'I:figure | did not play:be | cricket:ground',
      'நான் cricket விளையாடல',
      'நான்:figure | cricket:ground | விளையாடல:be'),
    'sentence-types#7': F(
      'I will not play cricket',
      'I:figure | will not play:be | cricket:ground',
      'நான் cricket விளையாட மாட்டேன்',
      'நான்:figure | cricket:ground | விளையாட மாட்டேன்:be'),

    /* The WH word leads in English and sits second in Tamil, so the question
       word crosses too — not just the verb. The auxiliary (do, are, did, will)
       is left untagged on purpose: Tamil folds the tense into the verb ending,
       so there is no Tamil word for it to reach and it draws no line. That
       missing line is the lesson. */
    'sentence-types#8': F(
      'Where do you play cricket ?',
      'Where:det | do | you:figure | play:be | cricket:ground',
      'நீ எங்கே cricket விளையாடுறா ?',
      'நீ:figure | எங்கே:det | cricket:ground | விளையாடுறா:be'),
    'sentence-types#9': F(
      'Where are you playing cricket ?',
      'Where:det | are | you:figure | playing:be | cricket:ground',
      'நீ எங்கே cricket விளையாடிக்கிட்டிருக்கா?',
      'நீ:figure | எங்கே:det | cricket:ground | விளையாடிக்கிட்டிருக்கா:be'),
    'sentence-types#10': F(
      'Where did you play cricket ?',
      'Where:det | did | you:figure | play:be | cricket:ground',
      'நீ எங்கே cricket விளையாடினா ?',
      'நீ:figure | எங்கே:det | cricket:ground | விளையாடினா:be'),
    'sentence-types#11': F(
      'Where will you play cricket ?',
      'Where:det | will | you:figure | play:be | cricket:ground',
      'நீ எங்கே cricket விளையாட போறா ?',
      'நீ:figure | எங்கே:det | cricket:ground | விளையாட போறா:be'),

    /* A yes/no question asks with a word at the front in English and with an
       ending on the verb in Tamil — there is no Tamil word to draw a line to,
       which is the point. */
    'sentence-types#12': F(
      'Do you play cricket ?',
      'Do | you:figure | play:be | cricket:ground',
      'நீ எங்கே cricket விளையாடுறா ?',
      'நீ:figure | எங்கே | cricket:ground | விளையாடுறா:be'),
    'sentence-types#13': F(
      'Are you playing cricket ?',
      'Are | you:figure | playing:be | cricket:ground',
      'நீ cricket விளையாடிக்கிட்டிருக்கியா ?',
      'நீ:figure | cricket:ground | விளையாடிக்கிட்டிருக்கியா:be'),
    'sentence-types#14': F(
      'Did you play cricket ?',
      'Did | you:figure | play:be | cricket:ground',
      'நீ cricket விளையாடினியா ?',
      'நீ:figure | cricket:ground | விளையாடினியா:be'),
    'sentence-types#15': F(
      'Will you play cricket ?',
      'Will | you:figure | play:be | cricket:ground',
      'நீ cricket விளையாட போறியா ?',
      'நீ:figure | cricket:ground | விளையாட போறியா:be'),

    /* An order has no subject in either language. */
    'sentence-types#16': F(
      'Close the door',
      'Close:be | the door:ground',
      'கதவு மூடு',
      'கதவு:ground | மூடு:be'),
    'sentence-types#17': F(
      'Please open the window',
      'Please:det | open:be | the window:ground',
      'தயவு செய்து ஜன்னல் திற',
      'தயவு செய்து:det | ஜன்னல்:ground | திற:be'),

    'sentence-types#18': F(
      'What a beautiful place!',
      'What a:det | beautiful:rel | place:ground',
      'என்ன ஒரு அழகான இடம்!',
      'என்ன ஒரு:det | அழகான:rel | இடம்:ground'),
    'sentence-types#19': F(
      "Wow! It's amazing",
      "Wow!:det | It's:figure | amazing:rel",
      'வாவ்! இது அருமை!',
      'வாவ்!:det | இது:figure | அருமை:rel'),

    /* ---- articles ------------------------------------------- */
    'articles#0': F(
      'I have a pen.',
      'I:figure | have:be | a:det | pen:ground',
      'எனக்கு ஒரு பேனா இருக்கிறது.',
      'எனக்கு:figure | ஒரு:det | பேனா:ground | இருக்கிறது:be'),
    'articles#1': F(
      'She eats an apple.',
      'She:figure | eats:be | an:det | apple:ground',
      'அவள் ஒரு ஆப்பிள் சாப்பிட்டாள்.',
      'அவள்:figure | ஒரு:det | ஆப்பிள்:ground | சாப்பிட்டாள்:be'),
    'articles#2': F(
      'The sun is bright.',
      'The:det | sun:figure | is:be | bright:ground',
      'அந்த சூரியன் பிரகாசமாக உள்ளது.',
      'அந்த:det | சூரியன்:figure | பிரகாசமாக:ground | உள்ளது:be'),

    /* ---- in, at, on ----------------------------------------- */
    'prep-common#0': F(
      'The ball is in the box',
      'The | ball:figure | is:be | in:rel | the box:ground',
      'பந்து பெட்டியில் உள்ளது.',
      'பந்து:figure | பெட்டியில்:rel:ground | உள்ளது:be'),
    'prep-common#1': F(
      'I was born in 2000',
      'I:figure | was born:be | in:rel | 2000:ground',
      'நான் 2000 ஆம் ஆண்டில் பிறந்தேன்.',
      'நான்:figure | 2000 ஆம் ஆண்டில்:rel:ground | பிறந்தேன்:be'),
    'prep-common#2': F(
      'She is at school',
      'She:figure | is:be | at:rel | school:ground',
      'அவள் பள்ளியில் இருக்கிறாள்.',
      'அவள்:figure | பள்ளியில்:rel:ground | இருக்கிறாள்:be'),
    'prep-common#3': F(
      'The train arrives at 5 PM',
      'The | train:figure | arrives:be | at:rel | 5 PM:ground',
      'ரயில் மாலை 5 மணிக்கு வருகிறது.',
      'ரயில்:figure | மாலை 5 மணிக்கு:rel:ground | வருகிறது:be'),
    /* on/place is the useful counter-example: here Tamil does keep the
       relation as its own word (மீது), so not every preposition fuses. */
    'prep-common#4': F(
      'The book is on the table',
      'The | book:figure | is:be | on:rel | the table:ground',
      'புத்தகம் மேசையின் மீது உள்ளது.',
      'புத்தகம்:figure | மேசையின்:ground | மீது:rel | உள்ளது:be'),
    'prep-common#5': F(
      'The meeting is on Monday',
      'The | meeting:figure | is:be | on:rel | Monday:ground',
      'கூட்டம் திங்கட்கிழமை நடைபெறும்.',
      'கூட்டம்:figure | திங்கட்கிழமை:rel:ground | நடைபெறும்:be'),

    /* ---- place ---------------------------------------------- */
    'prep-place#0': F(
      'The cat is under the table',
      'The | cat:figure | is:be | under:rel | the table:ground',
      'பூனை மேசைய கீழே உள்ளது.',
      'பூனை:figure | மேசைய:ground | கீழே:rel | உள்ளது:be'),
    'prep-place#1': F(
      'The clock is above the door',
      'The | clock:figure | is:be | above:rel | the door:ground',
      'கடிகாரம் கதவின் மேலே உள்ளது.',
      'கடிகாரம்:figure | கதவின்:ground | மேலே:rel | உள்ளது:be'),
    'prep-place#2': F(
      'The temperature is below zero',
      'The | temperature:figure | is:be | below:rel | zero:ground',
      'வெப்பநிலை பூஜ்ஜியத்திற்கு கீழே உள்ளது.',
      'வெப்பநிலை:figure | பூஜ்ஜியத்திற்கு:ground | கீழே:rel | உள்ளது:be'),
    'prep-place#3': F(
      'The dog is behind the car',
      'The | dog:figure | is:be | behind:rel | the car:ground',
      'நாய் காரின் பின்புறம் உள்ளது.',
      'நாய்:figure | காரின்:ground | பின்புறம்:rel | உள்ளது:be'),
    'prep-place#4': F(
      'He is standing in front of the shop',
      'He:figure | is standing:be | in front of:rel | the shop:ground',
      'அவன் கடையின் முன்னால் நிற்கிறான்.',
      'அவன்:figure | கடையின்:ground | முன்னால்:rel | நிற்கிறான்:be'),
    'prep-place#5': F(
      'The park is between the school and the hospital',
      'The | park:figure | is:be | between:rel | the school and the hospital:ground',
      'பூங்கா பள்ளி மற்றும் மருத்துவமனைக்கு நடுவில் உள்ளது.',
      'பூங்கா:figure | பள்ளி மற்றும் மருத்துவமனைக்கு:ground | நடுவில்:rel | உள்ளது:be'),
    'prep-place#6': F(
      'The library is near the college',
      'The | library:figure | is:be | near:rel | the college:ground',
      'நூலகம் கல்லூரிக்கு அருகில் உள்ளது.',
      'நூலகம்:figure | கல்லூரிக்கு:ground | அருகில்:rel | உள்ளது:be'),
    'prep-place#7': F(
      'He is sitting beside his friend',
      'He:figure | is sitting:be | beside:rel | his:det | friend:ground',
      'அவன் தனது நண்பரின் அருகில் உட்கார்ந்துள்ளான்.',
      'அவன்:figure | தனது:det | நண்பரின்:ground | அருகில்:rel | உட்கார்ந்துள்ளான்:be'),
    'prep-place#8': F(
      'He is standing there',
      'He:figure | is standing:be | there:ground',
      'அவன் அங்கே நிற்கிறான்.',
      'அவன்:figure | அங்கே:ground | நிற்கிறான்:be'),
    'prep-place#9': F(
      'He is standing here',
      'He:figure | is standing:be | here:ground',
      'அவன் இங்கே நிற்கிறான்',
      'அவன்:figure | இங்கே:ground | நிற்கிறான்:be'),

    /* ---- time ------------------------------------------------
       Tamil often puts the whole time phrase first, where English leaves it
       to the end. The lines cross the full width, which is the point. */
    'prep-time#0': F(
      'Come before 8 AM',
      'Come:be | before:rel | 8 AM:ground',
      'காலை 8 மணிக்கு முன்னால் வா.',
      'காலை 8 மணிக்கு:ground | முன்னால்:rel | வா:be'),
    'prep-time#1': F(
      'We’ll meet after lunch',
      'We’ll:figure | meet:be | after:rel | lunch:ground',
      'மதிய உணவுக்குப் பிறகு நாம் சந்திப்போம்.',
      'மதிய உணவுக்குப்:ground | பிறகு:rel | நாம்:figure | சந்திப்போம்:be'),
    'prep-time#2': F(
      'Finish the work by 6 PM',
      'Finish:be | the work:figure | by:rel | 6 PM:ground',
      'வேலையை மாலை 6 மணிக்குள் முடிக்கவும்.',
      'வேலையை:figure | மாலை 6 மணிக்குள்:rel:ground | முடிக்கவும்:be'),
    'prep-time#3': F(
      'I’ve lived here since 2010',
      'I’ve:figure | lived:be | here:ground2 | since:rel | 2010:ground',
      'நான் 2010 முதல் இங்கே வசிக்கிறேன்.',
      'நான்:figure | 2010:ground | முதல்:rel | இங்கே:ground2 | வசிக்கிறேன்:be'),
    'prep-time#4': F(
      'I slept during the movie',
      'I:figure | slept:be | during:rel | the movie:ground',
      'நான் படத்தின் போது தூங்கினேன்.',
      'நான்:figure | படத்தின்:ground | போது:rel | தூங்கினேன்:be'),
    'prep-time#5': F(
      'Wait until I come',
      'Wait:be | until:rel | I come:ground',
      'நான் வரும் வரை காத்திரு.',
      'நான் வரும்:ground | வரை:rel | காத்திரு:be'),

    /* ---- direction ------------------------------------------- */
    'prep-dir#0': F(
      'He is going to school',
      'He:figure | is going:be | to:rel | school:ground',
      'அவன் பள்ளிக்கு செல்கிறான்.',
      'அவன்:figure | பள்ளிக்கு:rel:ground | செல்கிறான்:be'),
    'prep-dir#1': F(
      'The dog ran into the room',
      'The | dog:figure | ran:be | into:rel | the room:ground',
      'நாய் அறைக்குள் ஓடியது.',
      'நாய்:figure | அறைக்குள்:rel:ground | ஓடியது:be'),
    'prep-dir#2': F(
      'Walk towards the station',
      'Walk:be | towards:rel | the station:ground',
      'நிலையத்தைக் நோக்கி நடந்தேறு',
      'நிலையத்தைக்:ground | நோக்கி:rel | நடந்தேறு:be'),
    'prep-dir#3': F(
      'They walked along the river',
      'They:figure | walked:be | along:rel | the river:ground',
      'அவர்கள் ஆற்றின் ஓரமாக நடந்தனர்.',
      'அவர்கள்:figure | ஆற்றின்:ground | ஓரமாக:rel | நடந்தனர்:be'),
    'prep-dir#4': F(
      'He ran across the road',
      'He:figure | ran:be | across:rel | the road:ground',
      'அவன் சாலையை கடந்து ஓடினான்.',
      'அவன்:figure | சாலையை:ground | கடந்து:rel | ஓடினான்:be'),
    'prep-dir#5': F(
      'The plane flew over the city',
      'The | plane:figure | flew:be | over:rel | the city:ground',
      'விமானம் நகரத்தின் மேலே பறந்தது.',
      'விமானம்:figure | நகரத்தின்:ground | மேலே:rel | பறந்தது:be'),
    'prep-dir#6': F(
      'We drove past the park',
      'We:figure | drove:be | past:rel | the park:ground',
      'நாங்கள் பூங்காவை தாண்டி ஓட்டிச் சென்றோம்.',
      'நாங்கள்:figure | பூங்காவை:ground | தாண்டி:rel | ஓட்டிச் சென்றோம்:be'),
    'prep-dir#7': F(
      'He came from the office',
      'He:figure | came:be | from:rel | the office:ground',
      'அவன் அலுவலகத்திலிருந்து வந்தான்.',
      'அவன்:figure | அலுவலகத்திலிருந்து:rel:ground | வந்தான்:be'),

    /* ---- other ----------------------------------------------
       Several of these have no Tamil verb at all — "is" simply is not said.
       The English word with no line is as much the lesson as the crossing. */
    'prep-other#0': F(
      'This book is about history',
      'This:det | book:figure | is | about:rel | history:ground',
      'இந்த புத்தகம் வரலாற்றைப் பற்றி.',
      'இந்த:det | புத்தகம்:figure | வரலாற்றைப்:ground | பற்றி:rel'),
    'prep-other#1': F(
      'The gift is for you',
      'The:det | gift:figure | is | for:rel | you:ground',
      'இந்த பரிசு உங்களுக்காக.',
      'இந்த:det | பரிசு:figure | உங்களுக்காக:rel:ground'),
    'prep-other#2': F(
      'I will go with my friend',
      'I:figure | will go:be | with:rel | my:det | friend:ground',
      'நான் என் நண்பருடன் போவேன்.',
      'நான்:figure | என்:det | நண்பருடன்:rel:ground | போவேன்:be'),
    'prep-other#3': F(
      'He works as a driver',
      'He:figure | works:be | as:rel | a:det | driver:ground',
      'அவன் ஒரு டிரைவராக வேலை செய்கிறான்.',
      'அவன்:figure | ஒரு:det | டிரைவராக:rel:ground | வேலை செய்கிறான்:be'),
    'prep-other#4': F(
      'She sings like a bird',
      'She:figure | sings:be | like:rel | a bird:ground',
      'அவள் பறவையைப் போன்று பாடுகிறாள்.',
      'அவள்:figure | பறவையைப்:ground | போன்று:rel | பாடுகிறாள்:be'),
    'prep-other#5': F(
      'The price is $10 per kg',
      'The | price:figure | is | $10:ground2 | per:rel | kg:ground',
      '1 கிலோக்கு விலை $10.',
      '1 கிலோக்கு:rel:ground | விலை:figure | $10:ground2'),

    /* ---- tense forms ----------------------------------------
       Each cell in this table holds three sentences; the diagram takes the
       first pair, the one the row leads with.

       Four rows are missing on purpose — the "has been being", "had been
       being" and "will have been being" rows. Correction 1 records that
       those forms are not real English and are dropped, so drawing one
       would be a picture of the mistake, made in the app's own hand.

       What these eight show is the same thing eight ways: English carries
       the tense in a stack of auxiliaries at the front, Tamil carries it in
       the ending of the one verb at the back. */
    'tense-forms#0': F(
      'I am a writer',
      'I:figure | am | a:det | writer:ground',
      'நான் ஒரு எழுத்தாளன்.',
      'நான்:figure | ஒரு:det | எழுத்தாளன்:ground'),
    'tense-forms#1': F(
      'I am writing now..',
      'I:figure | am writing:be | now:qual',
      'நான் இப்போது எழுதுகிறேன்.',
      'நான்:figure | இப்போது:qual | எழுதுகிறேன்:be'),
    'tense-forms#2': F(
      'He has been writing for an hour',
      'He:figure | has been writing:be | for an hour:qual',
      'அவன் ஒரு மணி நேரமாக எழுதிவருகிறான்.',
      'அவன்:figure | ஒரு மணி நேரமாக:qual | எழுதிவருகிறான்:be'),
    'tense-forms#4': F(
      'I was a writer.',
      'I:figure | was:be | a:det | writer:ground',
      'நான் ஒரு எழுத்தாளன் இருந்தேன்',
      'நான்:figure | ஒரு:det | எழுத்தாளன்:ground | இருந்தேன்:be'),
    'tense-forms#5': F(
      'I was writing yesterday.',
      'I | was writing:be | yesterday:qual',
      'நேற்று எழுதிக் கொண்டிருந்தேன்.',
      'நேற்று:qual | எழுதிக் கொண்டிருந்தேன்:be'),
    'tense-forms#6': F(
      'I had been writing for an hour..',
      'I:figure | had been writing:be | for an hour:qual',
      'நான் ஒரு மணி நேரமாக எழுதி வந்தேன்.',
      'நான்:figure | ஒரு மணி நேரமாக:qual | எழுதி வந்தேன்:be'),
    'tense-forms#8': F(
      'I will be a writer.',
      'I:figure | will be:be | a:det | writer:ground',
      'நான் ஒரு எழுத்தாளன் ஆக இருப்பேன்.',
      'நான்:figure | ஒரு:det | எழுத்தாளன்:ground | ஆக இருப்பேன்:be'),
    'tense-forms#10': F(
      'I will have been writing for an hour.',
      'I:figure | will have been writing:be | for an hour:qual',
      'நான் ஒரு மணி நேரமாக எழுதி முடித்திருப்பேன்.',
      'நான்:figure | ஒரு மணி நேரமாக:qual | எழுதி முடித்திருப்பேன்:be'),

    /* ---- modals ---------------------------------------------
       English puts the modal before the verb; Tamil puts it after. Both
       words are the verb's job, so both take the verb colour and the two
       curves cross — which is the whole point of the row. */
    'modals#0': F(
      'I can write.',
      'I:figure | can:be1 | write:be2',
      'நான் எழுத முடியும்.',
      'நான்:figure | எழுத:be2 | முடியும்:be1'),
    'modals#1': F(
      'I could go.',
      'I:figure | could:be1 | go:be2',
      'நான் போக முடியும்.',
      'நான்:figure | போக:be2 | முடியும்:be1'),
    'modals#2': F(
      'I will write',
      'I:figure | will:be1 | write:be2',
      'நான் எழுதப் போகிறேன்.',
      'நான்:figure | எழுதப்:be2 | போகிறேன்:be1'),
    'modals#3': F(
      'I would like tea.',
      'I:figure | would like:be | tea:ground',
      'நான் தேனீர் விரும்புகிறேன்.',
      'நான்:figure | தேனீர்:ground | விரும்புகிறேன்:be'),
    'modals#4': F(
      'I may come',
      'I:figure | may:be1 | come:be2',
      'நான் வர வாய்ப்பு இருக்கிறது',
      'நான்:figure | வர:be2 | வாய்ப்பு இருக்கிறது:be1'),
    'modals#5': F(
      'It might rain today.',
      'It | might:be1 | rain:be2 | today:qual',
      'இன்று மழை பெய்யலாம்',
      'இன்று:qual | மழை:be2 | பெய்யலாம்:be1'),
    'modals#6': F(
      'You must come.',
      'You:figure | must:be1 | come:be2',
      'நீ வர வேண்டும்.',
      'நீ:figure | வர:be2 | வேண்டும்:be1'),
    'modals#7': F(
      'I shall help you',
      'I:figure | shall:be1 | help:be2 | you:ground',
      'நான் உங்களுக்கு உதவப்போகிறேன்.',
      'நான்:figure | உங்களுக்கு:ground | உதவப்போகிறேன்:be2:be1'),
    'modals#8': F(
      'You should study.',
      'You:figure | should:be1 | study:be2',
      'நீ படிக்க வேண்டும்.',
      'நீ:figure | படிக்க:be2 | வேண்டும்:be1'),
    'modals#9': F(
      'You ought to help.',
      'You:figure | ought to:be1 | help:be2',
      'நீ உதவ வேண்டும்.',
      'நீ:figure | உதவ:be2 | வேண்டும்:be1'),

    /* ---- WH question words -----------------------------------
       English asks at the front, Tamil asks at the end — except when the
       question word is about a noun, where Tamil keeps it next to that
       noun. Either way the question word is its own colour. */
    'wh-words#0': F(
      'What is your name?',
      'What:ask | is | your:det | name:ground',
      'உங்கள் பெயர் என்ன?',
      'உங்கள்:det | பெயர்:ground | என்ன:ask'),
    'wh-words#1': F(
      'When is your birthday?',
      'When:ask | is | your:det | birthday:ground',
      'உங்கள் பிறந்த நாள் எப்போது?',
      'உங்கள்:det | பிறந்த நாள்:ground | எப்போது:ask'),
    'wh-words#2': F(
      'Where is the bus stop?',
      'Where:ask | is | the | bus stop:ground',
      'பேருந்து நிறுத்தம் எங்கே?',
      'பேருந்து நிறுத்தம்:ground | எங்கே:ask'),
    'wh-words#3': F(
      'Why are you sad?',
      'Why:ask | are:be | you:figure | sad:qual',
      'நீங்கள் ஏன் சோகமாக இருக்கிறீர்கள்?',
      'நீங்கள்:figure | ஏன்:ask | சோகமாக:qual | இருக்கிறீர்கள்:be'),
    'wh-words#4': F(
      'Who is calling?',
      'Who:ask | is calling:be',
      'யார் அழைக்கிறார்?',
      'யார்:ask | அழைக்கிறார்:be'),
    'wh-words#5': F(
      'Whose book is this?',
      'Whose:ask | book:ground | is | this:det',
      'இது யாருடைய புத்தகம்?',
      'இது:det | யாருடைய:ask | புத்தகம்:ground'),
    'wh-words#6': F(
      'Which color do you like?',
      'Which:ask | color:ground | do | you:figure | like:be',
      'எந்த நிறத்தை நீங்கள் விரும்புகிறீர்கள்?',
      'எந்த:ask | நிறத்தை:ground | நீங்கள்:figure | விரும்புகிறீர்கள்:be'),
    'wh-words#7': F(
      'How do you come to school?',
      'How:ask | do | you:figure | come:be | to school:ground',
      'நீங்கள் எப்படி பள்ளிக்கு வருகிறீர்கள்?',
      'நீங்கள்:figure | எப்படி:ask | பள்ளிக்கு:ground | வருகிறீர்கள்:be'),
    'wh-words#8': F(
      'How much is this pen?',
      'How much:ask | is | this:det | pen:ground',
      'இந்த பேனா எவ்வளவு?',
      'இந்த:det | பேனா:ground | எவ்வளவு:ask'),
    'wh-words#9': F(
      'How many apples are there?',
      'How many:ask | apples:ground | are:be | there:qual',
      'அங்கே எத்தனை ஆப்பிள்கள் உள்ளன?',
      'அங்கே:qual | எத்தனை:ask | ஆப்பிள்கள்:ground | உள்ளன:be'),
    'wh-words#10': F(
      'How long will it take?',
      'How long:ask | will | it | take:be',
      'எவ்வளவு நேரம் ஆகும்?',
      'எவ்வளவு நேரம்:ask | ஆகும்:be'),
    'wh-words#11': F(
      'How far is the station?',
      'How far:ask | is | the | station:ground',
      'நிலையம் எவ்வளவு தூரம்?',
      'நிலையம்:ground | எவ்வளவு தூரம்:ask'),
    'wh-words#12': F(
      'How old are you?',
      'How old:ask | are | you:figure',
      'உங்கள் வயது என்ன?',
      'உங்கள்:figure | வயது | என்ன:ask'),
    'wh-words#13': F(
      'How often do you exercise?',
      'How often:ask | do | you:figure | exercise:be',
      'நீங்கள் எவ்வளவு முறை உடற்பயிற்சி செய்கிறீர்கள்?',
      'நீங்கள்:figure | எவ்வளவு முறை:ask | உடற்பயிற்சி செய்கிறீர்கள்:be'),

    /* ---- adjectives ------------------------------------------
       Two shapes. Before a noun the adjective sits in the same place in
       both languages. After "is" it does not: Tamil folds the adjective and
       the verb into one word, so the row's own Tamil word carries both. */
    'adjectives#0': F(
      'This is a big house.',
      'This:figure | is | a:det | big:qual | house:ground',
      'இது ஒரு பெரிய வீடு',
      'இது:figure | ஒரு:det | பெரிய:qual | வீடு:ground'),
    'adjectives#1': F(
      'It is a small cat.',
      'It:figure | is | a:det | small:qual | cat:ground',
      'அது ஒரு சிறிய பூனை',
      'அது:figure | ஒரு:det | சிறிய:qual | பூனை:ground'),
    'adjectives#2': F(
      'He is tall.',
      'He:figure | is:be | tall:qual',
      'அவன் உயரமானவன்.',
      'அவன்:figure | உயரமானவன்:qual:be'),
    'adjectives#3': F(
      'She is short.',
      'She:figure | is:be | short:qual',
      'அவள் குறுகியவள்.',
      'அவள்:figure | குறுகியவள்:qual:be'),
    'adjectives#4': F(
      'I am happy.',
      'I:figure | am:be | happy:qual',
      'நான் மகிழ்ச்சியாக இருக்கிறேன்.',
      'நான்:figure | மகிழ்ச்சியாக:qual | இருக்கிறேன்:be'),
    'adjectives#5': F(
      'He looks sad.',
      'He:figure | looks:be | sad:qual',
      'அவன் சோகமாக தெரிகிறான்',
      'அவன்:figure | சோகமாக:qual | தெரிகிறான்:be'),
    'adjectives#6': F(
      'She is beautiful',
      'She:figure | is:be | beautiful:qual',
      'அவள் அழகானவள்.',
      'அவள்:figure | அழகானவள்:qual:be'),
    'adjectives#7': F(
      'He is a good boy.',
      'He:figure | is | a:det | good:qual | boy:ground',
      'அவன் ஒரு நல்ல பையன்.',
      'அவன்:figure | ஒரு:det | நல்ல:qual | பையன்:ground'),
    'adjectives#8': F(
      'That is a bad idea.',
      'That:figure | is | a:det | bad:qual | idea:ground',
      'அது ஒரு மோசமான யோசனை',
      'அது:figure | ஒரு:det | மோசமான:qual | யோசனை:ground'),
    'adjectives#9': F(
      'He is strong.',
      'He:figure | is:be | strong:qual',
      'அவன் வலிமையானவன்.',
      'அவன்:figure | வலிமையானவன்:qual:be'),
    'adjectives#10': F(
      'She is weak.',
      'She:figure | is:be | weak:qual',
      'அவள் பலவீனமானவள்.',
      'அவள்:figure | பலவீனமானவள்:qual:be'),
    'adjectives#11': F(
      'It is a fast car.',
      'It:figure | is | a:det | fast:qual | car:ground',
      'அது ஒரு வேகமான கார்.',
      'அது:figure | ஒரு:det | வேகமான:qual | கார்:ground'),
    'adjectives#12': F(
      'It is a slow turtle.',
      'It:figure | is | a:det | slow:qual | turtle:ground',
      'அது ஒரு மெதுவான ஆமை.',
      'அது:figure | ஒரு:det | மெதுவான:qual | ஆமை:ground'),
    'adjectives#13': F(
      'He is clever.',
      'He:figure | is | clever:qual',
      'அவன் புத்திசாலி.',
      'அவன்:figure | புத்திசாலி:qual'),
    'adjectives#14': F(
      'She is kind.',
      'She:figure | is:be | kind:qual',
      'அவள் தயாளமானவள்.',
      'அவள்:figure | தயாளமானவள்:qual:be'),
    'adjectives#15': F(
      'He is brave.',
      'He:figure | is:be | brave:qual',
      'அவன் தைரியமானவன்.',
      'அவன்:figure | தைரியமானவன்:qual:be'),
    'adjectives#16': F(
      'She is honest',
      'She:figure | is:be | honest:qual',
      'அவள் நேர்மையானவள்',
      'அவள்:figure | நேர்மையானவள்:qual:be'),

    /* ---- adverbs ---------------------------------------------
       English puts the adverb after the verb, Tamil before it. Every row
       here is the same crossing, which is why the diagram is worth having
       on all of them. */
    'adverbs#0': F(
      'He runs quickly.',
      'He:figure | runs:be | quickly:qual',
      'அவன் விரைவாக ஓடுகிறான்.',
      'அவன்:figure | விரைவாக:qual | ஓடுகிறான்:be'),
    'adverbs#1': F(
      'She speaks slowly.',
      'She:figure | speaks:be | slowly:qual',
      'அவள் மெதுவாக பேசுகிறாள்',
      'அவள்:figure | மெதுவாக:qual | பேசுகிறாள்:be'),
    'adverbs#2': F(
      'He sings loudly.',
      'He:figure | sings:be | loudly:qual',
      'அவன் சத்தமாக பாடுகிறான்.',
      'அவன்:figure | சத்தமாக:qual | பாடுகிறான்:be'),
    'adverbs#3': F(
      'She speaks softly.',
      'She:figure | speaks:be | softly:qual',
      'அவள் மென்மையாக பேசுகிறாள்.',
      'அவள்:figure | மென்மையாக:qual | பேசுகிறாள்:be'),
    'adverbs#4': F(
      'I always help you.',
      'I:figure | always:qual | help:be | you:ground',
      'நான் எப்போதும் உனக்கு உதவுகிறேன்.',
      'நான்:figure | எப்போதும்:qual | உனக்கு:ground | உதவுகிறேன்:be'),
    'adverbs#5': F(
      'I never lie.',
      'I:figure | never:qual | lie:be',
      'நான் ஒருபோதும் பொய் பேசுவதில்லை.',
      'நான்:figure | ஒருபோதும்:qual | பொய் பேசுவதில்லை:be'),
    'adverbs#6': F(
      'We often go there.',
      'We:figure | often:qual | go:be | there:ground',
      'நாங்கள் அடிக்கடி அங்கே செல்கிறோம்.',
      'நாங்கள்:figure | அடிக்கடி:qual | அங்கே:ground | செல்கிறோம்:be'),
    'adverbs#7': F(
      'I sometimes sing.',
      'I:figure | sometimes:qual | sing:be',
      'நான் சில சமயம் பாடுகிறேன்.',
      'நான்:figure | சில சமயம்:qual | பாடுகிறேன்:be'),
    'adverbs#8': F(
      'He usually eats early.',
      'He:figure | usually:qual1 | eats:be | early:qual2',
      'அவன் வழக்கமாக விரைவாக சாப்பிடுகிறான்',
      'அவன்:figure | வழக்கமாக:qual1 | விரைவாக:qual2 | சாப்பிடுகிறான்:be'),
    'adverbs#9': F(
      'I met him yesterday.',
      'I:figure | met:be | him:ground | yesterday:qual',
      'நான் அவனை நேற்று சந்தித்தேன்.',
      'நான்:figure | அவனை:ground | நேற்று:qual | சந்தித்தேன்:be'),
    'adverbs#10': F(
      'I will go today.',
      'I:figure | will go:be | today:qual',
      'நான் இன்று செல்லப் போகிறேன்.',
      'நான்:figure | இன்று:qual | செல்லப் போகிறேன்:be'),
    'adverbs#11': F(
      'We will play tomorrow.',
      'We:figure | will play:be | tomorrow:qual',
      'நாங்கள் நாளை விளையாடுவோம்',
      'நாங்கள்:figure | நாளை:qual | விளையாடுவோம்:be'),
    'adverbs#12': F(
      'He speaks well.',
      'He:figure | speaks:be | well:qual',
      'அவன் நன்றாக பேசுகிறான்.',
      'அவன்:figure | நன்றாக:qual | பேசுகிறான்:be'),
    'adverbs#13': F(
      'She sings badly.',
      'She:figure | sings:be | badly:qual',
      'அவள் மோசமாக பாடுகிறாள்.',
      'அவள்:figure | மோசமாக:qual | பாடுகிறாள்:be'),

    /* ---- conjunctions ----------------------------------------
       The joiner sits between the same two things in both languages. What
       moves is the verb, as always. */
    'conjunctions#0': F(
      'I like tea and coffee.',
      'I:figure | like:be | tea:ground1 | and:join | coffee:ground2',
      'எனக்கு தேனீர் மற்றும் காபி பிடிக்கும்.',
      'எனக்கு:figure | தேனீர்:ground1 | மற்றும்:join | காபி:ground2 | பிடிக்கும்:be'),
    'conjunctions#1': F(
      'She is small but strong.',
      'She:figure | is | small:qual1 | but:join | strong:qual2',
      'அவள் சிறியவள் ஆனால் வலிமையானவள்.',
      'அவள்:figure | சிறியவள்:qual1 | ஆனால்:join | வலிமையானவள்:qual2'),
    'conjunctions#2': F(
      'Do you want tea or coffee?',
      'Do | you:figure | want:be | tea:ground1 | or:join | coffee:ground2',
      'உங்களுக்கு தேனீர் அல்லது காபி வேண்டுமா?',
      'உங்களுக்கு:figure | தேனீர்:ground1 | அல்லது:join | காபி:ground2 | வேண்டுமா:be'),
    'conjunctions#3': F(
      'I came because of you',
      'I:figure | came:be | because of:join | you:ground',
      'நான் வந்தேன் ஏனெனில் நீ தான் அழைத்தாய்.',
      'நான்:figure | வந்தேன்:be | ஏனெனில்:join | நீ தான் அழைத்தாய்:ground'),
    'conjunctions#4': F(
      'I was tired, so I slept',
      'I:figure1 | was tired:be1 | so:join | I:figure2 | slept:be2',
      'நான் களைத்துவிட்டேன், ஆகவே நான் தூங்கினேன்.',
      'நான்:figure1 | களைத்துவிட்டேன்,:be1 | ஆகவே:join | நான்:figure2 | தூங்கினேன்:be2')
  };

  /* ---- pronouns ---------------------------------------------
     The pronouns table is a grid of forms, not a list of sentences, so there
     is nothing in the source to draw. These seven are written here, in the
     same shape as the source's own "அவன் இங்கே நிற்கிறான்", purely so the
     row has a formation to open. They are the only strings in this file not
     taken from the notes.

     One picture, seven times: the pronoun stays put, the verb goes to the
     end, and the Tamil verb changes its ending to agree with it. */
  var HERE = [
    ['I',    'am',  'நான்',      'இருக்கிறேன்'],
    ['We',   'are', 'நாம்',      'இருக்கிறோம்'],
    ['You',  'are', 'நீ',        'இருக்கிறாய்'],
    ['He',   'is',  'அவன்',      'இருக்கிறான்'],
    ['She',  'is',  'அவள்',      'இருக்கிறாள்'],
    ['It',   'is',  'அது',       'இருக்கிறது'],
    ['They', 'are', 'அவர்கள்',   'இருக்கிறார்கள்']
  ];
  var BY_WORD = {};
  HERE.forEach(function (r) {
    BY_WORD[r[0].toLowerCase()] = F(
      r[0] + ' ' + r[1] + ' here.',
      r[0] + ':figure | ' + r[1] + ':be | here:ground',
      r[2] + ' இங்கே ' + r[3] + '.',
      r[2] + ':figure | இங்கே:ground | ' + r[3] + ':be');
  });

  /* ---- from a live scene ------------------------------------
     The table rows need authored alignments because nothing in the source
     says which Tamil word carries "in". A scene sentence needs none: it was
     built slot by slot, so every token already knows its job. Practice draws
     its diagram through here, so there is one formation renderer rather than
     a second copy that drifts.

     The one thing worth stating is the fusion. In English "in" is its own
     word; in Tamil the relation is a case ending on the place, so the Tamil
     token carries both roles and takes two lines. */
  function rolesOf(k, lang) {
    if (k === 'figure') return ['figure'];
    if (k === 'ground') return ['ground'];
    if (k === 'prep')   return lang === 'ta' ? ['rel', 'ground'] : ['rel'];
    if (k === 'det' || k === 'num' || k === 'adj') return ['det'];
    return ['be'];
  }

  function fromScene(state) {
    var s = GV_Scene.sentencePlace(state);
    /* English "the box" is two tokens but one idea. Merging the bare article
       into the ground keeps the two rows aligned one-to-one; left split, the
       article would dangle with no Tamil counterpart and read as a missing
       word rather than a merged one. */
    var en = [], skip = false;
    s.en.forEach(function (p, i) {
      if (skip) { skip = false; return; }
      if (p.t === 'the' && !p.k && s.en[i + 1] && s.en[i + 1].k === 'ground') {
        en.push({ t: 'the ' + s.en[i + 1].t, k: 'ground' }); skip = true; return;
      }
      en.push(p);
    });
    function tok(list, lang) {
      return list.map(function (p) { return { t: p.t, r: rolesOf(p.k, lang) }; });
    }
    return {
      enText: en.map(function (p) { return p.t; }).join(' ') + '.',
      taText: s.ta.map(function (p) { return p.t; }).join(' ') + '.',
      en: tok(en, 'en'),
      ta: tok(s.ta, 'ta')
    };
  }

  /* A row's formation: by table and row first, then by any word in the row
     that has one. The pronouns table is ragged — some rows drop the "Persons"
     cell — so the pronoun is found by looking, not by counting columns. */
  function forRow(tableId, rowIndex, cells) {
    var direct = DATA[tableId + '#' + rowIndex];
    if (direct) return direct;
    for (var i = 0; i < (cells || []).length; i++) {
      var first = String(cells[i] == null ? '' : cells[i]).split('\n')[0].trim().toLowerCase();
      if (BY_WORD[first]) return BY_WORD[first];
    }
    return null;
  }

  window.GV_Formation = { card: card, draw: draw, forRow: forRow, parse: parse, F: F,
                          fromScene: fromScene, rolesOf: rolesOf };
})();
