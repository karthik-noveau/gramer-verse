/** The local partner's knowledge and conversation state. No remote service,
 * generated facts, or real orders/bookings are involved. */
export type Values = Readonly<Record<string, string>>;
export type Pending = { readonly values: Values; readonly no?: Values; readonly question?: string };
export type DialogueMemory = {
  readonly values: Values;
  readonly pending?: Pending;
  readonly suspended?: boolean;
  readonly alternatives?: { readonly key: string; readonly options: readonly string[] };
  /** A revision after completion is proposed, not applied, until accepted. */
  readonly pendingChange?: Values;
  /** Last explicit question subject, for short follow-ups such as “Is it included?” */
  readonly topic?: string;
};
export type Field = {
  readonly key: string;
  readonly question: string;
  readonly read?: (text: string, awaiting: boolean) => string | undefined;
  readonly yes?: string;
  readonly no?: string;
  readonly options?: readonly string[];
};
export type Answer = {
  readonly match: RegExp;
  readonly text: string | ((values: Values) => string);
  readonly fills?: Values;
};
export type DialogueModel = {
  readonly stages: readonly (readonly string[])[];
  readonly fields: readonly Field[];
  readonly defaults: Values;
  readonly answers: readonly Answer[];
  readonly prompts: readonly ((values: Values) => string)[];
  readonly confirmations?: Readonly<Record<number, Pending>>;
  readonly finish: (values: Values) => string;
  readonly validate?: (text: string, values: Values) => string | undefined;
};

const flag = (key: string, pattern: RegExp, question: string, yes?: string, no?: string): Field => ({
  key, question, read: text => pattern.test(text) ? 'yes' : undefined,
  ...(yes ? { yes } : {}), ...(no ? { no } : {}),
});
const value = (key: string, question: string, read: NonNullable<Field['read']>): Field => ({ key, question, read });
const asked = (key: string, question: string, yes?: string): Field => ({ key, question, ...(yes ? { yes } : {}) });
const capture = (pattern: RegExp, text: string): string | undefined => pattern.exec(text)?.[1];
const day = (text: string): string | undefined => capture(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today)\b/, text);
const count = (text: string): string | undefined => capture(/\b([1-9]\d?)\b/, text) ?? (/\b(pair|couple)\b/.test(text) ? '2' : undefined);
const title = (text: string): string => text.replace(/\b\w/g, letter => letter.toUpperCase());
const price = /\b(price|cost|how much|total|rate|charge|amount|pay)\b/;
const timing = /\b(when|how long|what time|what day|delivery date|arrival|arrive|eta)\b/;
const confirmation = /\b(confirm|confirmation|email|message|text|writing|written)\b/;
const accept = /\b(yes|sure|okay|ok|fine|great|perfect|agreed|certainly|absolutely|works?|accept|go ahead|sounds good|no problem|thank you|thanks)\b/;
const roomRate: Answer = { match: price, text: 'I don’t have a room rate to quote, but I can help with the dates and what’s included.' };
const breakfast: Answer = { match: /\bbreakfast\b/, text: 'Yes, breakfast is included.', fills: { breakfast: 'yes' } };
const reference = (expected: string, label: string): Field => value('reference', `Could you share your ${label}?`, text => new RegExp(`\\b${expected}\\b`).test(text) ? expected : undefined);
const wrongReference = (expected: string, pattern: RegExp) => (text: string): string | undefined => {
  const found = text.match(pattern)?.[0];
  return found && found !== expected ? `I can’t find ${found.toUpperCase()}. Could you check the reference? The reference on the example confirmation is ${expected.toUpperCase()}.` : undefined;
};

