import { FLOOR, FLOOR_INSET, STAGE } from 'common/scene/layout';
import {
  ACTOR_VERBS,
  actorDraws,
  actorProblem,
  anchorOf,
  renderActor,
  verbFor,
} from 'common/scene/renderers/actor.renderer';
import { propFor } from 'common/scene/props/index';
import type { ActorSpec, AnchorName, Prop, PropId, SceneNode, VerbId } from 'common/scene/types';

/* ============================================================
   actor.renderer.test.ts

   The claim this renderer makes is that the verb decides where
   the patient goes, so nearly everything here is an assertion
   about a distance from an anchor — and the one that matters
   most is that active and passive draw the same picture.
   ============================================================ */

const propId = (value: string): PropId => value as PropId;
const verbId = (value: string): VerbId => value as VerbId;

const VERBS = Object.keys(ACTOR_VERBS);

/** A patient each verb can be drawn with. Every actor works with every verb,
 *  which is asserted below; the patient is chosen to be the sensible one. */
const PATIENT_FOR: Readonly<Record<string, string | null>> = {
  eat: 'apple',
  drink: 'cup',
  read: 'book',
  see: 'tree',
  throw: 'ball',
  give: 'apple',
  open: 'box',
  kick: 'ball',
  stand: null,
  laugh: null,
};

function spec(verb: string, over: Partial<ActorSpec> = {}): ActorSpec {
  const found = ACTOR_VERBS[verb];
  if (!found) throw new Error(`the test asked for a verb that is not drawn: ${verb}`);
  const patient = PATIENT_FOR[verb] ?? null;

  return {
    kind: 'actor',
    actor: propId('man'),
    verb: verbId(verb),
    patient: patient === null ? null : propId(patient),
    cue: found.cue,
    voice: 'active',
    mood: 'statement',
    negated: false,
    ...over,
  };
}

/* ---- reading the tree -------------------------------------- */

const flatten = (nodes: readonly SceneNode[]): readonly SceneNode[] =>
  nodes.flatMap((node) => [node, ...flatten(node.children ?? [])]);

const find = (nodes: readonly SceneNode[], nodeId: string): SceneNode | undefined =>
  flatten(nodes).find((node) => node.id === nodeId);

const has = (nodes: readonly SceneNode[], nodeId: string): boolean =>
  find(nodes, nodeId) !== undefined;

function placedAt(node: SceneNode | undefined): { x: number; y: number; scale: number } {
  const transform = String(node?.attrs.transform ?? '');
  const move = /translate\(([-\d.]+),([-\d.]+)\)/.exec(transform);
  const scale = /scale\(([\d.]+)\)/.exec(transform);

  return { x: Number(move?.[1] ?? 0), y: Number(move?.[2] ?? 0), scale: Number(scale?.[1] ?? 1) };
}

type Box = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };

const prop = (name: string): Prop => {
  const found = propFor(propId(name));
  if (!found) throw new Error(`the test asked for a prop that is not drawn: ${name}`);
  return found;
};

function boxOf(nodes: readonly SceneNode[], nodeId: string, of: Prop): Box {
  const at = placedAt(find(nodes, nodeId));
  return { x: at.x, y: at.y, w: of.box.w * at.scale, h: of.box.h * at.scale };
}

const centreOf = (box: Box): readonly [number, number] => [box.x + box.w / 2, box.y + box.h / 2];

/** Where an anchor of the drawn actor ended up on the stage. */
function anchorPoint(
  nodes: readonly SceneNode[],
  actorName: string,
  name: AnchorName,
): readonly [number, number] {
  const at = placedAt(find(nodes, 'actor'));
  const [ax, ay] = anchorOf(prop(actorName), name);
  return [at.x + ax, at.y + ay];
}

/**
 * The box the cue is drawn in.
 *
 * Read out of the nodes rather than recomputed: a strike is only a negation if
 * it crosses what the renderer actually drew. Arc segments are dropped — their
 * radii and flags are not coordinates — which leaves the chomp bounded by the
 * point its arc starts from, and that point is the mouth.
 */
