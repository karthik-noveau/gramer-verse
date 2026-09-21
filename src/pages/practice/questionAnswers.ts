import type { Answer, DialogueModel } from './dialogueModel';

export const UNKNOWN_ANSWER: Answer = { match: /./, text: 'I don’t have a confirmed answer to that question.' };

export function questionTopic(text: string): string | undefined {
  return /\b(breakfast|refund|collection|delivery|tea|meeting|room)\b/.exec(text)?.[1];
}

/** Prefer a specific subject + requested attribute over a generic keyword.
 * Unknown attributes get an honest, topical answer with no completion flags. */
function specificAnswer(id: string, question: string): string | undefined {
  if (['book-a-room', 'change-a-reservation', 'handle-a-booking-mixup'].includes(id)) {
    if (/\bbreakfast\b/.test(question)) {
      if (/\b(?:when|time|hours?|start|end|finish)\b/.test(question)) return 'I don’t have the breakfast serving times. Please check the hours with reception.';
      if (/\b(?:where|location|floor|restaurant)\b/.test(question)) return 'I don’t have the location where breakfast is served. Reception can check that for you.';
      if (/\b(?:menu|food|serve|dishes|vegan|vegetarian|gluten|allerg\w*)\b/.test(question)) return 'I don’t have the breakfast menu or dietary details. Please check your requirements with the hotel.';
    }
    const facility = /\b(gym|spa|airport transfer|shuttle|lift|elevator|balcony|laundry|room service)\b/.exec(question)?.[1];
    if (facility) return `I don’t have confirmed details about ${facility === 'balcony' ? 'rooms with a balcony' : facility === 'gym' || facility === 'spa' || facility === 'lift' || facility === 'elevator' ? `a hotel ${facility}` : facility}. Reception would need to check that for you.`;
  }
  if (['order-at-a-cafe', 'correct-a-food-order', 'plan-a-group-dinner'].includes(id) && /\b(?:sugar|milk|decaf|caffeine|calories|allerg\w*|nuts?|gluten|dairy|ingredients?)\b/.test(question)) {
    if (id === 'correct-a-food-order') return 'I can’t confirm the ingredients or rule out cross-contact. Please don’t eat it until the kitchen has checked your allergy requirements.';
    if (id === 'plan-a-group-dinner') return 'Vegetarian options are available, but I can’t confirm allergy-safe or vegan dishes. Please check the group’s requirements with the kitchen before confirming.';
    return 'I can’t confirm the ingredients or allergy requirements. Please check with the barista before ordering.';
  }
  if (id === 'resolve-a-damaged-delivery' && /\b(?:refund|money back)\b/.test(question) && /\b(?:when|how long|time|days|processing|receive)\b/.test(question)) return 'I don’t have a confirmed refund-processing time. I can note your request, but I can’t promise when the money would arrive.';
  if (['place-an-order', 'track-a-delivery', 'resolve-a-damaged-delivery'].includes(id) && /\b(?:delivery|shipping|collection)\b/.test(question) && /\b(?:free|price|cost|charge|fee|pay|how much)\b/.test(question)) return 'I don’t have a confirmed delivery or collection fee, so I can’t promise that it is free.';
  if (/\b(?:discount|coupon|promo code)\b/.test(question)) return 'I don’t have any confirmed discount or coupon details. I wouldn’t want to promise a lower price.';
  return undefined;
}

export function unsupportedRequirement(id: string, requests: readonly string[]): string | undefined {
  for (const request of requests) {
    if (/\b(?:do not need|do not have|no need for|no allergies)\b/.test(request)) continue;
    const answer = specificAnswer(id, request);
    if (answer) return `${answer} I haven’t confirmed that request. What would you prefer to do?`;
  }
  return undefined;
}

export function answerQuestions(id: string, model: DialogueModel, questions: readonly string[], includeUnknown = true, previousTopic?: string): Answer[] {
  const answers: Answer[] = [];
  let topic = previousTopic;
  for (const original of questions) {
    const explicitTopic = questionTopic(original);
    topic = explicitTopic ?? topic;
    const question = !explicitTopic && topic && /\b(?:it|that)\b/.test(original) ? original.replace(/\b(?:it|that)\b/g, topic) : original;
    const specific = specificAnswer(id, question);
    if (specific) {
      answers.push({ match: /./, text: specific });
      continue;
    }
    const matches = model.answers.filter(answer => answer.match.test(question));
    if (matches.length) answers.push(...matches);
    else if (includeUnknown) answers.push(UNKNOWN_ANSWER);
  }
  return [...new Set(answers)].filter((answer, index, all) => typeof answer.text !== 'string' || all.findIndex(item => item.text === answer.text) === index);
}
