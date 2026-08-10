import { FLOOR, FLOOR_INSET, STAGE, centreX, round } from 'common/scene/layout';
import { floorLine, group, line, path, rect, ring, shadow, text } from 'common/scene/primitives';
import { propFor } from 'common/scene/props/index';
import type {
  ActorCue,
  ActorSpec,
  AnchorName,
  Prop,
  SceneNode,
  VerbId,
} from 'common/scene/types';

/* ============================================================
   actor.renderer.ts — who does what to what.

   The verb decides where the patient goes. Every actor prop
   declares a mouth, a hand, a foot and an eye in its own
   coordinates, so `eat` puts the apple at the mouth of whichever
   actor is on stage and nothing here knows what a cat looks
   like. That is why props carry anchors instead of renderers
   guessing at them.

   Voice is the teaching point of this renderer and it is one
   line of it: active and passive draw the *same picture*, and
   only the ring moves. A layout that also changed would let a
   learner believe the passive is a different event.

   Ported from `ui-prototypes/pages/scene-demo.html`, where the
   anchor approach was proved against four actors and seven
   verbs.
   ============================================================ */

/* ---- the numbers ------------------------------------------- */

/** Where the actor stands when there is a patient: left of centre, leaving the
 *  right of the stage for whatever is being done to. */
const ACTOR_X = 132;

/** How far past the mouth the patient sits, so it touches rather than
 *  overlaps. */
const MOUTH_GAP = 6;

/** A held thing sits on the hand, nudged forward: centred exactly on the
 *  anchor it reads as gripped in the middle of the palm rather than held out
 *  in front. */
const HAND_NUDGE = 10;

/** A kicked thing stands on the floor, clear of the foot — and of the rest of
 *  the actor, whose foot anchor is under the middle of it. */
const FOOT_GAP = 18;
const FOOT_CLEAR = 8;

/** A seen thing is across the room and on the floor — at eye height it floats,
 *  and a floating tree is a different sentence. */
const GAZE_REACH = 190;

/** Where an arc puts the patient: out in front of the actor and lifted. Thrown
 *  goes far and high, given goes near and low — the difference between letting
 *  go of something and handing it over. */
type Flight = { readonly reach: number; readonly rise: number };

const THROWN: Flight = { reach: 150, rise: 96 };
const GIVEN: Flight = { reach: 62, rise: 8 };

/** How far a cue runs when there is nothing for it to land on. An intransitive
 *  verb still has a mouth or a foot doing something. */
const FREE_CUE_RUN = 96;

/** The bow on an arc, as a share of its own length — the same units `arrow`
 *  measures a curve in. */
const ARC_BOW = 0.28;

/** How much of the actor's width a patient may take up at each anchor. An
 *  apple bigger than the head it is going into is the edge case this exists
 *  for, and it is a clamp rather than a rule about which props may meet which
 *  verbs: any actor must work with any drawable verb. */
const ANCHOR_CAP: Readonly<Record<AnchorName, number>> = {
  mouth: 0.42,
  hand: 0.62,
  foot: 0.78,
  eye: 1.4,
};

/** The impact burst: three strokes in the gap between what struck and what was
 *  struck. Drawn further back than this it sits behind the foot that did it. */
const IMPACT_BACK = 10;
const IMPACT_SPREAD = 15;
const IMPACT_TAIL = 14;

/** The chomp: a mouth opening, drawn as an arc that faces the way the actor
 *  does. */
const CHOMP_R = 15;

/** The strike that says the action did not happen. */
const STRIKE = 26;

/** Passive fades the actor and imperative fades it further: in the imperative
 *  the one being told to act is not in the picture at all. */
const PASSIVE_FADE = 0.5;
const IMPERATIVE_FADE = 0.32;

/** The addressee of an imperative, standing half outside the frame. */
const ADDRESSEE_W = 74;
const ADDRESSEE_H = 190;
const ADDRESSEE_OUT = 44;

/** The leading question marker. */
const QUERY_X = 44;
const QUERY_Y = 84;
const QUERY_SIZE = 54;

