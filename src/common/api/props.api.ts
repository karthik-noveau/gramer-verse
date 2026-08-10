import { validateProps, validateVerbs } from 'common/api/validate';
import type { ActorCue, AnchorName, PropId, PropWord, VerbId } from 'common/scene/types';


/* ============================================================
   props.api.ts — the lexicon: what can be drawn, and what each
   thing is called in both languages.

   The JSON carries the words and nothing else. The drawing and
   its geometry live in common/scene/props, which is where the
   box a prop is drawn in belongs; the id list here is what
   validation checks a lesson's props against.
   ============================================================ */

/**
 * What the *content* layer knows about a prop: its id and its words.
 *
 * Not its geometry. A prop's box, surface, anchors and drawing belong to
 * `common/scene/props`, where the drawing is — two files describing the same
 * box is two boxes waiting to disagree, and they already had: this file said
 * the ball was 64 wide while the drawing made it 74. The words are here
 * because validation needs them and the scene engine may not import from
 * `common/api`; a test asserts the two lists say the same thing.
 */
export type PropData = {
  readonly id: PropId;
  readonly word: PropWord;
};

/**
 * What the content layer knows about a verb.
 *
 * `drawable` is the answer to open question 2 in `architecture.md`: the source
 * notes list 47 main verbs and only ten of them are an action a picture can
 * show. The rest are carried here with their words and marked undrawable, so a
 * lesson naming one is refused by name rather than given a generic animation —
 * see `content/README.md`.
 *
 * An undrawable verb has no anchor and no cue: those are facts about a drawing
 * that does not exist.
 */
export type VerbData = {
  readonly id: VerbId;
  readonly en: {
    readonly base: string;
    readonly third: string;
    readonly past: string;
    readonly ing: string;
  };
  readonly ta: string;
  readonly drawable: boolean;
  readonly anchor: AnchorName | null;
  readonly cue: ActorCue | null;
  readonly transitive: boolean;
};

export type LexiconData = {
  readonly props: readonly PropData[];
  readonly verbs: readonly VerbData[];
  readonly propIds: ReadonlySet<string>;
  readonly verbIds: ReadonlySet<string>;
};

/** Loads and validates the lexicon. Throws `ContentError` naming the file and
 *  the rule; it never returns a half-checked lexicon. */
export async function loadLexicon(): Promise<LexiconData> {
  const [propsModule, verbsModule] = await Promise.all([
    import('content/lexicon/props.json'),
    import('content/lexicon/verbs.json'),
  ]);

  const rawProps = propsModule.default as readonly unknown[];
  const rawVerbs = verbsModule.default as readonly unknown[];

  const propIds = validateProps(rawProps);
  const verbIds = validateVerbs(rawVerbs);

  return {
    props: rawProps as readonly PropData[],
    verbs: rawVerbs as readonly VerbData[],
    propIds,
    verbIds,
  };
}
