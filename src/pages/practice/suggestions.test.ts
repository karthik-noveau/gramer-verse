import { SCENARIOS } from './data';
import { INITIAL_SESSION, reduceSession } from './session';
import { conversationSuggestions } from './suggestions';

describe('contextual conversation suggestions', () => {
  it.each(SCENARIOS.map(scenario => [scenario.id, scenario] as const))('never suggests a quiz distractor in %s', (_id, scenario) => {
    scenario.turns.forEach((turn, step) => {
      const { replies } = conversationSuggestions(scenario, step);
      expect(replies).toContain(turn.choices[turn.answer]!.text);
      turn.choices.forEach((choice, index) => {
        if (index !== turn.answer) expect(replies).not.toContain(choice.text);
      });
    });
  });

  it('offers yes/no for an actual outstanding offer', () => {
    const scenario = SCENARIOS[0]!;
    const state = reduceSession(scenario, reduceSession(scenario, INITIAL_SESSION, { type: 'send', text: 'Do you sell pens?' }), { type: 'receive' });
    expect(conversationSuggestions(scenario, state.turn, state.dialogue).replies).toContain('Yes, please.');
  });

  it('offers quantity replies after accepting the notebooks', () => {
    const scenario = SCENARIOS[0]!;
    const state = reduceSession(scenario, reduceSession(scenario, INITIAL_SESSION, { type: 'send', text: 'Do you have blue notebooks?' }), { type: 'receive' });
    expect(conversationSuggestions(scenario, state.turn, state.dialogue).replies).toContain('Three notebooks, please.');
  });
});