const DASH = '9 7';
const CUE_WIDTH = 3.5;

/* ---- the verbs ---------------------------------------------
   What the content layer knows about a verb — its two languages
   — is in `content/lexicon/verbs.json`, which this file may not
   read: the scene engine does not import from `common/api`.
   What is here is what a *drawing* needs, the same split engine
   10 made between `props.json` and the prop library, and a test
   in `common/api` holds the two lists to each other.

   A verb that is not in this table has no picture. That is the
   answer to open question 2 in architecture.md: an undrawable
   verb is refused by name rather than given a generic animation
   that would teach a learner the wrong thing about it.
   ------------------------------------------------------------ */

/**
 * What a verb is called, on the drawing's side of the wall.
 *
 * The same split, and the same duplication, as a prop: `verbs.json` carries
 * these words for validation to check, the scene engine carries them because
 * it may not read `content/`, and a test in `common/api` holds the two lists
 * to each other. A sentence and a description are both built in here, and
 * neither can be built out of an id.
 *
 * `adjectival` is the one form the lexicon does not carry: சாப்பிடும், the
 * participle that lets a scene be spoken about — *ஆப்பிளை சாப்பிடும் மனிதன்* —
 * rather than commanded.
 */
export type VerbWord = {
  readonly en: {
    readonly base: string;
    readonly third: string;
    readonly past: string;
    readonly ing: string;
  };
  readonly ta: { readonly root: string; readonly adjectival: string };
};

export type ActorVerb = {
  readonly anchor: AnchorName;
  readonly cue: ActorCue;
  /** How large the patient is drawn, before the anchor's clamp. */
  readonly scale: number;
  readonly transitive: boolean;
  /** Where an arc lands. Null for every verb that is not one. */
  readonly flight: Flight | null;
  readonly word: VerbWord;
};

const word = (
  base: string,
  third: string,
  past: string,
  ing: string,
  root: string,
  adjectival: string,
): VerbWord => ({ en: { base, third, past, ing }, ta: { root, adjectival } });

export const ACTOR_VERBS: Readonly<Record<string, ActorVerb>> = Object.freeze({
  eat: {
    anchor: 'mouth', cue: 'chomp', scale: 0.62, transitive: true, flight: null,
    word: word('eat', 'eats', 'ate', 'eating', 'சாப்பிடு', 'சாப்பிடும்'),
  },
  drink: {
    anchor: 'mouth', cue: 'chomp', scale: 0.72, transitive: true, flight: null,
    word: word('drink', 'drinks', 'drank', 'drinking', 'குடி', 'குடிக்கும்'),
  },
  /* The book is in the hand and the gaze comes from the eye. Both anchors are
     used at once, which is the reason a prop declares four of them rather than
     one per verb. */
  read: {
    anchor: 'hand', cue: 'gaze', scale: 0.8, transitive: true, flight: null,
    word: word('read', 'reads', 'read', 'reading', 'படி', 'படிக்கும்'),
  },
  see: {
    anchor: 'eye', cue: 'gaze', scale: 1, transitive: true, flight: null,
    word: word('see', 'sees', 'saw', 'seeing', 'பார்', 'பார்க்கும்'),
  },
  throw: {
    anchor: 'hand', cue: 'arc', scale: 0.7, transitive: true, flight: THROWN,
    word: word('throw', 'throws', 'threw', 'throwing', 'எறி', 'எறியும்'),
  },
  give: {
    anchor: 'hand', cue: 'arc', scale: 0.7, transitive: true, flight: GIVEN,
    word: word('give', 'gives', 'gave', 'giving', 'கொடு', 'கொடுக்கும்'),
  },
  open: {
    anchor: 'hand', cue: 'impact', scale: 0.8, transitive: true, flight: null,
    word: word('open', 'opens', 'opened', 'opening', 'திற', 'திறக்கும்'),
  },
  kick: {
    anchor: 'foot', cue: 'impact', scale: 0.7, transitive: true, flight: null,
    word: word('kick', 'kicks', 'kicked', 'kicking', 'உதை', 'உதைக்கும்'),
  },
  stand: {
    anchor: 'foot', cue: 'impact', scale: 1, transitive: false, flight: null,
    word: word('stand', 'stands', 'stood', 'standing', 'நில்', 'நிற்கும்'),
  },
  laugh: {
    anchor: 'mouth', cue: 'chomp', scale: 1, transitive: false, flight: null,
    word: word('laugh', 'laughs', 'laughed', 'laughing', 'சிரி', 'சிரிக்கும்'),
  },
});

