import type { Scenario } from './data';
import { respondLocally } from './responseEngine';
import type { LocalResponse } from './responseEngine';
import type { DialogueMemory } from './dialogueModel';

export type Reply = {
  readonly turn: number;
  readonly text: string;
  /** Exact authored match, used only for the corresponding Tamil translation. */
  readonly choice: number | null;
  readonly response: LocalResponse;
};

export type Session = {
  readonly turn: number;
  readonly replies: readonly Reply[];
  readonly pending: boolean;
  readonly facts: readonly string[];
  readonly details: readonly string[];
  readonly dialogue?: DialogueMemory;
};
export type SessionAction =
  | { readonly type: 'send'; readonly text: string }
  | { readonly type: 'receive' }
  | { readonly type: 'restart' };

export const MAX_REPLY_LENGTH = 600;
export const INITIAL_SESSION: Session = { turn: 0, replies: [], pending: false, facts: [], details: [] };

export function reduceSession(scenario: Scenario, state: Session, action: SessionAction): Session {
  if (action.type === 'restart') return INITIAL_SESSION;
  const turn = scenario.turns[state.turn];
  switch (action.type) {
    case 'send': {
      const text = action.text.trim();
      if (state.pending || !text || text.length > MAX_REPLY_LENGTH) return state;
      const previous = state.replies[state.replies.length - 1]?.response;
      const response = respondLocally(scenario, state.turn, text, {
        facts: state.facts,
        details: state.details,
        lastResponse: previous?.text ?? turn?.prompt ?? scenario.closing,
        fallbacks: state.replies.filter((reply) => reply.turn === state.turn && reply.response.kind === 'fallback').length,
        ...(previous?.offer ? { offer: previous.offer } : {}),
        ...(state.dialogue ? { dialogue: state.dialogue } : {}),
      });
      return { ...state, pending: true, replies: [...state.replies, { turn: state.turn, text, choice: response.choice, response }] };
    }
    case 'receive': {
      if (!state.pending) return state;
      const latest = state.replies[state.replies.length - 1];
      return { ...state, pending: false, facts: latest?.response.facts ?? state.facts, details: latest?.response.details ?? state.details, turn: state.turn + (latest?.response.advanceBy ?? 0), ...(latest?.response.dialogue ? { dialogue: latest.response.dialogue } : {}) };
    }
  }
}