function cueBounds(nodes: readonly SceneNode[]): Box {
  const points = flatten(find(nodes, 'cue')?.children ?? []).flatMap((node) => {
    if (node.tag === 'line') {
      return [
        [Number(node.attrs.x1), Number(node.attrs.y1)],
        [Number(node.attrs.x2), Number(node.attrs.y2)],
      ];
    }
    const straight = String(node.attrs.d ?? '').split(/[aA]/)[0] ?? '';
    return [...straight.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  });

  const xs = points.map(([x]) => Number(x));
  const ys = points.map(([, y]) => Number(y));

  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}

/** Every number a node carries, so a scene can be checked for coordinates that
 *  left the stage without knowing which attribute holds them. */
const coordsOf = (node: SceneNode): readonly (readonly [string, number])[] =>
  Object.entries(node.attrs).flatMap(([key, value]) =>
    typeof value === 'number' ? [[key, value] as const] : [],
  );

/* ---- the lexicon ------------------------------------------- */

describe('the verb table', () => {
  it('gives every drawable verb an anchor, a cue and a patient scale', () => {
    for (const name of VERBS) {
      const verb = ACTOR_VERBS[name];
      expect(['mouth', 'hand', 'foot', 'eye']).toContain(verb?.anchor);
      expect(['chomp', 'gaze', 'arc', 'impact']).toContain(verb?.cue);
      expect(verb?.scale).toBeGreaterThan(0);
    }
  });

  it('gives a flight to the arc verbs and to nothing else', () => {
    for (const name of VERBS) {
      const verb = ACTOR_VERBS[name];
      expect(verb?.flight !== null).toBe(verb?.cue === 'arc');
    }
  });

  it('knows nothing about a verb with no drawable action', () => {
    /* Open question 2, closed: `remember` and `force` are in the lexicon with
       their words and have no picture at all. */
    for (const name of ['remember', 'force', 'sleep', 'sit', 'like']) {
      expect(verbFor(name)).toBeUndefined();
      expect(actorDraws(name)).toBe(false);
    }
    expect(actorDraws('eat')).toBe(true);
  });

  it('does not answer for something that is not a verb at all', () => {
    /* `constructor` and `toString` are on every object; a table read without
       an own-property check says a scene can be drawn for them. */
    expect(verbFor('constructor')).toBeUndefined();
    expect(verbFor('toString')).toBeUndefined();
  });
});

/* ---- what can be drawn ------------------------------------- */

describe('actorProblem', () => {
  it('says nothing about a scene that can be drawn', () => {
    for (const name of VERBS) {
      expect(actorProblem(spec(name))).toBeNull();
    }
  });

  it('refuses a verb with no drawable action rather than drawing it vaguely', () => {
    const problem = actorProblem(spec('eat', { verb: verbId('remember') }));

    expect(problem).toBe('"remember" has no drawable action');
    expect(renderActor(spec('eat', { verb: verbId('remember') }))).toEqual([]);
  });

  it('refuses a cue the verb is not', () => {
    expect(actorProblem(spec('eat', { cue: 'arc' }))).toMatch(/chomp/);
  });

  it('refuses a patient given to an intransitive verb', () => {
    expect(actorProblem(spec('laugh', { patient: propId('apple') }))).toBe(
      '"laugh" takes no patient',
    );
  });

  it('refuses the passive with nothing for the verb to be done to', () => {
    expect(actorProblem(spec('eat', { patient: null, voice: 'passive' }))).toMatch(/passive/);
  });

  it('refuses an actor or a patient nobody drew', () => {
    expect(actorProblem(spec('eat', { actor: propId('robot') }))).toMatch(/robot/);
    expect(actorProblem(spec('eat', { patient: propId('rocket') }))).toMatch(/rocket/);
  });
});

/* ---- the patient goes where the verb says ------------------ */

describe('renderActor — the anchor carries the patient', () => {
  it('puts what is eaten at the mouth', () => {
    const nodes = renderActor(spec('eat'));
    const patient = boxOf(nodes, 'patient', prop('apple'));
    const [mx, my] = anchorPoint(nodes, 'man', 'mouth');

    expect(patient.x).toBeGreaterThanOrEqual(mx);
    expect(patient.x).toBeLessThan(mx + 20);
    expect(centreOf(patient)[1]).toBeCloseTo(my, 0);
  });

  it('puts what is drunk at the mouth as well', () => {
    const nodes = renderActor(spec('drink'));
    const [, my] = anchorPoint(nodes, 'man', 'mouth');

    expect(centreOf(boxOf(nodes, 'patient', prop('cup')))[1]).toBeCloseTo(my, 0);
  });

  it('puts what is read in the hand and looks at it from the eye', () => {
    const nodes = renderActor(spec('read'));
    const patient = boxOf(nodes, 'patient', prop('book'));
    const [hx, hy] = anchorPoint(nodes, 'man', 'hand');
    const [ex, ey] = anchorPoint(nodes, 'man', 'eye');
    const gaze = find(nodes, 'cue-gaze');

    expect(centreOf(patient)[1]).toBeCloseTo(hy, 0);
    expect(Math.abs(centreOf(patient)[0] - hx)).toBeLessThan(20);
    /* Both anchors at once — the hand holds it and the eye is on it. */
    expect(Number(gaze?.attrs.x1)).toBeCloseTo(ex, 0);
    expect(Number(gaze?.attrs.y1)).toBeCloseTo(ey, 0);
    expect(Number(gaze?.attrs.x2)).toBeCloseTo(centreOf(patient)[0], 0);
  });

  it('puts what is seen across the room, on the floor', () => {
    const nodes = renderActor(spec('see'));
    const actor = boxOf(nodes, 'actor', prop('man'));
    const patient = boxOf(nodes, 'patient', prop('tree'));

    expect(patient.x).toBeGreaterThan(actor.x + actor.w);
    expect(patient.y + patient.h).toBeCloseTo(FLOOR, 0);
  });

  it('throws from the hand, out and up', () => {
    const nodes = renderActor(spec('throw'));
    const actor = boxOf(nodes, 'actor', prop('man'));
    const patient = boxOf(nodes, 'patient', prop('ball'));
    const [hx, hy] = anchorPoint(nodes, 'man', 'hand');

    expect(patient.x).toBeGreaterThan(actor.x + actor.w);
    expect(centreOf(patient)[1]).toBeLessThan(hy);
    expect(String(find(nodes, 'cue-arc')?.attrs.d)).toContain(`M${hx},${hy}`);
  });

  it('gives it near and low, where a throw goes far and high', () => {
    const given = boxOf(renderActor(spec('give')), 'patient', prop('apple'));
    const thrown = boxOf(renderActor(spec('throw')), 'patient', prop('ball'));

    expect(given.x).toBeLessThan(thrown.x);
    expect(given.y).toBeGreaterThan(thrown.y);
  });

  it('kicks what is on the floor, in front of the foot', () => {
    const nodes = renderActor(spec('kick'));
    const patient = boxOf(nodes, 'patient', prop('ball'));
    const [fx] = anchorPoint(nodes, 'man', 'foot');

    expect(patient.x).toBeGreaterThan(fx);
    expect(patient.y + patient.h).toBeCloseTo(FLOOR, 0);
  });

  it('opens what is held in the hand', () => {
    const nodes = renderActor(spec('open'));
    const [, hy] = anchorPoint(nodes, 'man', 'hand');

    expect(centreOf(boxOf(nodes, 'patient', prop('box')))[1]).toBeCloseTo(hy, 0);
  });

  it('draws the cue every verb declares and no other', () => {
    for (const name of VERBS) {
      const nodes = renderActor(spec(name));
      const cue = find(nodes, 'cue');

      expect(cue?.attrs['data-node']).toBe('verb');
      expect((cue?.children ?? []).length).toBeGreaterThan(0);
      for (const child of cue?.children ?? []) {
        expect(child.id).toContain(ACTOR_VERBS[name]?.cue ?? '');
      }
    }
  });

  it('works with every actor prop, for every drawable verb', () => {
    for (const actorName of ['man', 'woman', 'cat', 'dog']) {
      for (const name of VERBS) {
        const nodes = renderActor(spec(name, { actor: propId(actorName) }));

        expect(nodes.length).toBeGreaterThan(0);
        expect(has(nodes, 'actor')).toBe(true);
        expect(has(nodes, 'cue')).toBe(true);
      }
    }
  });
});

/* ---- voice ------------------------------------------------- */

describe('renderActor — voice moves the ring and nothing else', () => {
  /* The teaching point of the whole renderer: the event is the same event, so
     the picture is the same picture. */
  const geometry = (nodes: readonly SceneNode[]): readonly string[] =>
    flatten(nodes)
      .filter((node) => !node.id.startsWith('ring'))
      .map((node) => `${node.id} ${node.attrs.transform ?? ''} ${node.attrs.d ?? ''} ${node.attrs.x ?? ''},${node.attrs.y ?? ''}`);

  it('draws the same geometry active and passive', () => {
    for (const name of VERBS) {
      const active = spec(name);
      if (active.patient === null) continue;

      expect(geometry(renderActor({ ...active, voice: 'passive' }))).toEqual(
        geometry(renderActor(active)),
      );
    }
  });

  it('rings the actor in the active and the patient in the passive', () => {
    /* The ring is measured against the box it is meant to be around rather
       than against the other participant: a kicked ball stands at the actor's
       own foot, so "further right than the actor" would pass for the wrong
       reason. */
    const ringed = (nodes: readonly SceneNode[]): Box => {
      const mark = find(nodes, 'ring-mark');
      return {
        x: Number(mark?.attrs.x),
        y: Number(mark?.attrs.y),
        w: Number(mark?.attrs.width),
        h: Number(mark?.attrs.height),
      };
    };
    const surrounds = (mark: Box, target: Box): boolean =>
      mark.x < target.x &&
      mark.y < target.y &&
      mark.x + mark.w > target.x + target.w &&
      mark.y + mark.h > target.y + target.h;

    const active = renderActor(spec('kick'));
    const passive = renderActor(spec('kick', { voice: 'passive' }));
    const actor = boxOf(active, 'actor', prop('man'));
    const patient = boxOf(active, 'patient', prop('ball'));

    expect(surrounds(ringed(active), actor)).toBe(true);
    expect(surrounds(ringed(active), patient)).toBe(false);
    expect(surrounds(ringed(passive), patient)).toBe(true);
    expect(surrounds(ringed(passive), actor)).toBe(false);
  });

  it('fades the actor in the passive, because the sentence is not about them', () => {
    const active = find(renderActor(spec('kick')), 'actor');
    const passive = find(renderActor(spec('kick', { voice: 'passive' })), 'actor');

    expect(active?.attrs.opacity).toBeUndefined();
    expect(Number(passive?.attrs.opacity)).toBeLessThan(1);
  });

  it('rings the patient even though the actor is still drawn', () => {
    const nodes = renderActor(spec('eat', { voice: 'passive' }));

    expect(has(nodes, 'actor')).toBe(true);
    expect(has(nodes, 'ring-mark')).toBe(true);
  });
});

/* ---- no patient -------------------------------------------- */

describe('renderActor — an intransitive verb', () => {
  it('draws no patient and no shadow for one', () => {
    for (const name of ['stand', 'laugh']) {
      const nodes = renderActor(spec(name));

      expect(has(nodes, 'patient')).toBe(false);
      expect(has(nodes, 'shadow-patient')).toBe(false);
      expect(has(nodes, 'cue')).toBe(true);
    }
  });

  it('centres the actor rather than leaving the space a patient would fill', () => {
    const alone = boxOf(renderActor(spec('laugh')), 'actor', prop('man'));
    const acting = boxOf(renderActor(spec('eat')), 'actor', prop('man'));

    expect(alone.x + alone.w / 2).toBeCloseTo(STAGE.width / 2, 0);
    expect(acting.x).toBeLessThan(alone.x);
  });

  it('still draws the cue at the anchor the verb names', () => {
    const nodes = renderActor(spec('laugh'));
    const [mx, my] = anchorPoint(nodes, 'man', 'mouth');

    expect(String(find(nodes, 'cue-chomp')?.attrs.d)).toContain(`M${mx},${my - 15}`);
  });
});

/* ---- mood and negation ------------------------------------- */

describe('renderActor — mood and negation are overlays', () => {
  const barePicture = (nodes: readonly SceneNode[]): readonly string[] =>
    flatten(nodes)
      .filter((node) => !node.id.startsWith('mood') && !node.id.startsWith('cue-strike'))
      .map((node) => `${node.id} ${node.attrs.transform ?? ''} ${node.attrs.d ?? ''}`);

  it('leaves the scene alone and adds a leading marker for a question', () => {
    const statement = renderActor(spec('eat'));
    const question = renderActor(spec('eat', { mood: 'question' }));

    expect(find(question, 'mood-question')?.text).toBe('?');
    expect(Number(find(question, 'mood-question')?.attrs.x)).toBeLessThan(STAGE.width / 2);
    expect(barePicture(question)).toEqual(barePicture(statement));
  });

  it('fades the actor for an imperative and puts the addressee outside the frame', () => {
    const nodes = renderActor(spec('eat', { mood: 'imperative' }));
    const addressee = find(nodes, 'mood-addressee');

    expect(Number(find(nodes, 'actor')?.attrs.opacity)).toBeLessThan(0.5);
    expect(Number(addressee?.attrs.x)).toBeLessThan(0);
    expect(String(addressee?.attrs['stroke-dasharray']).length).toBeGreaterThan(0);
  });

  it('strikes the action, and leaves the actor and the patient alone', () => {
    /* Every verb, because a strike is only a negation if it crosses the cue —
       through the chord of a high arc it crosses nothing but air. */
    for (const name of VERBS) {
      const nodes = renderActor(spec(name, { negated: true }));
      const strike = find(nodes, 'cue-strike');
      const middle = [
        (Number(strike?.attrs.x1) + Number(strike?.attrs.x2)) / 2,
        (Number(strike?.attrs.y1) + Number(strike?.attrs.y2)) / 2,
      ] as const;
      const cue = cueBounds(nodes);
      /* The chomp's bounds are the point its arc leaves from; the arc itself
         bulges a radius below that, and that is where the mouth is. */
      const slack = 16;

      expect(strike).toBeDefined();
      expect(middle[0]).toBeGreaterThanOrEqual(cue.x - slack);
      expect(middle[0]).toBeLessThanOrEqual(cue.x + cue.w + slack);
      expect(middle[1]).toBeGreaterThanOrEqual(cue.y - slack);
      expect(middle[1]).toBeLessThanOrEqual(cue.y + cue.h + slack);
      expect(barePicture(nodes)).toEqual(barePicture(renderActor(spec(name))));
    }
  });

  it('draws no strike when nothing is negated', () => {
    expect(has(renderActor(spec('kick')), 'cue-strike')).toBe(false);
  });
});

/* ---- the absurd picture ------------------------------------ */

describe('renderActor — word order', () => {
  it('draws the swap rather than refusing it: the apple eats the man', () => {
    const swapped = spec('eat', { actor: propId('apple'), patient: propId('man') });

    expect(actorProblem(swapped)).toBeNull();

    const nodes = renderActor(swapped);
    expect(has(nodes, 'actor')).toBe(true);
    expect(has(nodes, 'patient')).toBe(true);
    expect(has(nodes, 'cue')).toBe(true);
  });

  it('gives a prop with no anchors somewhere for the patient to go', () => {
    const apple = prop('apple');

    expect(apple.anchors.mouth).toBeUndefined();
    expect(anchorOf(apple, 'mouth')[0]).toBe(apple.box.w);
    expect(anchorOf(apple, 'foot')[1]).toBe(apple.box.h);
  });
});

/* ---- the clamps -------------------------------------------- */

describe('renderActor — nothing outsizes or overruns the stage', () => {
  it('clamps a patient bigger than the actor at a mouth anchor', () => {
    /* A tree at the mouth of a cat: the verb asks for 0.62 and the anchor can
       carry far less than that. */
    const nodes = renderActor(spec('eat', { actor: propId('cat'), patient: propId('tree') }));
    const patient = boxOf(nodes, 'patient', prop('tree'));

    expect(patient.w).toBeLessThan(prop('cat').box.w);
    expect(placedAt(find(nodes, 'patient')).scale).toBeLessThan(ACTOR_VERBS.eat?.scale ?? 1);
  });

  it('never scales a patient up past what the verb asked for', () => {
    for (const name of VERBS) {
      const nodes = renderActor(spec(name));
      if (!has(nodes, 'patient')) continue;

      expect(placedAt(find(nodes, 'patient')).scale).toBeLessThanOrEqual(
        ACTOR_VERBS[name]?.scale ?? 1,
      );
    }
  });

  it('keeps every patient on the stage, for every actor and every verb', () => {
    for (const actorName of ['man', 'woman', 'cat', 'dog']) {
      for (const name of VERBS) {
        const nodes = renderActor(spec(name, { actor: propId(actorName) }));
        if (!has(nodes, 'patient')) continue;

        const patientName = PATIENT_FOR[name];
        const patient = boxOf(nodes, 'patient', prop(patientName ?? 'ball'));

        expect(patient.x).toBeGreaterThanOrEqual(FLOOR_INSET - 0.1);
        expect(patient.x + patient.w).toBeLessThanOrEqual(STAGE.width - FLOOR_INSET + 0.1);
        expect(patient.y).toBeGreaterThanOrEqual(0);
        expect(patient.y + patient.h).toBeLessThanOrEqual(FLOOR + 0.1);
      }
    }
  });

  it('draws every coordinate inside the viewBox', () => {
    for (const name of VERBS) {
      for (const mood of ['statement', 'question', 'imperative'] as const) {
        const nodes = flatten(renderActor(spec(name, { mood, negated: true })));

        for (const node of nodes) {
          /* The addressee is deliberately half outside — it is the one thing
             in the picture that is not in the frame. */
          if (node.id === 'mood-addressee') continue;

          for (const [key, value] of coordsOf(node)) {
            if (!/^(x|y|cx|cy|x1|y1|x2|y2)$/.test(key)) continue;
            expect(value).toBeGreaterThanOrEqual(-1);
            expect(value).toBeLessThanOrEqual((/^(x|c?x|x1|x2)$/.test(key) ? STAGE.width : STAGE.height) + 1);
          }
        }
      }
    }
  });
});

/* ---- the house rules --------------------------------------- */

describe('renderActor — the rules every renderer keeps', () => {
  it('stands the actor on the floor and gives it a shadow', () => {
    const nodes = renderActor(spec('eat'));
    const actor = boxOf(nodes, 'actor', prop('man'));

    expect(actor.y + actor.h).toBeCloseTo(FLOOR, 0);
    expect(has(nodes, 'shadow-actor')).toBe(true);
    expect(has(nodes, 'floor')).toBe(true);
  });

  it('gives a patient on the floor a shadow and one in the air none', () => {
    expect(has(renderActor(spec('kick')), 'shadow-patient')).toBe(true);
    expect(has(renderActor(spec('throw')), 'shadow-patient')).toBe(false);
  });

  it('names no literal colour', () => {
    for (const name of VERBS) {
      for (const node of flatten(renderActor(spec(name, { negated: true })))) {
        for (const [, value] of Object.entries(node.attrs)) {
          if (typeof value !== 'string') continue;
          expect(value).not.toMatch(/#[0-9a-f]{3}|rgb\(/i);
        }
      }
    }
  });

  it('rounds every coordinate it draws', () => {
    for (const name of VERBS) {
      for (const node of flatten(renderActor(spec(name)))) {
        for (const [, value] of coordsOf(node)) {
          expect(Math.round(value * 10) / 10).toBe(value);
        }
      }
    }
  });

  it('gives every node a stable id and a role the words can light up', () => {
    /* Top level only: a prop draws its own parts as `body` and `head` inside
       its own group, so the man and the apple both have a body and neither is
       ambiguous. What has to be unique is what the animation diff matches on. */
    const nodes = renderActor(spec('eat'));
    const ids = nodes.map((node) => node.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(find(nodes, 'actor')?.attrs['data-node']).toBe('actor');
    expect(find(nodes, 'patient')?.attrs['data-node']).toBe('patient');
    expect(find(nodes, 'ring')?.attrs['data-node']).toBe('voice');
  });
});
