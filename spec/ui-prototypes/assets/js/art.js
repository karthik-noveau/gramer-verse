/* ============================================================
   art.js — one answer to "does this word have a picture?"

   The drawings live in scene.js and icons-extra.js, split into
   families (prep, pronoun, tense, adv, …). Nothing there says which
   family a bare word belongs to, so every caller used to guess, and
   each guessed slightly differently. This is the single lookup: give
   it a word, get its drawing or an empty string.

   Empty string means empty string. A word with no drawing gets no
   cell, not a letter tile — a big grey "B" is decoration pretending
   to be a picture, and a learner who cannot read Latin gets nothing
   from it.

   In React this becomes common/art/forWord, backed by the same
   family registry.
   ============================================================ */
(function () {
  'use strict';

  /* Family, then the words that family actually draws. Listing the words is
     the point: several family functions fall through to a generic glyph for
     anything handed to them, so asking the family alone would report a
     picture for every word in the source. */
  var FAMILIES = [
    ['prep',    ['in', 'on', 'at', 'under', 'above', 'below', 'behind', 'beside',
                 'between', 'near', 'in front of', 'there', 'here',
                 'before', 'after', 'by', 'since', 'during', 'until', 'till',
                 'until / till',
                 'to', 'into', 'towards', 'along', 'across', 'over', 'past',
                 'from',
                 'about', 'for', 'with', 'as', 'like', 'per']],
    ['thing',   'table box chair ball apple cup cat'.split(' ')],
    ['pronoun', 'I we you he she it they'.split(' ')],
    ['article', 'a an the'.split(' ')],
    ['noun',    'person place thing animal'.split(' ')],
    ['conj',    'and but or because so'.split(' ')],
    ['adv',     ('quickly slowly loudly softly always usually often sometimes ' +
                 'never yesterday today tomorrow well badly').split(' ')],
    ['adj2',    ('big small tall short happy sad beautiful good bad strong ' +
                 'weak fast slow clever kind brave honest').split(' ')],
    ['wh',      ['what', 'when', 'where', 'why', 'who', 'whose', 'which', 'how',
                 'how much', 'how many', 'how long', 'how far', 'how old',
                 'how often']],
    ['verb',    ['be form', 'have form', 'can', 'could', 'will', 'would', 'may',
                 'might', 'must', 'shall', 'should', 'ought to']],
    ['tense',   ['simple present', 'present continuous', 'present perfect',
                 'present perfect continuous', 'simple past', 'past continuous',
                 'past perfect', 'past perfect continuous', 'simple future',
                 'future continuous', 'future perfect',
                 'future perfect continuous']],
    ['sent',    ['positive', 'negative', 'question', 'yes / no question',
                 'imperative', 'exclamatory']]
  ];

  /* "in front of" and "How much" are several words but one entry, so keys are
     always matched whole. */
  var INDEX = {};
  FAMILIES.forEach(function (f) {
    f[1].forEach(function (w) {
      var k = w.toLowerCase();
      if (INDEX[k] === undefined) INDEX[k] = { fam: f[0], v: w };
    });
  });

  /* The family functions are keyed by the value the drawing was written for,
     which is sometimes capitalised ("What", "Simple present"). Keep the
     original casing to call with, and lowercase only to look up. */
  var CASED = {};
  (function () {
    var srcs = [];
    if (window.GV_Examples) {
      Object.keys(GV_Examples.EX).forEach(function (t) {
        GV_Examples.EX[t].forEach(function (e) { srcs.push([e.kind, e.v]); });
      });
    }
    srcs.forEach(function (p) { CASED[String(p[1]).toLowerCase()] = p[1]; });
  })();

  /* The whole cell has to be the word — never its first word. A source row
     carries example sentences as well as the word it teaches, and "I do my
     work" starts with a pronoun; matching loosely put a picture of "I" beside
     the verb "do" on all forty-seven rows of the main-verbs table. A cell is
     the word or it is not. */
  function lookup(word) {
    var raw = String(word == null ? '' : word).split('\n')[0].trim();
    if (!raw) return null;
    var whole = raw.toLowerCase().replace(/[.,!?]+$/, '');
    var hit = INDEX[whole];
    if (!hit) {
      /* the source writes some entries as alternatives in one cell */
      var alt = whole.split('/')[0].trim();
      hit = INDEX[alt];
    }
    if (!hit) return null;
    /* Pronouns are the one place where case is meaning: "I" is a word, "i"
       is not. Prefer the exact source spelling when the family knows it. */
    return { fam: hit.fam, v: CASED[String(hit.v).toLowerCase()] || hit.v, raw: raw };
  }

  function forWord(word, size) {
    var hit = lookup(word);
    if (!hit) return '';
    return GV_Scene.icon(hit.fam, hit.v, { size: size || 40, label: hit.raw }) ||
           GV_Scene.icon(hit.fam, hit.raw, { size: size || 40, label: hit.raw }) || '';
  }

  window.GV_Art = { forWord: forWord, lookup: lookup, INDEX: INDEX };
})();