export const verbFor = (id: VerbId | string): ActorVerb | undefined =>
  Object.prototype.hasOwnProperty.call(ACTOR_VERBS, String(id))
    ? ACTOR_VERBS[String(id)]
    : undefined;

/** Whether an actor scene can be drawn for this verb at all. The knob controls
 *  ask this to disable the option rather than to offer a picture that will not
 *  come. */
export const actorDraws = (id: VerbId | string): boolean => verbFor(id) !== undefined;

/**
 * Why this scene cannot be drawn, or null when it can.
 *
 * Swapping the actor and the patient is deliberately not a problem: *the apple
 * eats the man* has to come out absurd rather than blank, because the absurdity
 * is the lesson about word order.
 */
export function actorProblem(spec: ActorSpec): string | null {
  if (!propFor(spec.actor)) return `no prop is drawn for the actor "${spec.actor}"`;

  const verb = verbFor(spec.verb);
  if (!verb) return `"${spec.verb}" has no drawable action`;

  if (spec.cue !== verb.cue) return `"${spec.verb}" is a ${verb.cue}, not a ${spec.cue}`;

  if (spec.patient !== null && !propFor(spec.patient)) {
    return `no prop is drawn for the patient "${spec.patient}"`;
  }
  if (!verb.transitive && spec.patient !== null) {
    return `"${spec.verb}" takes no patient`;
  }
  /* Something has to be done to for anything to be done to it. */
  if (spec.voice === 'passive' && spec.patient === null) {
    return `the passive needs something for "${spec.verb}" to be done to`;
  }
  return null;
}

/* ---- anchors -----------------------------------------------
   An actor prop declares its own. Anything else — a ball, a
   table — gets them from its box, so the absurd picture is a
   picture: the ball's "mouth" is the front of it, and the apple
   eating the man is drawn rather than refused.
   ------------------------------------------------------------ */

type Point = readonly [number, number];

const FALLBACK: Readonly<Record<AnchorName, (prop: Prop) => Point>> = {
  mouth: (prop) => [prop.box.w, prop.box.h * 0.4],
  eye: (prop) => [prop.box.w * 0.82, prop.box.h * 0.26],
  hand: (prop) => [prop.box.w, prop.box.h * 0.55],
  foot: (prop) => [prop.box.w * 0.5, prop.box.h],
};

export const anchorOf = (prop: Prop, name: AnchorName): Point =>
  prop.anchors[name] ?? FALLBACK[name](prop);

/* ---- layout ------------------------------------------------ */

type Placed = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };

type Layout = {
  readonly actor: Placed;
  readonly patient: Placed | null;
  readonly scale: number;
  /** Absolute, on the stage: where the cue starts and where it lands. */
  readonly anchor: Point;
  readonly eye: Point;
  readonly target: Point;
};

const at = (origin: Placed, point: Point): Point => [
  round(origin.x + point[0]),
  round(origin.y + point[1]),
];

const centreOf = (placed: Placed): Point => [
  round(placed.x + placed.w / 2),
  round(placed.y + placed.h / 2),
];

/** Three decimals, downwards. A patient scaled to exactly fill its clamp comes
 *  back a thousandth larger when rounded to nearest, which is a patient a
 *  thousandth wider than the rule it was clamped by. */
const scaleFloor = (value: number): number => Math.floor(value * 1000) / 1000;

/** The verb's scale, held under what the anchor can carry. */
function patientScale(verb: ActorVerb, actor: Prop, patient: Prop): number {
  const cap = (ANCHOR_CAP[verb.anchor] * actor.box.w) / patient.box.w;
  return Math.max(0, scaleFloor(Math.min(verb.scale, cap)));
}

