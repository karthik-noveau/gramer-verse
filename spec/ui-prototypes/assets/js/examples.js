/* ============================================================
   examples.js — one worked example per item, as a picture.

   A learner with no English cannot be told what "we" means; they
   have to see two people. Every entry here is an icon plus one
   short sentence in both languages, so the word is learned from
   the picture rather than from a definition.

   Grouped by topic so a topic page can render its own set.
   In React this becomes content JSON read through common/api.
   ============================================================ */
(function () {
  'use strict';

  var EX = {


    /* ---- 1. tenses ----------------------------------------- */
    tenses: [
      { kind:'tense', v:'Simple present',   en:'Simple present',   ta:'எளிய நிகழ்காலம்',
        s:'I write.',                       st:'நான் எழுதுகிறேன்.' },
      { kind:'tense', v:'Present continuous', en:'Present continuous', ta:'நிகழ் தொடர்',
        s:'I am writing.',                  st:'நான் எழுதிக்கொண்டிருக்கிறேன்.' },
      { kind:'tense', v:'Present perfect',  en:'Present perfect',  ta:'நிகழ் நிறைவு',
        s:'I have written.',                st:'நான் எழுதிவிட்டேன்.' },
      { kind:'tense', v:'Present perfect continuous', en:'Present perfect continuous', ta:'நிகழ் நிறைவுத் தொடர்',
        s:'I have been writing for an hour.', st:'நான் ஒரு மணி நேரமாக எழுதி வருகிறேன்.' },
      { kind:'tense', v:'Simple past',      en:'Simple past',      ta:'எளிய இறந்தகாலம்',
        s:'I wrote.',                       st:'நான் எழுதினேன்.' },
      { kind:'tense', v:'Past continuous',  en:'Past continuous',  ta:'இறந்தகாலத் தொடர்',
        s:'I was writing.',                 st:'நான் எழுதிக்கொண்டிருந்தேன்.' },
      { kind:'tense', v:'Past perfect',     en:'Past perfect',     ta:'முற்பட்ட இறந்தகாலம்',
        s:'I had written.',                 st:'நான் எழுதி முடித்திருந்தேன்.' },
      { kind:'tense', v:'Past perfect continuous', en:'Past perfect continuous', ta:'முற்பட்ட தொடர்',
        s:'I had been writing for an hour.', st:'நான் ஒரு மணி நேரமாக எழுதி வந்தேன்.' },
      { kind:'tense', v:'Simple future',    en:'Simple future',    ta:'எளிய எதிர்காலம்',
        s:'I will write.',                  st:'நான் எழுதுவேன்.' },
      { kind:'tense', v:'Future continuous',en:'Future continuous',ta:'எதிர்காலத் தொடர்',
        s:'I will be writing.',             st:'நான் எழுதிக்கொண்டிருப்பேன்.' },
      { kind:'tense', v:'Future perfect',   en:'Future perfect',   ta:'எதிர்கால நிறைவு',
        s:'I will have written.',           st:'நான் எழுதி முடித்திருப்பேன்.' },
      { kind:'tense', v:'Future perfect continuous', en:'Future perfect continuous', ta:'எதிர்கால நிறைவுத் தொடர்',
        s:'I will have been writing for an hour.', st:'நான் ஒரு மணி நேரமாக எழுதி வந்திருப்பேன்.' }
    ],

    /* ---- 2. verbs ------------------------------------------ */
    verbs: [
      { kind:'verb', v:'Be form',  en:'be',   ta:'இரு',  note:'am, is, are',
        s:'I am a writer.',        st:'நான் ஒரு எழுத்தாளன்.' },
      { kind:'verb', v:'Have form',en:'have', ta:'உள்ளது', note:'have, has, had',
        s:'I have a pen.',         st:'என்னிடம் ஒரு பேனா உள்ளது.' },
      { kind:'verb', v:'can',   en:'can',   ta:'முடியும்',       note:'able to',
        s:'I can write.',          st:'நான் எழுத முடியும்.' },
      { kind:'verb', v:'could', en:'could', ta:'முடிந்தது',      note:'was able to',
        s:'I could go.',           st:'நான் போக முடிந்தது.' },
      { kind:'verb', v:'will',  en:'will',  ta:'எதிர்காலம்',      note:'it will happen',
        s:'I will write.',         st:'நான் எழுதுவேன்.' },
      { kind:'verb', v:'would', en:'would', ta:'கற்பனை',         note:'imagined, not real yet',
        s:'I would like tea.',     st:'நான் தேநீர் விரும்புவேன்.' },
      { kind:'verb', v:'may',   en:'may',   ta:'வாய்ப்பு உண்டு',   note:'quite possible',
        s:'I may come.',           st:'நான் வர வாய்ப்பு உள்ளது.' },
      { kind:'verb', v:'might', en:'might', ta:'வாய்ப்பு குறைவு',  note:'less likely than may',
        s:'It might rain today.',  st:'இன்று மழை பெய்யலாம்.' },
      { kind:'verb', v:'must',  en:'must',  ta:'கட்டாயம்',        note:'no choice',
        s:'You must come.',        st:'நீ வர வேண்டும்.' },
      { kind:'verb', v:'shall', en:'shall', ta:'செய்வேன்',        note:'polite future',
        s:'I shall help you.',     st:'நான் உங்களுக்கு உதவுவேன்.' },
      { kind:'verb', v:'should',en:'should',ta:'செய்ய வேண்டும்',   note:'advice',
        s:'You should study.',     st:'நீ படிக்க வேண்டும்.' },
      { kind:'verb', v:'ought to', en:'ought to', ta:'ஒழுக்கமாக',  note:'the right thing to do',
        s:'You ought to help.',    st:'நீ உதவ வேண்டும்.' }
    ],

    /* ---- 6. WH words --------------------------------------- */
    'wh-words': [
      { kind:'wh', v:'What',  en:'what',  ta:'என்ன',    s:'What is your name?',        st:'உங்கள் பெயர் என்ன?' },
      { kind:'wh', v:'When',  en:'when',  ta:'எப்போது',  s:'When is your birthday?',    st:'உங்கள் பிறந்தநாள் எப்போது?' },
      { kind:'wh', v:'Where', en:'where', ta:'எங்கே',    s:'Where is the bus stop?',    st:'பேருந்து நிறுத்தம் எங்கே?' },
      { kind:'wh', v:'Why',   en:'why',   ta:'ஏன்',      s:'Why are you sad?',          st:'நீ ஏன் சோகமாக இருக்கிறாய்?' },
      { kind:'wh', v:'Who',   en:'who',   ta:'யார்',     s:'Who is calling?',           st:'யார் அழைக்கிறார்?' },
      { kind:'wh', v:'Whose', en:'whose', ta:'யாருடைய',  s:'Whose book is this?',       st:'இது யாருடைய புத்தகம்?' },
      { kind:'wh', v:'Which', en:'which', ta:'எது',      s:'Which colour do you like?', st:'எந்த நிறம் பிடிக்கும்?' },
      { kind:'wh', v:'How',   en:'how',   ta:'எப்படி',    s:'How do you come to school?',st:'எப்படி பள்ளிக்கு வருகிறாய்?' },
      { kind:'wh', v:'How much', en:'how much', ta:'எவ்வளவு', s:'How much is this pen?', st:'இந்த பேனா எவ்வளவு?' },
      { kind:'wh', v:'How many', en:'how many', ta:'எத்தனை',  s:'How many apples are there?', st:'எத்தனை ஆப்பிள்கள்?' },
      { kind:'wh', v:'How long', en:'how long', ta:'எவ்வளவு நேரம்', s:'How long will it take?', st:'எவ்வளவு நேரம் ஆகும்?' },
      { kind:'wh', v:'How far',  en:'how far',  ta:'எவ்வளவு தூரம்', s:'How far is the station?', st:'நிலையம் எவ்வளவு தூரம்?' },
      { kind:'wh', v:'How old',  en:'how old',  ta:'வயது என்ன',   s:'How old are you?',   st:'உங்கள் வயது என்ன?' },
      { kind:'wh', v:'How often',en:'how often',ta:'எத்தனை முறை',  s:'How often do you exercise?', st:'எத்தனை முறை உடற்பயிற்சி செய்கிறாய்?' }
    ],

    /* ---- 7. adjectives ------------------------------------- */
    adjectives: [
      { kind:'adj2', v:'big',   en:'big',   ta:'பெரிய',      s:'This is a big house.', st:'இது ஒரு பெரிய வீடு.' },
      { kind:'adj2', v:'small', en:'small', ta:'சிறிய',      s:'It is a small cat.',   st:'அது ஒரு சிறிய பூனை.' },
      { kind:'adj2', v:'tall',  en:'tall',  ta:'உயரமான',     s:'He is tall.',          st:'அவன் உயரமானவன்.' },
      { kind:'adj2', v:'short', en:'short', ta:'குட்டையான',   s:'She is short.',        st:'அவள் குட்டையானவள்.' },
      { kind:'adj2', v:'happy', en:'happy', ta:'மகிழ்ச்சியான', s:'I am happy.',          st:'நான் மகிழ்ச்சியாக இருக்கிறேன்.' },
      { kind:'adj2', v:'sad',   en:'sad',   ta:'சோகமான',     s:'He looks sad.',        st:'அவன் சோகமாகத் தெரிகிறான்.' },
      { kind:'adj2', v:'beautiful', en:'beautiful', ta:'அழகான', s:'She is beautiful.', st:'அவள் அழகானவள்.' },
      { kind:'adj2', v:'good',  en:'good',  ta:'நல்ல',       s:'He is a good boy.',    st:'அவன் ஒரு நல்ல பையன்.' },
      { kind:'adj2', v:'bad',   en:'bad',   ta:'மோசமான',     s:'That is a bad idea.',  st:'அது ஒரு மோசமான யோசனை.' },
      { kind:'adj2', v:'strong',en:'strong',ta:'வலிமையான',   s:'He is strong.',        st:'அவன் வலிமையானவன்.' },
      { kind:'adj2', v:'weak',  en:'weak',  ta:'பலவீனமான',   s:'She is weak.',         st:'அவள் பலவீனமானவள்.' },
      { kind:'adj2', v:'fast',  en:'fast',  ta:'வேகமான',     s:'It is a fast car.',    st:'அது ஒரு வேகமான கார்.' },
      { kind:'adj2', v:'slow',  en:'slow',  ta:'மெதுவான',    s:'It is a slow turtle.', st:'அது ஒரு மெதுவான ஆமை.' },
      { kind:'adj2', v:'clever',en:'clever',ta:'புத்திசாலி',  s:'He is clever.',        st:'அவன் புத்திசாலி.' },
      { kind:'adj2', v:'kind',  en:'kind',  ta:'கருணையான',   s:'She is kind.',         st:'அவள் கருணையானவள்.' },
      { kind:'adj2', v:'brave', en:'brave', ta:'தைரியமான',   s:'He is brave.',         st:'அவன் தைரியமானவன்.' },
      { kind:'adj2', v:'honest',en:'honest',ta:'நேர்மையான',  s:'She is honest.',       st:'அவள் நேர்மையானவள்.' }
    ],

    /* ---- 8. adverbs ---------------------------------------- */
    adverbs: [
      { kind:'adv', v:'quickly', en:'quickly', ta:'விரைவாக',  s:'He runs quickly.',   st:'அவன் விரைவாக ஓடுகிறான்.' },
      { kind:'adv', v:'slowly',  en:'slowly',  ta:'மெதுவாக',  s:'She speaks slowly.', st:'அவள் மெதுவாக பேசுகிறாள்.' },
      { kind:'adv', v:'loudly',  en:'loudly',  ta:'சத்தமாக',  s:'He sings loudly.',   st:'அவன் சத்தமாக பாடுகிறான்.' },
      { kind:'adv', v:'softly',  en:'softly',  ta:'மென்மையாக', s:'She speaks softly.', st:'அவள் மென்மையாக பேசுகிறாள்.' },
      { kind:'adv', v:'always',  en:'always',  ta:'எப்போதும்', s:'I always help you.', st:'நான் எப்போதும் உனக்கு உதவுகிறேன்.' },
      { kind:'adv', v:'usually', en:'usually', ta:'வழக்கமாக',  s:'He usually eats early.', st:'அவன் வழக்கமாக சீக்கிரம் சாப்பிடுகிறான்.' },
      { kind:'adv', v:'often',   en:'often',   ta:'அடிக்கடி',  s:'We often go there.', st:'நாங்கள் அடிக்கடி அங்கே செல்கிறோம்.' },
      { kind:'adv', v:'sometimes', en:'sometimes', ta:'சில சமயம்', s:'I sometimes sing.', st:'நான் சில சமயம் பாடுகிறேன்.' },
      { kind:'adv', v:'never',   en:'never',   ta:'ஒருபோதும் இல்லை', s:'I never lie.', st:'நான் ஒருபோதும் பொய் சொல்வதில்லை.' },
      { kind:'adv', v:'yesterday', en:'yesterday', ta:'நேற்று', s:'I met him yesterday.', st:'நான் அவனை நேற்று சந்தித்தேன்.' },
      { kind:'adv', v:'today',   en:'today',   ta:'இன்று',    s:'I will go today.',   st:'நான் இன்று செல்வேன்.' },
      { kind:'adv', v:'tomorrow',en:'tomorrow',ta:'நாளை',     s:'We will play tomorrow.', st:'நாங்கள் நாளை விளையாடுவோம்.' },
      { kind:'adv', v:'well',    en:'well',    ta:'நன்றாக',   s:'He speaks well.',    st:'அவன் நன்றாக பேசுகிறான்.' },
      { kind:'adv', v:'badly',   en:'badly',   ta:'மோசமாக',   s:'She sings badly.',   st:'அவள் மோசமாக பாடுகிறாள்.' }
    ],

    /* ---- 9. conjunctions ----------------------------------- */
    conjunctions: [
      { kind:'conj', v:'and',     en:'and',     ta:'மற்றும்',  note:'both of them',
        s:'I like tea and coffee.',        st:'எனக்கு தேனீர் மற்றும் காபி பிடிக்கும்.' },
      { kind:'conj', v:'but',     en:'but',     ta:'ஆனால்',   note:'the opposite follows',
        s:'She is small but strong.',      st:'அவள் சிறியவள் ஆனால் வலிமையானவள்.' },
      { kind:'conj', v:'or',      en:'or',      ta:'அல்லது',  note:'one, not both',
        s:'Do you want tea or coffee?',    st:'உங்களுக்கு தேனீர் அல்லது காபி வேண்டுமா?' },
      { kind:'conj', v:'because', en:'because', ta:'ஏனெனில்', note:'the cause comes after',
        s:'I came because of you.',        st:'நான் வந்தேன் ஏனெனில் நீ தான் அழைத்தாய்.' },
      { kind:'conj', v:'so',      en:'so',      ta:'ஆகவே',    note:'the result comes after',
        s:'I was tired, so I slept.',      st:'நான் களைத்துவிட்டேன், ஆகவே நான் தூங்கினேன்.' }
    ],

    /* ---- 10. sentence formation ---------------------------- */
    sentences: [
      { kind:'sent', v:'Positive',  en:'positive',  ta:'உடன்பாடு', note:'it happens',
        s:'I play cricket.',        st:'நான் கிரிக்கெட் விளையாடுகிறேன்.' },
      { kind:'sent', v:'Negative',  en:'negative',  ta:'எதிர்மறை', note:'it does not happen',
        s:'I do not play cricket.', st:'நான் கிரிக்கெட் விளையாடுவதில்லை.' },
      { kind:'sent', v:'Question',  en:'question',  ta:'வினா',    note:'asks with a WH word',
        s:'Where do you play cricket?', st:'நீ எங்கே கிரிக்கெட் விளையாடுகிறாய்?' },
      { kind:'sent', v:'Yes / No question', en:'yes / no question', ta:'ஆம் / இல்லை',
        note:'answer is yes or no',
        s:'Do you play cricket?',   st:'நீ கிரிக்கெட் விளையாடுகிறாயா?' },
      { kind:'sent', v:'Imperative',en:'imperative',ta:'கட்டளை',  note:'an order or a request',
        s:'Close the door.',        st:'கதவை மூடு.' },
      { kind:'sent', v:'Exclamatory', en:'exclamatory', ta:'வியப்பு', note:'a feeling',
        s:'What a beautiful place!',st:'என்ன ஒரு அழகான இடம்!' }
    ],

    /* ---- 3. nouns & pronouns ------------------------------- */
    nouns: [
      { kind:'noun', v:'person', en:'person', ta:'நபர்',
        s:'Ravi is a student.',    st:'ரவி ஒரு மாணவர்.' },
      { kind:'noun', v:'place',  en:'place',  ta:'இடம்',
        s:'Chennai is big.',       st:'சென்னை பெரியது.' },
      { kind:'noun', v:'thing',  en:'thing',  ta:'பொருள்',
        s:'This is a ball.',       st:'இது ஒரு பந்து.' },
      { kind:'noun', v:'animal', en:'animal', ta:'விலங்கு',
        s:'The cat is sleeping.',  st:'பூனை தூங்குகிறது.' },

      { kind:'pronoun', v:'I',    en:'I',    ta:'நான்',      note:'one person — me',
        s:'I am a student.',       st:'நான் ஒரு மாணவன்.' },
      { kind:'pronoun', v:'we',   en:'we',   ta:'நாங்கள்',   note:'more than one, with me',
        s:'We are students.',      st:'நாங்கள் மாணவர்கள்.' },
      { kind:'pronoun', v:'you',  en:'you',  ta:'நீ / நீங்கள்', note:'the one I am talking to',
        s:'You are a student.',    st:'நீ ஒரு மாணவன்.' },
      { kind:'pronoun', v:'he',   en:'he',   ta:'அவன்',      note:'one man',
        s:'He is a student.',      st:'அவன் ஒரு மாணவன்.' },
      { kind:'pronoun', v:'she',  en:'she',  ta:'அவள்',      note:'one woman',
        s:'She is a student.',     st:'அவள் ஒரு மாணவி.' },
      { kind:'pronoun', v:'it',   en:'it',   ta:'அது',       note:'a thing, not a person',
        s:'It is big.',            st:'அது பெரியது.' },
      { kind:'pronoun', v:'they', en:'they', ta:'அவர்கள்',   note:'more than one, not me',
        s:'They are students.',    st:'அவர்கள் மாணவர்கள்.' }
    ],

    /* ---- 4. articles --------------------------------------- */
    articles: [
      { kind:'article', v:'a',   en:'a',   ta:'ஒரு',  note:'any one — you do not know which',
        s:'I saw a dog.',          st:'நான் ஒரு நாய் பார்த்தேன்.' },
      { kind:'article', v:'an',  en:'an',  ta:'ஒரு',  note:'same as a, before a vowel sound',
        s:'She eats an apple.',    st:'அவள் ஒரு ஆப்பிள் சாப்பிடுகிறாள்.' },
      { kind:'article', v:'the', en:'the', ta:'அந்த', note:'that one — we both know which',
        s:'The dog is black.',     st:'அந்த நாய் கருப்பு.' }
    ],

    /* ---- 5. prepositions, on the table and the box --------- */
    prepositions: [
      { kind:'prep', v:'in',     en:'in',     ta:'உள்ளே',    ground:'box',
        s:'The ball is in the box.',     st:'பந்து பெட்டியில் உள்ளது.' },
      { kind:'prep', v:'on',     en:'on',     ta:'மீது',     ground:'table',
        s:'The ball is on the table.',   st:'பந்து மேசையின் மீது உள்ளது.' },
      { kind:'prep', v:'under',  en:'under',  ta:'கீழே',     ground:'table',
        s:'The cat is under the table.', st:'பூனை மேசைக்கு கீழே உள்ளது.' },
      { kind:'prep', v:'above',  en:'above',  ta:'மேலே',     ground:'table',
        s:'The clock is above the table.', st:'கடிகாரம் மேசைக்கு மேலே உள்ளது.' },
      { kind:'prep', v:'behind', en:'behind', ta:'பின்னால்', ground:'box',
        s:'The ball is behind the box.', st:'பந்து பெட்டிக்கு பின்னால் உள்ளது.' },
      { kind:'prep', v:'beside', en:'beside', ta:'அருகில்',  ground:'box',
        s:'The ball is beside the box.', st:'பந்து பெட்டிக்கு அருகில் உள்ளது.' }
    ]
  };

  /* Tenses and sentence types are named with translated grammar jargon
     ("எளிய நிகழ்காலம்"), which teaches nobody anything. Their Tamil label is
     dropped; the Tamil example sentence stays, because that carries real
     meaning. Vocabulary topics keep their Tamil, which is the word's meaning
     straight from the source. */
  var TERMS_ONLY = { tenses: 1, sentences: 1 };

  /* One card: the picture first, the words under it. */
  function card(e, step, topicId) {
    step = step || 4;
    var jargon = TERMS_ONLY[topicId];
    return '<div class="excard">' +
      '<div class="ex-art">' + GV_Scene.icon(e.kind, e.v, { size: 64, label: e.en }) + '</div>' +
      (jargon ? '<div class="ex-word ex-word--en">' + e.en + '</div>'
              : '<div class="ex-word" lang="ta">' + e.ta + '</div>') +
      (step >= 3 && GV_Scene.canTranslit(e.en)
        ? '<div class="ex-tr" lang="ta">' +
            String(e.en).split(' ').map(GV_Scene.translit).join(' ') + '</div>' : '') +
      (step >= 4 && !jargon ? '<div class="ex-en">' + e.en + '</div>' : '') +
      (e.note && step >= 4 ? '<div class="ex-note">' + e.note + '</div>' : '') +
      '<div class="ex-sent">' +
        '<span lang="ta">' + e.st + '</span>' +
        (step >= 4 ? '<span class="ex-sent-en">' + e.s + '</span>' : '') +
      '</div>' +
    '</div>';
  }

  function render(topicId, step) {
    var list = EX[topicId];
    if (!list) return '';
    return '<div class="exgrid">' +
      list.map(function (e) { return card(e, step, topicId); }).join('') + '</div>';
  }

  window.GV_Examples = { EX: EX, card: card, render: render, has: function (id) { return !!EX[id]; } };
})();
