import {
  findLesson,
  findTopic,
  formationFor,
  lessonsOfTopic,
  loadContent,
  loadTopics,
} from 'common/api/content.api';
import { loadLexicon } from 'common/api/props.api';
import { TAMIL_CASES } from 'common/api/validate';
import { ACTOR_VERBS, actorDraws, verbFor } from 'common/scene/renderers/actor.renderer';
import { buildSentence, sentenceText } from 'common/scene/sentence';

/* The real content, loaded and validated the way the app loads it. If the
   seed content is broken, this is where it is found — not on the page. */

describe('the shipped content', () => {
  it('loads all ten topics, in order', async () => {
    const topics = await loadTopics();

    expect(topics).toHaveLength(10);
    expect(topics.map((t) => t.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('gives every topic both languages', async () => {
    const topics = await loadTopics();

    for (const topic of topics) {
      expect(String(topic.title.en).trim().length).toBeGreaterThan(0);
      expect(String(topic.title.ta).trim().length).toBeGreaterThan(0);
      expect(String(topic.summary.ta).trim().length).toBeGreaterThan(0);
    }
  });

  it('loads and validates the thirteen place lessons', async () => {
    const { lessons } = await loadContent();

    expect(lessons).toHaveLength(13);
    expect(lessons.map((l) => l.title.en)).toEqual([
      'in', 'on', 'at', 'under', 'above', 'below', 'behind',
      'in front of', 'between', 'near', 'beside', 'here', 'there',
    ]);
  });

  it('points every lesson at a topic that exists, and lists it there', async () => {
    const { topics, lessons } = await loadContent();
    const prepositions = findTopic(topics, 'prepositions');

    expect(prepositions).toBeDefined();
    expect(prepositions?.lessonIds).toHaveLength(13);
    for (const lesson of lessons) {
      expect(findTopic(topics, String(lesson.topicId))).toBeDefined();
      expect(prepositions?.lessonIds.map(String)).toContain(String(lesson.id));
    }
  });

  it('draws every lesson from props that exist', async () => {
    const { lessons, lexicon } = await loadContent();

    for (const lesson of lessons) {
      if (lesson.scene.kind !== 'place') continue;
      expect(lexicon.propIds.has(String(lesson.scene.figure))).toBe(true);
      if (lesson.scene.ground) expect(lexicon.propIds.has(String(lesson.scene.ground))).toBe(true);
      if (lesson.scene.ground2) expect(lexicon.propIds.has(String(lesson.scene.ground2))).toBe(true);
    }
  });

  it('gives every lesson a Tamil sentence template that reads its noun in a case', async () => {
    const { lessons } = await loadContent();

    for (const lesson of lessons) {
      expect(lesson.sentence.en.length).toBeGreaterThan(0);
      expect(lesson.sentence.ta.length).toBeGreaterThan(0);

      /* A Tamil noun slot names the case it wants; the English line has no
         cases to name, which is the whole reason the two are separate. */
      for (const slot of lesson.sentence.ta) {
        if (!('case' in slot) || slot.case === undefined) continue;
        expect(TAMIL_CASES).toContain(slot.case);
      }
      const grounds = lesson.sentence.ta.filter((slot) => slot.slot === 'ground');
      for (const ground of grounds) {
        expect('case' in ground && ground.case !== undefined).toBe(true);
      }
    }
  });

  it('declines every prop in all five cases', async () => {
    const { props } = await loadLexicon();

    expect(props.length).toBeGreaterThanOrEqual(16);
    for (const prop of props) {
      for (const grammaticalCase of TAMIL_CASES) {
        expect(prop.word.ta[grammaticalCase].trim().length).toBeGreaterThan(0);
      }
      expect(prop.word.en.singular.length).toBeGreaterThan(0);
      expect(prop.word.en.plural.length).toBeGreaterThan(0);
    }
  });

  it('gives every drawable verb one of the four anchors, and every other one none', async () => {
    /* Which props actually carry which anchor is the scene library's business,
       and props.test.ts checks it there. Here it is only that the verb names
       an anchor that exists at all. */
    const { verbs } = await loadLexicon();
    const anchors = new Set(['mouth', 'hand', 'foot', 'eye']);

    expect(verbs.length).toBeGreaterThan(0);
    for (const verb of verbs) {
      expect(verb.anchor === null ? null : anchors.has(verb.anchor)).toBe(
        verb.drawable ? true : null,
      );
    }
  });

  /* The lexicon and the renderer describe the same verbs from two sides: the
     words are in `content/`, which the scene engine may not read, and the
     drawing is in the renderer, which content may not carry — a function does
     not live in JSON. Two files describing one verb is two verbs waiting to
     disagree, so they are held to each other here, in the one module allowed
     to see both. */
  it('says the same thing about a verb in the lexicon and in the renderer', async () => {
    const { verbs } = await loadLexicon();
    const drawable = verbs.filter((verb) => verb.drawable);

    expect(drawable.length).toBeGreaterThan(0);
    for (const verb of verbs) {
      const drawn = verbFor(verb.id);

      expect(actorDraws(verb.id)).toBe(verb.drawable);
      if (!verb.drawable) continue;

      expect(drawn?.anchor).toBe(verb.anchor);
      expect(drawn?.cue).toBe(verb.cue);
      expect(drawn?.transitive).toBe(verb.transitive);
      /* And the words, which the sentence builder puts on the page: two files
         holding one verb's forms is two verbs waiting to disagree. */
      expect(drawn?.word.en).toEqual(verb.en);
      expect(drawn?.word.ta.root).toBe(verb.ta);
    }
  });

  it('draws no verb the lexicon has never heard of', async () => {
    const { verbIds } = await loadLexicon();

    for (const drawn of Object.keys(ACTOR_VERBS)) {
      expect(verbIds.has(drawn)).toBe(true);
    }
  });

  /* The sentence builder and the content meet here, and nowhere else: the
     builder lives in the scene engine and may not read `content/`, so this is
     the only place the shipped lessons can be read out loud. Written out in
     full rather than snapshotted — a snapshot that changes is re-recorded
     without being read, and these are sentences a learner sees. */
  describe('the sentences the shipped lessons build', () => {
    const SAID: Readonly<Record<string, readonly [string, string]>> = {
      'prep-place-in': ['The ball is in the box', 'பந்து பெட்டியில் உள்ளது'],
      'prep-place-on': ['The book is on the table', 'புத்தகம் மேசையில் உள்ளது'],
      'prep-place-at': ['The woman is at the shop', 'பெண் கடையில் உள்ளது'],
      'prep-place-under': ['The cat is under the table', 'பூனை மேசைக்கு கீழ் உள்ளது'],
      'prep-place-above': ['The clock is above the door', 'கடிகாரம் கதவுக்கு மேலே உள்ளது'],
      'prep-place-below': ['The ball is below the table', 'பந்து மேசைக்கு கீழே உள்ளது'],
      'prep-place-behind': ['The dog is behind the car', 'நாய் காருக்கு பின்னால் உள்ளது'],
      'prep-place-in-front-of': ['The man is in front of the shop', 'மனிதன் கடைக்கு முன்னால் உள்ளது'],
      'prep-place-between': [
        'The ball is between the box and the chair',
        'பந்து பெட்டி மற்றும் நாற்காலிக்கு இடையில் உள்ளது',
      ],
      'prep-place-near': ['The cat is near the tree', 'பூனை மரத்திற்கு அருகில் உள்ளது'],
      'prep-place-beside': ['The chair is beside the table', 'நாற்காலி மேசைக்கு பக்கத்தில் உள்ளது'],
      'prep-place-here': ['The man is here', 'மனிதன் இங்கே உள்ளது'],
      'prep-place-there': ['The man is there', 'மனிதன் அங்கே உள்ளது'],
    };

    it('says each of the thirteen place lessons, in both languages', async () => {
      const { lessons } = await loadContent();

      expect(lessons.length).toBeGreaterThanOrEqual(13);
      for (const lesson of lessons) {
        const said = SAID[String(lesson.id)];
        if (!said) continue;

        const built = buildSentence(lesson.scene, lesson.sentence);
        expect([String(lesson.id), sentenceText(built.en), sentenceText(built.ta)]).toEqual([
          String(lesson.id),
          said[0],
          said[1],
        ]);
      }
    });

    it('leaves no lesson without both lines', async () => {
      const { lessons } = await loadContent();

      for (const lesson of lessons) {
        const built = buildSentence(lesson.scene, lesson.sentence);

        expect(sentenceText(built.en).length).toBeGreaterThan(0);
        expect(sentenceText(built.ta).length).toBeGreaterThan(0);
        /* No English left in the Tamil line: a template that reached for a
           word the builder had only in English would show it here. */
        expect(sentenceText(built.ta)).not.toMatch(/[A-Za-z]/);
      }
    });

    it('never writes the Tamil postposition twice', async () => {
      /* The lessons were authored before this builder existed and carried the
         postposition themselves, so every one of them said "மேசைக்கு கீழ் கீழே".
         The ending and the word after it belong to the relation now. */
      const { lessons } = await loadContent();

      for (const lesson of lessons) {
        const words = sentenceText(buildSentence(lesson.scene, lesson.sentence).ta).split(' ');

        expect(new Set(words).size).toBe(words.length);
      }
    });
  });

  /* The alignments are authored per row because nothing in the source says
     which Tamil word carries `in`. What can be checked is that each one is
     keyed to a row that exists and quotes that row's own sentences — a diagram
     of a sentence the table does not contain is a diagram of nothing. */
  describe('the word-order alignments', () => {
    /** The source's group headings are not sentences and are not numbered:
        the renderer splits on them, so counting them would put every alignment
        on the wrong row. */
    const isHeading = (row: readonly string[]): boolean =>
      row.length > 0 && (row[0] ?? '').trim() !== '' && row.slice(1).every((c) => c.trim() === '');

    const flat = (value: string): string => value.replace(/\s+/g, ' ').trim();

    it('keys every alignment to a row that exists', async () => {
      const { curriculum } = await loadContent();
      const tables = new Map(curriculum.tables.map((table) => [table.id, table]));

      expect(Object.keys(curriculum.formation.rows).length).toBeGreaterThanOrEqual(100);
      for (const key of Object.keys(curriculum.formation.rows)) {
        const [id = '', index = ''] = key.split('#');
        const table = tables.get(id);

        expect([key, table !== undefined]).toEqual([key, true]);
        const rows = (table?.rows ?? []).filter((row) => !isHeading(row));
        expect([key, rows[Number(index)] !== undefined]).toEqual([key, true]);
      }
    });

    it('quotes that row’s own sentences, in both languages', async () => {
      const { curriculum } = await loadContent();
      const tables = new Map(curriculum.tables.map((table) => [table.id, table]));

      for (const [key, spec] of Object.entries(curriculum.formation.rows)) {
        const [id = '', index = ''] = key.split('#');
        const rows = (tables.get(id)?.rows ?? []).filter((row) => !isHeading(row));
        const cells = flat((rows[Number(index)] ?? []).join(' | '));

        expect([key, cells.includes(flat(spec.en))]).toEqual([key, true]);
        expect([key, cells.includes(flat(spec.ta))]).toEqual([key, true]);
      }
    });

    it('leaves the verb-form tables alone, because they hold no sentences', async () => {
      /* A diagram aligns one sentence to another, and there is nothing to
         align until example sentences are written for these. */
      const { curriculum } = await loadContent();
      const keys = Object.keys(curriculum.formation.rows);

      expect(keys.some((key) => key.startsWith('main-verbs#'))).toBe(false);
      expect(keys.some((key) => key.startsWith('auxiliary#'))).toBe(false);
    });

    it('finds a pronoun row by its word, because that table is ragged', async () => {
      const { curriculum } = await loadContent();

      expect(formationFor(curriculum, 'pronouns', 0, ['First Person', 'singular', 'I'])).toBeDefined();
      expect(formationFor(curriculum, 'pronouns', 99, ['', '', 'He'])).toBeDefined();
    });

    it('finds nothing for a row nobody aligned', async () => {
      const { curriculum } = await loadContent();

      expect(formationFor(curriculum, 'main-verbs', 0, ['do', 'does'])).toBeUndefined();
    });
  });

  describe('finders', () => {
    it('finds a topic and a lesson by id, and nothing by a wrong one', async () => {
      const { topics, lessons } = await loadContent();

      expect(findTopic(topics, 'prepositions')?.order).toBe(5);
      expect(findTopic(topics, 'punctuation')).toBeUndefined();
      expect(findLesson(lessons, 'prep-place-in')?.title.en).toBe('in');
      expect(findLesson(lessons, 'prep-place-astride')).toBeUndefined();
    });

    it('returns a topic’s lessons in their authored order', async () => {
      const { lessons } = await loadContent();
      const ofTopic = lessonsOfTopic(lessons, 'prepositions');

      expect(ofTopic.map((l) => l.order)).toEqual([...ofTopic.map((l) => l.order)].sort((a, b) => a - b));
      expect(lessonsOfTopic(lessons, 'tenses')).toHaveLength(0);
    });
  });
});