/** On the stage, whatever the arithmetic said. Nothing may hang off an edge:
 *  the viewBox is the whole picture and there is no scrolling to reveal the
 *  rest of it. */
const onStage = (value: number, size: number, low: number, high: number): number =>
  round(Math.max(low, Math.min(high - size, value)));

function place(
  verb: ActorVerb,
  actor: Placed,
  anchor: Point,
  patient: Prop,
  scale: number,
): Placed {
  const w = patient.box.w * scale;
  const h = patient.box.h * scale;

  const wanted = ((): Point => {
    if (verb.flight) {
      return [actor.x + actor.w + verb.flight.reach, anchor[1] - verb.flight.rise - h / 2];
    }
    switch (verb.anchor) {
      case 'mouth':
        return [anchor[0] + MOUTH_GAP, anchor[1] - h / 2];
      /* Held, or acted on. A book being read sits in the hand; a box being
         opened stands beyond it, or the hand that opens it is drawn inside the
         thing it is opening. */
      case 'hand':
        return verb.cue === 'gaze'
          ? [anchor[0] - w / 2 + HAND_NUDGE, anchor[1] - h / 2]
          : [anchor[0] + HAND_NUDGE, anchor[1] - h / 2];
      /* Clear of the actor, not merely clear of the foot: every actor's foot
         anchor is under the middle of it, so a ball placed from the anchor
         alone is drawn between the legs and cannot be seen to have been
         kicked. */
      case 'foot':
        return [Math.max(anchor[0] + FOOT_GAP, actor.x + actor.w + FOOT_CLEAR), FLOOR - h];
      case 'eye':
        return [actor.x + actor.w + GAZE_REACH, FLOOR - h];
    }
  })();

  return {
    x: onStage(wanted[0], w, FLOOR_INSET, STAGE.width - FLOOR_INSET),
    y: onStage(wanted[1], h, FLOOR_INSET / 2, FLOOR),
    w: round(w),
    h: round(h),
  };
}

/** How far to slide the whole scene so that everything drawn sits in the middle
 *  of the stage — held back at either edge, because a scene centred off the
 *  side of the viewBox is worse than one a little off-centre. */
function centringShift(actor: Placed, patient: Placed | null): number {
  const left = patient === null ? actor.x : Math.min(actor.x, patient.x);
  const right =
    patient === null ? actor.x + actor.w : Math.max(actor.x + actor.w, patient.x + patient.w);
  const wanted = (STAGE.width - (right - left)) / 2 - left;

  return round(
    Math.max(FLOOR_INSET - left, Math.min(STAGE.width - FLOOR_INSET - right, wanted)),
  );
}

function layoutFor(verb: ActorVerb, actor: Prop, patient: Prop | null): Layout {
  /* Laid out from a fixed left edge, then slid so that what was drawn ends up
     in the middle of the stage. Placed from the centre instead, `eat` and
     `throw` would sit in different places for no reason a learner could see:
     the patient is on the actor's face for one and half a stage away for the
     other, and only the pair of them together has a middle. */
  const provisional: Placed = {
    x: patient === null ? round(centreX(actor.box.w)) : ACTOR_X,
    y: round(FLOOR - actor.box.h),
    w: actor.box.w,
    h: actor.box.h,
  };

  const scale = patient === null ? 1 : patientScale(verb, actor, patient);
  const drawn =
    patient === null
      ? null
      : place(verb, provisional, at(provisional, anchorOf(actor, verb.anchor)), patient, scale);

  const shift = centringShift(provisional, drawn);
  const placedActor: Placed = { ...provisional, x: round(provisional.x + shift) };
  const placedPatient = drawn === null ? null : { ...drawn, x: round(drawn.x + shift) };

  const anchor = at(placedActor, anchorOf(actor, verb.anchor));
  const eye = at(placedActor, anchorOf(actor, 'eye'));

  const from = verb.cue === 'gaze' ? eye : anchor;

  return {
    actor: placedActor,
    patient: placedPatient,
    scale,
    anchor,
    eye,
    /* With nothing to land on, the cue still runs the way the actor faces —
       every prop in the library is drawn facing right. */
    target: placedPatient ? centreOf(placedPatient) : [round(from[0] + FREE_CUE_RUN), from[1]],
  };
}

