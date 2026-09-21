export type OfferId = 'notebooks' | 'tea';
export type Availability = {
  readonly id: OfferId;
  readonly product: RegExp;
  readonly otherProducts: RegExp;
  readonly otherVariants?: RegExp;
  readonly context: RegExp;
  readonly offer: string;
  readonly unavailable: string;
  readonly declined: string;
};

/** Stock belongs to the simulated shop, not to a real inventory service. */
export const AVAILABILITY: Readonly<Partial<Record<string, Availability>>> = {
  'place-an-order': {
    id: 'notebooks',
    product: /\bnotebooks?\b/,
    otherProducts: /\b(pens?|pencils?|erasers?|rulers?|books?|textbooks?|laptops?|computers?|phones?|mobiles?|shirts?|shoes?|bags?|bikes?|bicycles?|milk|coffee|tea|apples?|rice|headphones?|chargers?)\b/,
    otherVariants: /\b(red|green|black|yellow|pink|purple|white)\b/,
    context: /\b(blue|notebooks?|pair|couple|delivery|deliver|shipping|arrive|arrival|friday|help|hint|price|cost|order status|refund|cancel)\b/,
    offer: 'We have blue notebooks available. Would you like to order some?',
    unavailable: 'Sorry, we don’t have that. We only have blue notebooks. Would you like to order some?',
    declined: 'No problem! Let me know if you’d like any blue notebooks later.',
  },
  'order-at-a-cafe': {
    id: 'tea',
    product: /\btea\b/,
    otherProducts: /\b(coffee|latte|cappuccino|espresso|juice|smoothie|sandwich|pizza|burger|cake|soda|cola)\b/,
    context: /\b(tea|small|large|takeaway|take away|take out|to go|here|help|hint|price|cost|size|pay)\b/,
    offer: 'We have tea available. Would you like a cup?',
    unavailable: 'Sorry, we don’t have that. We’re serving tea today. Would you like a cup?',
    declined: 'No worries! Let me know if you change your mind.',
  },
};

const BROWSE = /\b(?:what (?:do you (?:have|sell|stock|serve)|is available|can i (?:buy|order))|what have you got|show me (?:the )?(?:menu|products)|anything (?:else|available))\b/;
const REQUEST = /\b(?:do you (?:have|sell|stock|serve)|have you got|(?:can|could|may) i (?:please )?(?:have|get|buy|order)|i (?:want|need|would like|am looking for)|looking for|order me|sell me)\b/;

/** Only explicit product requests are described as unavailable. An unclear
 * message gets an offer of help, not a made-up claim that an item was checked. */
export function inventoryIntent(stock: Availability, text: string): 'browse' | 'unavailable' | undefined {
  if (stock.otherProducts.test(text) || stock.otherVariants?.test(text)) return 'unavailable';
  if (BROWSE.test(text)) return 'browse';
  const request = REQUEST.exec(text);
  const item = request ? text.slice(request.index + request[0].length).replace(/\b(?:\d+|please|a|an|some|to|buy|order|get|have|thank|you|it|them|that|this|these|those|ones?)\b/g, '').trim() : '';
  if (item && !stock.product.test(text) && !stock.context.test(text)) return 'unavailable';
  return undefined;
}

export const ACCEPT_OFFER = /^(?:(?:yes|yeah|yep|sure|okay|ok|absolutely|certainly|go ahead|sounds good|that works)(?: (?:please|thanks|thank you))?|please|(?:yes )?(?:i (?:will|would like to|want to)|let me) (?:take|buy|order|have)(?: (?:it|them|some|that))?(?: please)?|i would like (?:some|them|that)(?: please)?|(?:2|a pair|a couple)(?: notebooks?)?(?: please)?)$/;
