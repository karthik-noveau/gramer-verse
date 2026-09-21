import nlp from 'compromise';

/** Local language analysis only: no models, training, storage, or network calls.
 * The dialogue engine still decides intent, availability, and commitments. */
export function prepareEnglish(input: string): string {
  const doc = nlp(input.normalize('NFKC').replace(/[’‘]/g, "'"));
  doc.contractions().expand();
  doc.numbers().forEach(part => {
    // Keep IDs, numeric dates/times, and ordinal references unchanged. Only
    // convert spelled cardinal phrases; retain decimals/signs for validation.
    if (part.has('#Ordinal') || !part.has('#TextValue')) return;
    if (part.text().toLowerCase() === 'one' && part.lookBehind('(first|second|last|other|earlier|later|smaller|larger|former|latter)$').found) return;
    const parsed = nlp(part.text()).numbers().get(0);
    const number = Array.isArray(parsed) ? parsed[0] : parsed;
    if (typeof number === 'number' && Number.isFinite(number)) part.replaceWith(String(number));
  });
  return doc.text();
}

export function englishSentences(input: string): string[] {
  // Compromise knows that “Dr.” and “p.m.” are not sentence boundaries.
  // A terminal time abbreviation may also end a sentence before a question.
  return input.split(/(?<=\b[ap]\.m\.)\s+(?=(?:can|could|would|what|when|where|why|how|please)\b)/i)
    .flatMap(part => nlp(part).sentences().out('array') as string[]);
}

const REQUEST_VERBS = new Set(['send', 'confirm', 'update', 'deliver', 'change', 'reschedule', 'move', 'book', 'order', 'reserve', 'show', 'check', 'add', 'extend']);

export function politeRequest(text: string): string {
  return text.replace(/\bwould you mind (not )?([a-z]+ing)\b/g, (original, negative: string | undefined, word: string) => {
    const root = nlp(word).verbs().toInfinitive().text().trim();
    return REQUEST_VERBS.has(root) ? `could you ${negative ?? ''}${root}` : original;
  });
}

/** A past purchase is background, not permission to create another order.
 * Limit this to purchasing scenarios; reporting past events is important in
 * complaints and delivery tracking. Don't change tense to force an intent. */
export function isPastPurchase(text: string): boolean {
  if (/\b(?:want|need|would like|please|again|another)\b/.test(text)) return false;
  const doc = nlp(text);
  let past = false;
  doc.verbs().forEach(phrase => {
    if (!phrase.has('#PastTense') && !/\b(?:was|were|had)\b/.test(phrase.text())) return;
    const root = nlp(phrase.text()).verbs().toInfinitive().text();
    if (/\b(?:buy|purchase|order)\b/.test(root)) past = true;
  });
  return past;
}