/* ---- the four cues ------------------------------------------
   A cue is what makes a drawing an action rather than two things
   near each other. Each one returns its nodes and the point
   negation strikes through, because "did not" has to cross the
   action itself and not the actor.
   ------------------------------------------------------------ */

type Cue = { readonly nodes: readonly SceneNode[]; readonly strike: Point };

const chomp = (layout: Layout): Cue => ({
  nodes: [
    path('cue-chomp', {
      d: `M${layout.anchor[0]},${round(layout.anchor[1] - CHOMP_R)} a${CHOMP_R},${CHOMP_R} 0 1 0 0,${
        CHOMP_R * 2
      }`,
      stroke: 'var(--warn)',
      strokeWidth: CUE_WIDTH,
    }),
  ],
  strike: layout.anchor,
});

const gaze = (layout: Layout): Cue => ({
  nodes: [
    line('cue-gaze', {
      x1: layout.eye[0],
      y1: layout.eye[1],
      x2: layout.target[0],
      y2: layout.target[1],
      stroke: 'var(--accent)',
      strokeWidth: 2.5,
      dash: '7 6',
    }),
  ],
  strike: [
    round((layout.eye[0] + layout.target[0]) / 2),
    round((layout.eye[1] + layout.target[1]) / 2),
  ],
});

/** The thrown thing's flight, bowed above the straight line between hand and
 *  landing point — the same quadratic `arrow` draws a curve with, so the two
 *  agree about what a bow of 0.28 means. */
function arc(layout: Layout): Cue {
  const [x1, y1] = layout.anchor;
  const [x2, y2] = layout.target;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  /* Bowed the other way from `arrow`'s positive curve, which sags: a thrown
     thing goes over, and an arc drawn under its own endpoints is a drop. */
  const cx = round((x1 + x2) / 2 + (dy / length) * (ARC_BOW * length));
  const cy = round((y1 + y2) / 2 - (dx / length) * (ARC_BOW * length));

  return {
    nodes: [
      path('cue-arc', {
        d: `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`,
        stroke: 'var(--accent)',
        strokeWidth: CUE_WIDTH,
        dash: '8 7',
      }),
    ],
    /* The apex of a quadratic, not the midpoint of the chord: a strike through
       the chord of a high arc crosses nothing but air. */
    strike: [round((x1 + 2 * cx + x2) / 4), round((y1 + 2 * cy + y2) / 4)],
  };
}

/** The burst where contact happened: on the near side of what was struck, so
 *  it sits between the actor and the patient rather than behind it. */
function impact(layout: Layout): Cue {
  const struck = layout.patient;

  /* With nothing struck, the burst goes the way the actor faces, clear of its
     leading edge and lifted off the floor: a foot's anchor is on the floor and
     under the middle of the body, so a burst drawn back from it is a scuff on
     the actor's own leg. */
  const [x, y] = struck
    ? [round(struck.x - 6), centreOf(struck)[1]]
    : [
        round(layout.actor.x + layout.actor.w),
        Math.min(layout.anchor[1], FLOOR - IMPACT_SPREAD - 6),
      ];
  const forward = struck ? -1 : 1;
  const back = round(x + IMPACT_BACK * forward);

  const spark = (id: string, dy: number, tail: number): SceneNode =>
    line(id, {
      x1: back,
      y1: round(y + dy),
      x2: round(back + IMPACT_TAIL * forward),
      y2: round(y + dy + tail),
      stroke: 'var(--warn)',
      strokeWidth: CUE_WIDTH,
    });

  return {
    nodes: [
      spark('cue-impact-high', -IMPACT_SPREAD, -10),
      spark('cue-impact-mid', 0, 0),
      spark('cue-impact-low', IMPACT_SPREAD, 10),
    ],
    /* In the middle of the burst, not between the burst and what was struck:
       a strike drawn on the gap crosses nothing. */
    strike: [round(back + (IMPACT_TAIL / 2) * forward), y],
  };
}

