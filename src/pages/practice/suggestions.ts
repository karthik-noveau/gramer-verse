import type { Scenario } from './data';
import { DIALOGUE_MODELS } from './dialogueModel';
import type { DialogueMemory } from './dialogueModel';

const DETAILS: Readonly<Record<string, readonly string[]>> = {
  quantity: ['Two, please.', 'Three notebooks, please.'],
  guests: ['Two people.', 'Three people.'],
  arrival: ['Friday.', 'Saturday.'],
  nights: ['Two nights.', 'Three nights.'],
  size: ['Small, please.', 'Large, please.'],
  takeaway: ['To take away, please.', 'For here, please.'],
  period: ['Morning, please.', 'Afternoon, please.'],
  time: ['2 p.m. works for me.', '4 p.m. works for me.'],
  name: ['My name is Arun.'],
  reference: ['4821.'],
  deadline: ['By Friday, please.'],
  night: ['One extra night, please.'],
};

/** Suggestions are conversational answers, never quiz distractors. */
export function conversationSuggestions(scenario: Scenario, step: number, memory?: DialogueMemory): { readonly hint: string; readonly replies: readonly string[] } {
  const turn = scenario.turns[step];
  const model = DIALOGUE_MODELS[scenario.id];
  if (!model) return { hint: '', replies: [] };
  if (!turn) return memory?.pendingChange ? { hint: 'Confirm the revision, ask a question, or keep the previous details.', replies: ['Yes, please.', 'No, thank you.', 'Recap'] }
    : { hint: 'Keep chatting, ask a follow-up question, or review your details.', replies: ['Recap', 'Thank you', 'Help'] };
  if (memory?.suspended) return { hint: 'Use Restart conversation to begin again.', replies: ['Help'] };
  if (memory?.pending) return { hint: 'Reply to your partner, or ask a question before deciding.', replies: ['Yes, please.', 'No, thank you.', 'Could you repeat that?'] };
  const key = model.stages[step]?.find(item => !memory?.values[item]);
  const field = model.fields.find(item => item.key === key);
  const specific: Readonly<Record<string, readonly string[]>> | undefined = scenario.id === 'plan-a-group-dinner' ? { guests: ['Twelve people.'], day: ['Friday.'], time: ['7 p.m.'], together: ['We would like to sit together.'], email: ['By email, please.'] }
    : scenario.id === 'handle-a-booking-mixup' ? { reference: ['H204.'], name: ['Kumar.'] }
      : scenario.id === 'change-a-reservation' ? { name: ['The booking is under Priya.'] } : undefined;
  const replies = memory && key ? specific?.[key] ?? DETAILS[key] : undefined;
  return { hint: memory ? field?.question ?? turn.task : turn.task, replies: replies ?? [turn.choices[turn.answer]!.text, 'Could you repeat that?', 'Help'] };
}