export const DIALOGUE_MODELS: Readonly<Record<string, DialogueModel>> = {
  'place-an-order': {
    stages: [['product', 'colour'], ['quantity'], ['arrival']],
    defaults: { quantity: '2', colour: 'blue', product: 'yes' },
    fields: [
      flag('product', /\bnotebooks?\b/, 'What would you like to order? We have blue notebooks available.'),
      flag('colour', /\bblue\b/, 'We have blue notebooks available. Would you like to order some?', 'yes'),
      value('quantity', 'How many notebooks would you like?', (text, awaiting) => /\b(notebooks?|make it|change (?:it|that|the quantity) to)\b/.test(text) || awaiting ? count(text) : undefined),
      asked('arrival', 'Shall I arrange delivery? They would arrive on Friday.', 'yes'),
    ],
    answers: [
      { match: timing, text: 'Your notebooks would arrive on Friday.', fills: { arrival: 'yes' } },
      { match: price, text: 'I don’t have a notebook price to quote, but I can help with availability and delivery.' },
      { match: /\bcolou?rs?\b|\bwhy\b.*\bblue\b/, text: 'We only have blue notebooks at the moment.' },
    ],
    prompts: [() => 'What would you like to order? We have blue notebooks available.', () => 'Yes, we do. How many would you like?', v => `${v.quantity === '2' ? 'Two' : v.quantity} blue notebook${v.quantity === '1' ? '' : 's'}. Shall I arrange delivery?`],
    confirmations: { 2: { values: { arrival: 'yes' } } },
    finish: () => 'They will arrive on Friday. Thank you for your order!',
    validate: text => /\b(?:0|\d{3,})\s*(?:blue )?notebooks?\b/.test(text) ? 'How many would you like? Please choose a quantity between 1 and 99.' : undefined,
  },
  'meet-a-colleague': {
    stages: [['name'], ['team'], ['room']], defaults: { name: 'Arun' },
    fields: [
      value('name', 'Nice to meet you! What’s your name?', (text, awaiting) => {
        const named = capture(/\b(?:my name is|name is|call me) ([a-z]+(?: [a-z]+)?)(?=\b)/, text)
          ?? (awaiting ? capture(/\b(?:i am|this is) ([a-z]+(?: [a-z]+)?)(?=\b)/, text) : undefined);
        const name = named?.split(/\s+(?:and|from|nice|please|what|new|here)\b/)[0]
          ?? (awaiting && /^[a-z]{2,20}(?: [a-z]{2,20})?$/.test(text) && !/\b(hello|hi|thanks|help|yes|no|okay|fine|good|new)\b/.test(text) ? text : undefined);
        return name && !/\b(not|looking|new|fine|good|here|sorry|happy|ready|working|tired|busy|hungry|in|on|at|urgent)\b/.test(name) ? title(name) : undefined;
      }),
      asked('team', 'Would you like to know about my team or role?', 'yes'),
      flag('room', /\b(meeting|conference|board)\s*(room|hall)|\b(where|directions|show|take|find|way)\b.{0,35}\bmeeting\b/, 'Would you like me to show you where the meeting room is?', 'yes'),
    ],
    answers: [
      { match: /\b(your name|who are you)\b/, text: 'I’m Maya. Nice to meet you!' },
      { match: /\b(team|department|what do you do|role|where do you work)\b/, text: 'I work in the design team.', fills: { team: 'yes' } },
      { match: /\b(meeting|conference|board)\s*(room|hall)\b/, text: 'The meeting room is just down the hall.', fills: { room: 'yes' } },
    ],
    prompts: [() => 'Nice to meet you! What’s your name?', v => `Nice to meet you too, ${v.name}. What would you like to know?`, () => 'I work in the design team. Our welcome meeting starts soon. Would you like me to show you the meeting room?'],
    confirmations: { 2: { values: { room: 'yes' } } },
    finish: () => 'Of course. It’s just down the hall. Let’s go together.',
  },
  'book-a-room': {
    stages: [['room', 'guests'], ['arrival', 'nights'], ['breakfast']], defaults: { guests: '2', arrival: 'friday', nights: '2' },
    fields: [
      flag('room', /\b(room|reservation|reserve|book|booking|stay|accommodation)\b/, 'Would you like to book a room?', 'yes'),
      value('guests', 'How many people is the room for?', (text, awaiting) => capture(/\b([1-9]\d?)\s*(?:people|persons?|guests?|adults?|of us)\b|\bfor ([1-9]\d?)(?!\d|\s*nights?)\b/, text) ?? capture(/\bfor ([1-9]\d?)(?!\d|\s*nights?)\b/, text) ?? (/\b(double room|a couple)\b/.test(text) ? '2' : awaiting && /^\d+(?: please)?$/.test(text) ? count(text) : undefined)),
      value('arrival', 'On which day will you arrive?', text => day(text)),
      value('nights', 'How long will you stay?', (text, awaiting) => capture(/\b([1-9]\d?)\s*nights?\b/, text) ?? (awaiting && /^\d+(?: please)?$/.test(text) ? count(text) : undefined)),
      asked('breakfast', 'Would you like to know whether breakfast is included?', 'yes'),
    ],
    answers: [breakfast, roomRate, { match: /\b(check in|check out|wifi|wi fi|parking|pool|pets?|children|cancel|payment)\b/, text: 'I don’t have those hotel details, so I wouldn’t want to give you the wrong information. We can still discuss your room, dates, and breakfast.' }],
    prompts: [() => 'Would you like to book a room?', () => 'Certainly. When will you arrive, and how long will you stay?', v => `A room for ${v.guests} guest${v.guests === '1' ? '' : 's'}, arriving ${title(v.arrival!)} for ${v.nights} night${v.nights === '1' ? '' : 's'}. Do you have any questions?`],
    finish: v => `Yes, breakfast is included. I’ve noted a room for ${v.guests} guest${v.guests === '1' ? '' : 's'} from ${title(v.arrival!)} for ${v.nights} night${v.nights === '1' ? '' : 's'}. We look forward to welcoming you.`,
    validate: text => /\b(?:0|\d{3,})\s*(?:guests?|people|nights?)\b/.test(text) ? 'Could you check the number of guests and nights? I need a positive number below 100.' : undefined,
  },
  'order-at-a-cafe': {
    stages: [['drink'], ['size', 'takeaway'], ['price']], defaults: { size: 'small', takeaway: 'to take away' },
    fields: [
      flag('drink', /\btea\b/, 'What would you like to drink? We’re serving tea today.'),
      { ...value('size', 'Would you like a small or a large tea?', text => capture(/\b(small|large)\b/, text) ?? (/\blittle\b/.test(text) ? 'small' : undefined)), options: ['small', 'large'] },
      value('takeaway', 'Is that for here or to take away?', text => /\b(take away|takeaway|take out|takeout|to go|carry out)\b/.test(text) ? 'to take away' : /\b(for here|dine in|eat in|drink here|have it here)\b/.test(text) ? 'for here' : undefined),
      asked('price', 'Anything else you’d like to know about your order?'),
    ],
    answers: [
      { match: price, text: v => v.size === 'large' ? 'I don’t have the price for a large tea. A small tea is fifty rupees.' : 'A small tea is fifty rupees.', fills: { price: 'yes' } },
      { match: /\b(sizes?|small or large)\b/, text: 'We have small and large cups of tea.' },
      { match: /\b(sugar|milk|decaf|allerg|ingredients?)\b/, text: 'I don’t have the ingredient details. Please check with the barista before choosing, especially if you have an allergy.' },
    ],
    prompts: [() => 'What would you like to drink?', () => 'Of course. Small or large? And is that for here or to take away?', v => `A ${v.size} tea ${v.takeaway}. Anything else?`],
    finish: v => v.size === 'large' ? `A large tea ${v.takeaway}. I don’t have a confirmed price for that size, so please check the price before paying.` : `That’s fifty rupees, please. Your small tea ${v.takeaway} will be ready shortly.`,
  },
  'track-a-delivery': {
    stages: [['order', 'delay'], ['reference'], ['day', 'period', 'confirmation']], defaults: { day: 'tomorrow', period: 'afternoon' },
    fields: [
      flag('order', /\b(order|parcel|package|delivery|shipment)\b/, 'Which delivery are you contacting us about?'),
      flag('delay', /\b(late|delay\w*|missing|not (?:arrived|received|delivered)|never arrived|still waiting|did not (?:arrive|come)|has not (?:arrived|come)|have not (?:received|got))\b/, 'Has your delivery arrived, or are you still waiting?'),
      reference('4821', 'order number'),
      value('day', 'We can deliver tomorrow. Would that work for you?', text => /\btomorrow\b/.test(text) ? 'tomorrow' : /\b(morning|afternoon)\b/.test(text) ? 'tomorrow' : undefined),
      { ...value('period', 'Would you prefer morning or afternoon?', text => capture(/\b(morning|afternoon)\b/, text) ?? (/\bpm\b/.test(text) ? 'afternoon' : undefined)), options: ['morning', 'afternoon'] },
      { ...flag('confirmation', confirmation, 'Would you like the time confirmed by message?', 'message', 'none'), read: text => /\b(email|message|text|sms|written|writing|confirm|confirmation)\b/.test(text) ? (/\bemail\b/.test(text) ? 'email' : 'message') : undefined },
    ],
    answers: [
      { match: /\b(why|reason|what happened|status|where|track)\b/, text: 'The courier was delayed. We can arrange delivery for tomorrow.' },
      { match: /\b(when|what time|slots?|available)\b/, text: 'We have delivery slots tomorrow morning and afternoon.' },
      { match: /\b(phone|call|driver|courier number)\b/, text: 'I don’t have the courier’s contact number. I can help choose a delivery slot and a confirmation message.' },
    ],
    prompts: [() => 'What has happened to your delivery?', () => 'I’m sorry about the delay. Could you give me your order number?', () => 'The courier was delayed. We can deliver tomorrow morning or afternoon.'],
    finish: v => `Delivery is arranged for tomorrow ${v.period}.${v.confirmation === 'none' ? ' No confirmation message requested.' : ` I’ll confirm the time by ${v.confirmation === 'email' ? 'email' : 'message'}.`}`,
    validate: (text) => wrongReference('4821', /\b\d{4,}\b/)(text) ?? (/\b(today|tonight|yesterday)\b/.test(text) && /\b(deliver|instead|can you|want|need)\b/.test(text) ? 'I’m sorry, the available slots are tomorrow morning or afternoon. Which would suit you?' : undefined),
  },
  'reschedule-a-meeting': {
    stages: [['change'], ['time'], ['invitation']], defaults: { time: '2 p.m.' },
    fields: [
      flag('change', /\b(move|reschedule|change|postpone|shift|clash|conflict|another (?:meeting|call)|cannot (?:make|attend)|not available|busy|not free)\b/, 'Would you like to move our meeting?', 'yes'),
      { ...value('time', 'I’m free at 2 p.m. or 4 p.m. Which works for you?', text => /\b(?:4\s*(?:pm)?|16(?::00)?)\b/.test(text) ? '4 p.m.' : /\b(?:2\s*(?:pm)?|14(?::00)?)\b/.test(text) ? '2 p.m.' : undefined), options: ['2 p.m.', '4 p.m.'] },
      flag('invitation', /\b(update|send|resend|change|revise|amend)\b.{0,30}\b(invite|invitation|calendar|it)\b/, 'Could you update the calendar invitation?', 'yes'),
    ],
    answers: [
      { match: /\b(when|what time|available|free|2|4)\b/, text: 'I’m free at 2 p.m. or 4 p.m.' },
      { match: /\b(why|reason)\b/, text: 'We’re working around a scheduling clash. Either afternoon slot works for me.' },
    ],
    prompts: [() => 'Would you like to move our meeting?', () => 'No problem. I’m free at 2 p.m. or 4 p.m.', v => `${v.time} works for me. Could you update the calendar invitation?`],
    confirmations: { 2: { values: { invitation: 'yes' } } },
    finish: v => `Perfect. See you at ${v.time} tomorrow. Thanks for updating the invitation.`,
    validate: text => /\b(?:2|4)\s*am\b|\b\d{1,2}:[1-5]\d\b|\b(?:1|3|5|6|7|8|9|10|11|12)\s*(?:am|pm)\b/.test(text) ? 'I’m only free at 2 p.m. or 4 p.m. Would either of those work?' : undefined,
  },
  'change-a-reservation': {
    stages: [['name', 'extend', 'night'], ['cost'], ['confirmation']], defaults: { name: 'Priya', night: '1' },
    fields: [
      flag('name', /\bpriya\b/, 'What name is the booking under? The example reservation is under Priya.'),
      flag('extend', /\b(extra|additional|another|add|extend|longer|more)\b/, 'What change would you like to make to your stay?'),
      value('night', 'How many extra nights would you like?', (text, awaiting) => capture(/\b(1)\s*(?:extra |more |additional )?night\b/, text) ?? (/\b(another|an extra|an additional) night\b/.test(text) || (awaiting && /^1(?: please)?$/.test(text)) ? '1' : undefined)),
      asked('cost', 'Would you like to know the total cost including the extra night?', 'yes'),
      flag('confirmation', confirmation, 'Would you like me to extend the stay and email the updated confirmation?', 'yes'),
    ],
    answers: [
      { match: price, text: 'The total with one extra night is six thousand rupees, including breakfast.', fills: { cost: 'yes' } },
      { match: /\bbreakfast\b/, text: 'Breakfast is included in the revised total.' },
    ],
    prompts: [() => 'What name is the booking under, and what would you like to change?', () => 'Yes, the room is available for an extra night.', () => 'The new total is six thousand rupees, including breakfast. Would you like to go ahead and receive an email confirmation?'],
    confirmations: { 2: { values: { confirmation: 'yes' } } },
    finish: () => 'Your stay has been extended by one night. I’ve sent the new confirmation to your email.',
    validate: text => /\b([2-9]|\d{2,})\s*(?:extra |more |additional )?nights?\b/.test(text) ? 'I can confirm availability and a total for one extra night only. Would you like to add one night?' : /\bunder (?!priya\b)[a-z]+\b/.test(text) ? 'I can only find the reservation under Priya. Could you check the booking name?' : undefined,
  },
  'correct-a-food-order': {
    stages: [['vegetarian', 'dish'], ['wait'], ['accept']], defaults: {},
    fields: [
      flag('vegetarian', /\b(vegetarian|veg|meat free|no meat|without meat|do not eat meat)\b/, 'Which dish did you order? Was it the vegetarian pasta?', 'yes'),
      flag('dish', /\b(pasta|dish|order|ordered|chicken|meal|food)\b/, 'Could you tell me which dish needs to be replaced?'),
      asked('wait', 'Shall I bring you the vegetarian pasta? It will take about ten minutes.', 'yes'),
      flag('accept', accept, 'It will take about ten minutes. Is that okay with you?', 'yes'),
    ],
    answers: [
      { match: /\b(how long|when|wait|minutes)\b/, text: 'The replacement vegetarian pasta will take about ten minutes.', fills: { wait: 'yes' } },
      { match: /\b(allerg|nuts?|gluten|dairy|ingredients?)\b/, text: 'I can’t confirm the ingredients or rule out cross-contact. Please don’t eat it until the kitchen has checked your allergy requirements.' },
      { match: /\b(why|wrong|mistake)\b/, text: 'I’m sorry about the mix-up. You received chicken pasta instead of the vegetarian dish.' },
    ],
    prompts: [() => 'I’m sorry. Which dish did you order?', () => 'I’m sorry about that. Shall I bring you the correct dish?', () => 'It will take about ten minutes. Is that all right?'],
    confirmations: { 1: { values: { wait: 'yes' } }, 2: { values: { accept: 'yes' } } },
    finish: () => 'Thank you for your patience. I’ll bring the vegetarian pasta as soon as it’s ready.',
  },
  'resolve-a-damaged-delivery': {
    stages: [['damage', 'photos'], ['deadline', 'refund'], ['delivery', 'collection', 'written']], defaults: { deadline: 'friday' },
    fields: [
      flag('damage', /\b(crack\w*|broke\w*|damage\w*|shatter\w*)\b/, 'Could you describe the damage to the lamp?'),
      flag('photos', /\b(photos?|pictures?|images?|photographs?)\b/, 'Do you have photos of the damage?', 'yes', 'unavailable'),
      value('deadline', 'By which day do you need the replacement?', text => day(text)),
      flag('refund', /\b(refund|money back|reimburse\w*)\b/, 'If the replacement cannot arrive in time, would you prefer a refund?', 'yes', 'no'),
      flag('delivery', /\b(deliver\w*|replacement|friday)\b/, 'Shall I confirm the replacement delivery for Friday?', 'yes'),
      flag('collection', /\b(collect\w*|pick ?up|return|both)\b/, 'Would you also like confirmation of the damaged lamp’s collection?', 'yes', 'none'),
      flag('written', confirmation, 'Would you like the arrangements confirmed in writing?', 'yes', 'none'),
    ],
    answers: [
      { match: timing, text: 'A replacement can arrive by Friday. We can collect the damaged lamp at the same time.' },
      { match: /\b(collect\w*|pick ?up|return)\b/, text: 'The damaged lamp can be collected when the replacement arrives on Friday.' },
      { match: /\b(refund|money back)\b/, text: 'A refund is an alternative if the replacement cannot arrive in time. I don’t have a refund-processing time to quote.' },
    ],
    prompts: [() => 'Could you describe the damage to the lamp?', () => 'I’m sorry the lamp arrived damaged. We can look at a replacement. When do you need it?', () => 'We can deliver a replacement by Friday and collect the damaged lamp at the same time. Would you like both arrangements confirmed in writing?'],
    confirmations: { 2: { values: { delivery: 'yes', collection: 'yes', written: 'yes' } } },
    finish: v => v.resolution === 'refund' ? 'I’ve noted your request for a refund for the damaged lamp. I can summarise the request, but I don’t have a confirmed refund amount or processing time.' : `Agreed: replacement delivery by Friday${v.collection === 'none' ? ', with collection still to be arranged' : ' and collection of the damaged lamp at the same time'}.${v.written === 'none' ? ' No written confirmation requested.' : ' I’ll confirm the details in writing.'}`,
    validate: (text, v) => v.deadline && v.deadline !== 'friday' && /\b(?:monday|tuesday|wednesday|thursday|saturday|sunday|tomorrow|today)\b/.test(text) ? 'Friday is the delivery date I can confirm. Would Friday work, or would you prefer to discuss a refund?' : undefined,
  },
  'negotiate-a-deadline': {
    stages: [['data', 'wednesday', 'constraint'], ['draft', 'thursday', 'final', 'monday'], ['flag', 'risks', 'impact']], defaults: {},
    fields: [
      flag('data', /\b(data|figures|numbers|information)\b/, 'What is preventing you from completing the report?'),
      flag('wednesday', /\bwednesday\b/, 'When does the data arrive?'),
      flag('constraint', /\b(difficult|tight|challeng\w*|not enough|cannot|not possible|need more|not ready|too soon|not finish|not complete|more time)\b/, 'How does that affect the Thursday deadline?'),
      flag('draft', /\bdraft\b/, 'What could you share before the final report is ready?'),
      flag('thursday', /\bthursday\b/, 'When could you share the draft?'),
      flag('final', /\b(final|reviewed|complete|finished)\b/, 'What will you deliver after the draft?'),
      flag('monday', /\bmonday\b/, 'When would the reviewed final report be ready?'),
      flag('flag', /\b(highlight|flag|list|explain|mention|document|note|mark|identify)\b/, 'Can you flag unresolved issues in the draft?', 'yes'),
      flag('risks', /\b(risks?|unresolved|issues?|problems?|uncertaint\w*)\b/, 'What will you flag in the draft?'),
      flag('impact', /\b(impact|effects?|consequences?|context|affect|mean)\b/, 'Could you also explain their impact for the client?', 'yes'),
    ],
    answers: [
      { match: /\bdata\b/, text: 'The data arrives on Wednesday, leaving little review time before Thursday.' },
      { match: /\b(why|client|urgency)\b/, text: 'The client wants an early update on Thursday. A clearly labelled draft could show progress without presenting unreviewed work as final.' },
      { match: /\b(risks?|impact|unresolved)\b/, text: 'Flag unresolved points and explain how they could affect the conclusions, so the client knows what still needs review.' },
      { match: /\b(deadline|draft|final|monday|thursday)\b/, text: 'A draft on Thursday and a reviewed final report on Monday would work. Could you offer that plan?' },
    ],
    prompts: [() => 'What makes the Thursday deadline difficult?', () => 'We still need to show progress. What could you share by Thursday?', () => 'That sounds reasonable. Can you flag any risks in the draft?'],
    confirmations: { 2: { values: { flag: 'yes', risks: 'yes' } } },
    finish: () => 'Agreed: draft on Thursday, final report on Monday. Thanks for proposing a workable plan.',
    validate: text => /\bfinal\b.{0,18}\bthursday\b|\bdraft\b.{0,18}\bmonday\b/.test(text) ? 'Just to check, I can agree to a draft on Thursday and the reviewed final report on Monday. Would that plan work?' : undefined,
  },
  'handle-a-booking-mixup': {
    stages: [['reference', 'name'], ['quiet', 'rate'], ['acceptRate', 'update']], defaults: {},
    fields: [
      reference('h204', 'confirmation reference'), flag('name', /\bkumar\b/, 'What surname is the reservation under? The example confirmation says Kumar.'),
      flag('quiet', /\b(quiet|peaceful|not noisy|away from (?:the )?(?:street|road)|less noise)\b/, 'What matters most to you about the room?'),
      flag('rate', /\b(same|unchanged|original|confirmed|no extra|no additional|without extra)\b/, 'Would you like an alternative at the same confirmed rate?', 'yes'),
      flag('acceptRate', /\b(same|unchanged|original|confirmed|no extra|no additional|without extra)\b/, 'Does the courtyard room work for you at the same confirmed rate?', 'yes'),
      flag('update', /\b(update|change|confirm|reserve|book|ready|let me know|notify)\b/, 'Would you like me to update the reservation and tell you when the room is ready?', 'yes'),
    ],
    answers: [
      { match: /\b(how long|when|ready)\b/, text: 'The courtyard room will be ready in thirty minutes.' },
      { match: price, text: 'The courtyard room is available at the same confirmed rate. There’s no extra charge.' },
      { match: /\b(quiet|noise|noisy|courtyard)\b/, text: 'The courtyard room is the quiet alternative we can offer.' },
    ],
    prompts: [() => 'Do you have your confirmation reference and booking surname?', () => 'Thank you, I found the confirmation. What matters most to you about an alternative room?', () => 'I can offer a quiet courtyard room at the same rate, ready in thirty minutes. Shall I update your reservation?'],
    confirmations: { 2: { values: { acceptRate: 'yes', update: 'yes' } } },
    finish: () => 'The rate is unchanged. I’ve updated your reservation and will let you know as soon as the room is ready.',
    validate: wrongReference('h204', /\b[a-z]\d{3,}\b/),
  },
  'plan-a-group-dinner': {
    stages: [['guests', 'day', 'time', 'together'], ['adjacent', 'vegetarian'], ['confirm', 'email', 'menu']], defaults: { guests: '12', day: 'friday', time: '7 p.m.' },
    fields: [
      value('guests', 'How many people will be coming?', (text, awaiting) => capture(/\b([1-9]\d?)\s*(?:people|colleagues|guests|persons|of us)\b/, text) ?? (awaiting ? count(text) : undefined)),
      value('day', 'Which day would you like to book?', text => day(text)),
      value('time', 'What time would you like?', (text, awaiting) => /\b7\s*pm\b|\b19(?::00)?\b/.test(text) || (awaiting && /^7(?: please)?$/.test(text)) ? '7 p.m.' : undefined),
      flag('together', /\b(together|same table|sit together|seating together)\b/, 'Would you like your group to sit together?', 'yes'),
      flag('adjacent', /\b(adjacent|next to|beside|neighbou?ring|side by side)\b/, 'Are two tables next to each other suitable?', 'yes'),
      flag('vegetarian', /\b(vegetarian|veg|meat free|no meat|without meat)\b/, 'Do you need vegetarian choices for the group?', 'yes', 'none'),
      flag('confirm', /\b(yes|confirm|agreed|go ahead|book)\b/, 'Shall I confirm the booking?', 'yes'),
      { ...value('email', 'Would you like the booking confirmation by email?', text => /\b(email|writing|written)\b/.test(text) ? 'yes' : undefined), yes: 'yes' },
      flag('menu', /\bmenu\b/, 'Would you like the menu sent with the confirmation?', 'yes', 'none'),
    ],
    answers: [
      { match: /\b(vegetarian|veg|meat free)\b/, text: 'Yes, several vegetarian dishes are available.', fills: { vegetarian: 'yes' } },
      { match: /\b(tables?|seating|together)\b/, text: 'We can arrange two tables next to each other for the group.' },
      { match: /\b(menu|price|cost|how much|deposit|cancel)\b/, text: 'I can include the menu with your confirmation. I don’t have dish prices, deposit details, or a cancellation policy to quote.' },
      { match: /\b(allerg|nuts?|gluten|dairy|vegan)\b/, text: 'Vegetarian options are available, but I can’t confirm allergy-safe or vegan dishes. Please check the group’s requirements with the kitchen before confirming.' },
    ],
    prompts: [() => 'How many people, which day, and what time would you like?', () => 'We can arrange two tables next to each other. Would that be suitable?', v => `${v.vegetarian === 'none' ? 'No vegetarian choices requested.' : 'Yes, several vegetarian dishes are available.'} Shall I confirm the booking?`],
    confirmations: { 1: { values: { adjacent: 'yes' } }, 2: { values: { confirm: 'yes' } } },
    finish: v => `Confirmed: ${v.guests} people, ${title(v.day!)} at ${v.time}, at adjacent tables. I’ll email the details${v.menu === 'none' ? '' : ' and the menu'}. We look forward to welcoming your group.`,
    validate: text => /\b(?!12\b)\d+\s*(?:people|colleagues|guests|persons)\b|\b(saturday|sunday|monday|tuesday|wednesday|thursday)\b|\b7\s*am\b|\b\d{1,2}:[1-5]\d\b|\b[1-689]\s*pm\b/.test(text) ? 'The arrangement I can offer is for twelve people on Friday at 7 p.m., at two adjacent tables. Would that work for your group?' : undefined,
  },
};