const CUES: Readonly<Record<ActorCue, (layout: Layout) => Cue>> = { chomp, gaze, arc, impact };

/* ---- drawing ----------------------------------------------- */

/** The action struck out. Negation is drawn on the cue, never on the actor:
 *  *the cat did not eat the fish* still has a cat and a fish in it. */
const strikeOut = (point: Point): SceneNode =>
  line('cue-strike', {
    x1: round(point[0] - STRIKE),
    y1: round(point[1] + STRIKE),
    x2: round(point[0] + STRIKE),
    y2: round(point[1] - STRIKE),
    stroke: 'var(--danger)',
    strokeWidth: 5,
  });

/** Who the sentence is about. The whole of voice in this renderer: the ring
 *  moves and nothing else does. */
const focusRing = (placed: Placed): SceneNode =>
  group('ring', [ring('ring-mark', placed)], { role: 'voice' });

/** The one being told to act, outside the frame: an outline at the edge with
 *  nobody in it. Drawn rather than captioned, so it needs no language. */
const addressee = (): readonly SceneNode[] => [
  rect('mood-addressee', {
    x: -ADDRESSEE_OUT,
    y: FLOOR - ADDRESSEE_H,
    w: ADDRESSEE_W + ADDRESSEE_OUT,
    h: ADDRESSEE_H,
    r: 14,
    stroke: 'var(--accent)',
    strokeWidth: 3,
    dash: DASH,
  }),
];

/** A question is marked before it is asked, in both languages — English and
 *  Tamil write the same glyph, so this is a mark and not a word. */
const query = (): readonly SceneNode[] => [
  text('mood-question', {
    x: QUERY_X,
    y: QUERY_Y,
    content: '?',
    size: QUERY_SIZE,
    weight: 700,
    fill: 'var(--accent)',
    anchor: 'middle',
  }),
];

/**
 * An actor scene, as a node tree.
 *
 * Returns nothing at all for a spec `actorProblem` refuses, the same as every
 * other renderer: a blank stage is visibly wrong, and a picture that
 * contradicts its own sentence is not.
 */
export function renderActor(spec: ActorSpec): readonly SceneNode[] {
  const actor = propFor(spec.actor);
  const verb = verbFor(spec.verb);
  if (!actor || !verb || actorProblem(spec) !== null) return [];

  const patient = propFor(spec.patient) ?? null;
  const layout = layoutFor(verb, actor, patient);
  const cue = CUES[verb.cue](layout);

  const passive = spec.voice === 'passive';
  const fade = spec.mood === 'imperative' ? IMPERATIVE_FADE : passive ? PASSIVE_FADE : undefined;

  return [
    floorLine(),
    ...(spec.mood === 'imperative' ? addressee() : []),
    shadow('shadow-actor', layout.actor.x, actor.box.w),
    ...patientShadow(layout),
    group('actor', actor.draw(), {
      x: layout.actor.x,
      y: layout.actor.y,
      ...(fade === undefined ? {} : { opacity: fade }),
      role: 'actor',
    }),
    ...(patient && layout.patient
      ? [
          group('patient', patient.draw(), {
            x: layout.patient.x,
            y: layout.patient.y,
            scale: layout.scale,
            role: 'patient',
          }),
        ]
      : []),
    group('cue', cue.nodes, { role: 'verb' }),
    ...(spec.negated ? [strikeOut(cue.strike)] : []),
    focusRing(passive && layout.patient ? layout.patient : layout.actor),
    ...(spec.mood === 'question' ? query() : []),
  ];
}

/** Only for a patient standing on the floor. A shadow under a thrown ball is a
 *  shadow on nothing. */
function patientShadow(layout: Layout): readonly SceneNode[] {
  const placed = layout.patient;
  if (!placed || Math.abs(placed.y + placed.h - FLOOR) > 1) return [];

  return [shadow('shadow-patient', placed.x, placed.w)];
}
