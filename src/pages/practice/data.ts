export const LEVELS = [
  { id: 'beginner', label: 'Beginner', description: 'Short replies & everyday phrases', ta: 'தொடக்க நிலை' },
  { id: 'intermediate', label: 'Intermediate', description: 'Explain, request & solve problems', ta: 'இடைநிலை' },
  { id: 'advanced', label: 'Advanced', description: 'Negotiate & handle complex situations', ta: 'மேம்பட்ட நிலை' },
] as const;

export const CATEGORIES = [
  { id: 'orders', label: 'Online orders' },
  { id: 'office', label: 'Office' },
  { id: 'hotel', label: 'Hotel bookings' },
  { id: 'dining', label: 'Cafés & dining' },
] as const;

export type Level = (typeof LEVELS)[number]['id'];
export type Category = (typeof CATEGORIES)[number]['id'];
export type Choice = { readonly text: string; readonly feedback: string };
export type ConversationTurn = {
  readonly prompt: string;
  readonly tamil: string;
  readonly task: string;
  readonly choices: readonly Choice[];
  readonly answer: number;
  readonly replyTamil: string;
};
export type Scenario = {
  readonly id: string;
  readonly level: Level;
  readonly category: Category;
  readonly title: string;
  readonly summary: string;
  readonly role: string;
  readonly partner: string;
  readonly goal: string;
  readonly skills: readonly string[];
  readonly turns: readonly ConversationTurn[];
  readonly closing: string;
  readonly closingTamil: string;
};

type Draft = Omit<ConversationTurn, 'choices' | 'answer' | 'replyTamil'> & {
  readonly reply: readonly [english: string, tamil: string, explanation: string];
  readonly alternatives: readonly [readonly [string, string], readonly [string, string]];
};

// Authored replies, not AI-generated chat. Correct answers occupy different
// positions; retrying a turn must never shuffle an answer under the pointer.
function turn({ reply, alternatives, ...draft }: Draft, answer: 0 | 1 | 2): ConversationTurn {
  const choices: Choice[] = alternatives.map(([text, feedback]) => ({ text, feedback }));
  choices.splice(answer, 0, { text: reply[0], feedback: reply[2] });
  return { ...draft, choices, answer, replyTamil: reply[1] };
}

export const SCENARIOS: readonly Scenario[] = [
  {
    id: 'place-an-order', level: 'beginner', category: 'orders', title: 'Place an online order',
    summary: 'Ask about a product and arrange delivery.', role: 'Customer', partner: 'Store assistant',
    goal: 'Order blue notebooks, choose a quantity, and discuss delivery.', skills: ['Polite requests', 'How many', 'Future time'],
    turns: [
      turn({ prompt: 'Hello! How can I help you today?', tamil: 'வணக்கம்! இன்று உங்களுக்கு எப்படி உதவலாம்?', task: 'Ask whether blue notebooks are available.',
        reply: ['Do you have blue notebooks?', 'உங்களிடம் நீல நிற நோட்டுப் புத்தகங்கள் உள்ளனவா?', 'Use “Do you have…?” to ask whether a shop has something.'],
        alternatives: [['You has blue notebooks?', 'With “you”, use “have”, not “has”. Start this question with “Do”.'], ['Where is my delivery?', 'You have not placed the order yet. First ask about the product.']],
      }, 1),
      turn({ prompt: 'Yes, we do. How many would you like?', tamil: 'ஆம், உள்ளன. உங்களுக்கு எத்தனை வேண்டும்?', task: 'Order two notebooks politely.',
        reply: ["I'd like two notebooks, please.", 'எனக்கு இரண்டு நோட்டுப் புத்தகங்கள் வேண்டும், தயவுசெய்து.', '“I’d like” is a polite way to order. Use the plural “notebooks” after “two”.'],
        alternatives: [["I'd like two notebook, please.", 'After “two”, use the plural form “notebooks”.'], ['I am two notebooks.', 'Use “I’d like” to say what you want. “I am” describes who you are.']],
      }, 0),
      turn({ prompt: 'Two blue notebooks. Shall I arrange delivery?', tamil: 'இரண்டு நீல நிற நோட்டுப் புத்தகங்கள். அனுப்ப ஏற்பாடு செய்யலாமா?', task: 'Agree and ask about the arrival date.',
        reply: ['Yes, please. When will they arrive?', 'ஆம், தயவுசெய்து. அவை எப்போது வந்து சேரும்?', 'Use “When will…?” for a future time. “They” refers to the two notebooks.'],
        alternatives: [['Yes. When they will arrive?', 'In a direct question, put “will” before the subject: “When will they arrive?”'], ['No, I do not want any notebooks.', 'That cancels the order. Your goal is to agree to delivery and ask when it will arrive.']],
      }, 2),
    ], closing: 'They will arrive on Friday. Thank you for your order!', closingTamil: 'அவை வெள்ளிக்கிழமை வந்து சேரும். உங்கள் ஆர்டருக்கு நன்றி!',
  },
  {
    id: 'meet-a-colleague', level: 'beginner', category: 'office', title: 'Meet a new colleague',
    summary: 'Introduce yourself and ask for a little help.', role: 'New team member', partner: 'Colleague',
    goal: 'Introduce yourself, learn about your colleague, and find the meeting room.', skills: ['Introductions', 'Present simple', 'Can you…?'],
    turns: [
      turn({ prompt: "Hi, I'm Maya. Welcome to the team!", tamil: 'வணக்கம், நான் மாயா. எங்கள் குழுவிற்கு வரவேற்கிறேன்!', task: 'Introduce yourself as Arun.',
        reply: ["Hi, I'm Arun. Nice to meet you.", 'வணக்கம், நான் அருண். உங்களைச் சந்தித்ததில் மகிழ்ச்சி.', '“I’m” means “I am”. “Nice to meet you” is a friendly first greeting.'],
        alternatives: [['Hi, I Arun.', 'A name needs “am” here: “I am Arun” or “I’m Arun”.'], ['I met you yesterday.', 'This is your first introduction. Give your name and greet Maya.']],
      }, 0),
      turn({ prompt: 'Nice to meet you too, Arun. What would you like to know?', tamil: 'உங்களைச் சந்தித்ததில் எனக்கும் மகிழ்ச்சி, அருண். நீங்கள் என்ன தெரிந்துகொள்ள விரும்புகிறீர்கள்?', task: 'Ask which team Maya works in.',
        reply: ['Which team do you work in?', 'நீங்கள் எந்தக் குழுவில் வேலை செய்கிறீர்கள்?', 'Use “do you work” to ask about someone’s regular work.'],
        alternatives: [['Which team does you work in?', 'Use “do” with “you”. “Does” goes with “he”, “she”, or “it”.'], ['Which team you working?', 'This question needs an auxiliary verb. “Which team do you work in?” is natural here.']],
      }, 2),
      turn({ prompt: 'I work in the design team. Our welcome meeting starts soon.', tamil: 'நான் வடிவமைப்புக் குழுவில் வேலை செய்கிறேன். நமது அறிமுகக் கூட்டம் விரைவில் தொடங்கும்.', task: 'Ask Maya to show you the meeting room.',
        reply: ['Can you show me the meeting room, please?', 'கூட்ட அறையை எனக்குக் காட்ட முடியுமா, தயவுசெய்து?', '“Can you… please?” is a friendly request for help.'],
        alternatives: [['Can you shows me the meeting room?', 'After “can”, use the base verb “show”, not “shows”.'], ['I show you the meeting room yesterday.', 'You need directions now. Ask Maya for help instead of describing a past event.']],
      }, 1),
    ], closing: "Of course. It's just down the hall. Let's go together.", closingTamil: 'நிச்சயமாக. அது இந்தப் பாதையின் முடிவில் உள்ளது. ஒன்றாகச் செல்லலாம்.',
  },
  {
    id: 'book-a-room', level: 'beginner', category: 'hotel', title: 'Book a hotel room',
    summary: 'Choose a room, share dates, and ask about breakfast.', role: 'Guest', partner: 'Receptionist',
    goal: 'Discuss a room booking: share your group size, arrival day, and length of stay.', skills: ['I’d like', 'For + duration', 'Simple questions'],
    turns: [
      turn({ prompt: 'Good evening. How can I help you?', tamil: 'மாலை வணக்கம். உங்களுக்கு எப்படி உதவலாம்?', task: 'Ask to book a room for two people.',
        reply: ["I'd like to book a room for two people.", 'இரண்டு பேருக்கு ஓர் அறையை முன்பதிவு செய்ய விரும்புகிறேன்.', '“I’d like to” is followed by the base verb: “book”.'],
        alternatives: [['I like book room two people.', 'Use “I’d like to book a room” for this request, and “for two people”.'], ['I have already checked out.', 'You are making a booking, not leaving the hotel.']],
      }, 2),
      turn({ prompt: 'Certainly. When will you arrive, and how long will you stay?', tamil: 'நிச்சயமாக. எப்போது வருவீர்கள்? எத்தனை நாட்கள் தங்குவீர்கள்?', task: 'Say Friday and two nights.',
        reply: ["I'll arrive on Friday and stay for two nights.", 'வெள்ளிக்கிழமை வந்து இரண்டு இரவுகள் தங்குவேன்.', 'Use “on” with a day and “for” with a duration.'],
        alternatives: [["I'll arrive in Friday and stay since two nights.", 'Use “on Friday” and “for two nights”. “Since” introduces a starting point.'], ["I'll arrive on Friday and stay for two night.", 'Use the plural “nights” after “two”.']],
      }, 0),
      turn({ prompt: 'We have a room available for those dates. Do you have any questions?', tamil: 'அந்த நாட்களுக்கு அறை உள்ளது. உங்களுக்கு ஏதேனும் கேள்விகள் உள்ளனவா?', task: 'Ask whether breakfast is included.',
        reply: ['Is breakfast included?', 'காலை உணவு இதில் சேர்க்கப்பட்டுள்ளதா?', '“Is… included?” asks whether something is part of the price or service.'],
        alternatives: [['Does breakfast included?', 'Use “is” with “included” here: “Is breakfast included?”'], ['I included breakfast yesterday.', 'Ask about the hotel’s offer, rather than describing a past action.']],
      }, 1),
    ], closing: 'Yes, breakfast is included. Your room is booked. We look forward to welcoming you.', closingTamil: 'ஆம், காலை உணவு சேர்க்கப்பட்டுள்ளது. உங்கள் அறை முன்பதிவு செய்யப்பட்டது. உங்களை வரவேற்கக் காத்திருக்கிறோம்.',
  },
  {
    id: 'order-at-a-cafe', level: 'beginner', category: 'dining', title: 'Order at a café',
    summary: 'Order a drink, choose a size, and ask the price.', role: 'Customer', partner: 'Barista',
    goal: 'Order a tea, choose its size and whether to take it away, and ask the price.', skills: ['Polite orders', 'A / an', 'How much'],
    turns: [
      turn({ prompt: 'Hello! What would you like to drink?', tamil: 'வணக்கம்! நீங்கள் என்ன குடிக்க விரும்புகிறீர்கள்?', task: 'Politely order a tea.',
        reply: ['Could I have a tea, please?', 'எனக்கு ஒரு தேநீர் தர முடியுமா, தயவுசெய்து?', '“Could I have…?” is a polite way to order food or a drink.'],
        alternatives: [['Could I has a tea?', 'After “could”, use the base verb “have”, not “has”.'], ['I am a tea, please.', '“I am” describes you. Use “Could I have” to order.']],
      }, 1),
      turn({ prompt: 'Of course. Small or large? And is that for here or to take away?', tamil: 'நிச்சயமாக. சிறியதா, பெரியதா? இங்கேயே குடிக்கிறீர்களா அல்லது எடுத்துச் செல்கிறீர்களா?', task: 'Choose a small tea to take away.',
        reply: ['A small one to take away, please.', 'ஒரு சிறிய தேநீர், எடுத்துச் செல்ல, தயவுசெய்து.', '“One” replaces “tea” here. “To take away” means you will leave with it.'],
        alternatives: [['A large one for here, please.', 'That is a valid order, but your goal is a small tea to take away.'], ['An small one to take away.', 'Use “a” before the consonant sound in “small”.']],
      }, 2),
      turn({ prompt: 'A small tea to take away. Anything else?', tamil: 'எடுத்துச் செல்ல ஒரு சிறிய தேநீர். வேறு ஏதாவது வேண்டுமா?', task: 'Say that is all and ask the price.',
        reply: ["That's all, thank you. How much is it?", 'அவ்வளவுதான், நன்றி. இதன் விலை என்ன?', 'Use “How much…?” to ask about a price.'],
        alternatives: [['How many is it?', '“How many” asks for a number of countable items. Use “How much” for the price.'], ['Where much is it?', '“Where” asks about a place. “How much is it?” asks about the price.']],
      }, 0),
    ], closing: "That's fifty rupees, please. Your tea will be ready shortly.", closingTamil: 'ஐம்பது ரூபாய், தயவுசெய்து. உங்கள் தேநீர் விரைவில் தயாராகிவிடும்.',
  },
  {
    id: 'track-a-delivery', level: 'intermediate', category: 'orders', title: 'Track a delayed delivery',
    summary: 'Explain a delay and arrange a new delivery date.', role: 'Customer', partner: 'Support agent',
    goal: 'Find out why order 4821 is late and choose a delivery slot for tomorrow.', skills: ['Present perfect', 'Giving details', 'Making requests'],
    turns: [
      turn({ prompt: 'Welcome to support. What seems to be the problem?', tamil: 'வாடிக்கையாளர் சேவைக்கு வரவேற்கிறோம். என்ன பிரச்சினை?', task: 'Explain that yesterday’s delivery has not arrived.',
        reply: ["My order was due yesterday, but it hasn't arrived yet.", 'எனது ஆர்டர் நேற்று வந்திருக்க வேண்டும், ஆனால் இன்னும் வரவில்லை.', '“Hasn’t arrived yet” connects the expected delivery with the situation now.'],
        alternatives: [["My order hasn't arrive yet.", 'After “hasn’t”, use the past participle “arrived”.'], ['My order will arrive yesterday.', '“Will” refers to the future, but “yesterday” is in the past.']],
      }, 0),
      turn({ prompt: 'I’m sorry about the delay. Could you give me your order number?', tamil: 'தாமதத்திற்கு மன்னிக்கவும். உங்கள் ஆர்டர் எண்ணைக் கூற முடியுமா?', task: 'Give order number 4821 and ask for an update.',
        reply: ["It's 4821. Could you check its current status?", 'அது 4821. அதன் தற்போதைய நிலையைச் சரிபார்க்க முடியுமா?', 'Give the requested detail first, then use “Could you” for a polite request.'],
        alternatives: [['You should know my order number.', 'This does not provide the detail the agent needs to find your order.'], ["It's 4821. Could you checked its status?", 'After “could”, use “check”, not “checked”.']],
      }, 2),
      turn({ prompt: 'The courier was delayed. We can deliver tomorrow morning or afternoon.', tamil: 'கூரியர் சேவையில் தாமதம் ஏற்பட்டது. நாளை காலை அல்லது பிற்பகலில் அனுப்பலாம்.', task: 'Choose tomorrow afternoon and request confirmation.',
        reply: ['Tomorrow afternoon would work. Could you confirm the time by message?', 'நாளை பிற்பகல் வசதியாக இருக்கும். நேரத்தைச் செய்தி மூலம் உறுதிப்படுத்த முடியுமா?', '“Would work” politely says that a suggested time suits you.'],
        alternatives: [['Tomorrow afternoon would works.', 'After “would”, use the base verb “work”.'], ['Yesterday afternoon would work.', 'Yesterday has passed. Choose one of the available times tomorrow.']],
      }, 1),
    ], closing: 'Done. Delivery is scheduled for tomorrow afternoon, and a confirmation message is on its way.', closingTamil: 'சரி. நாளை பிற்பகல் அனுப்ப ஏற்பாடு செய்யப்பட்டது. உறுதிப்படுத்தும் செய்தி அனுப்பப்படுகிறது.',
  },
  {
    id: 'reschedule-a-meeting', level: 'intermediate', category: 'office', title: 'Reschedule a meeting',
    summary: 'Explain a clash and agree on a new time.', role: 'Team member', partner: 'Colleague',
    goal: 'Move your 10 a.m. meeting to an available afternoon slot and confirm the change.', skills: ['Polite explanations', 'Availability', 'Future plans'],
    turns: [
      turn({ prompt: 'Are we still meeting at 10 a.m. tomorrow?', tamil: 'நாளை காலை 10 மணிக்கு நமது கூட்டம் நடைபெறுமா?', task: 'Explain a scheduling clash and ask to move the meeting.',
        reply: ['I have another call at that time. Could we move our meeting?', 'அந்த நேரத்தில் எனக்கு வேறொரு அழைப்பு உள்ளது. நமது கூட்ட நேரத்தை மாற்றலாமா?', 'A short explanation followed by “Could we…?” makes a clear, polite request.'],
        alternatives: [['You must cancel all your other meetings.', 'Ask for a change to your shared meeting; do not demand changes to all their plans.'], ['Could we moved our meeting?', 'Use the base form “move” after “could”.']],
      }, 1),
      turn({ prompt: 'No problem. I’m free at 2 p.m. or 4 p.m.', tamil: 'பரவாயில்லை. பிற்பகல் 2 மணிக்கு அல்லது 4 மணிக்கு எனக்கு நேரம் உள்ளது.', task: 'Choose 2 p.m. and check that it suits your colleague.',
        reply: ['Would 2 p.m. work for you? That suits me.', 'பிற்பகல் 2 மணி உங்களுக்கு வசதியாக இருக்குமா? அது எனக்கு ஏற்றது.', '“Would … work for you?” politely checks whether a time is convenient.'],
        alternatives: [['Would 2 p.m. worked for you?', 'After “would”, use “work”, not “worked”.'], ['Let’s keep it at 10 a.m.', 'That keeps the scheduling clash. Choose an available afternoon time.']],
      }, 0),
      turn({ prompt: 'Yes, 2 p.m. is good. Can you update the calendar invitation?', tamil: 'ஆம், பிற்பகல் 2 மணி சரி. காலண்டர் அழைப்பைப் புதுப்பிக்க முடியுமா?', task: 'Agree to update the invitation and thank your colleague.',
        reply: ["Of course. I'll send an updated invitation. Thanks for being flexible.", 'நிச்சயமாக. புதுப்பிக்கப்பட்ட அழைப்பை அனுப்புகிறேன். நேரத்தை மாற்ற ஒத்துழைத்ததற்கு நன்றி.', '“I’ll” expresses your decision now. Thanking the other person closes the exchange naturally.'],
        alternatives: [['I updated it next week.', '“Updated” describes the past, while “next week” is in the future.'], ['Can you tell me what time we chose?', 'You have just agreed on 2 p.m. Confirm the action you will take.']],
      }, 2),
    ], closing: 'Thanks, I’ll look out for it. See you at 2 p.m.', closingTamil: 'நன்றி, அழைப்பை எதிர்பார்க்கிறேன். பிற்பகல் 2 மணிக்குச் சந்திப்போம்.',
  },
  {
    id: 'change-a-reservation', level: 'intermediate', category: 'hotel', title: 'Change a reservation',
    summary: 'Adjust your dates and check the updated price.', role: 'Guest', partner: 'Reservations agent',
    goal: 'Add one night to a booking under Priya and confirm the new total.', skills: ['Would it be possible', 'Checking details', 'Written confirmation'],
    turns: [
      turn({ prompt: 'Reservations desk. How can I help?', tamil: 'முன்பதிவு பிரிவு. உங்களுக்கு எப்படி உதவலாம்?', task: 'Identify your booking and request one extra night.',
        reply: ['I have a booking under Priya. Would it be possible to add one night?', 'பிரியா என்ற பெயரில் முன்பதிவு உள்ளது. மேலும் ஓர் இரவு சேர்க்க முடியுமா?', '“Under Priya” identifies the booking name. “Would it be possible” softens the request.'],
        alternatives: [['I want every booking under Priya cancelled.', 'Your goal is to extend your stay, not cancel it.'], ['Would it possible to add one night?', 'Include “be”: “Would it be possible…?”']],
      }, 2),
      turn({ prompt: 'Yes, the room is available for an extra night.', tamil: 'ஆம், மேலும் ஓர் இரவுக்கு அறை கிடைக்கிறது.', task: 'Ask about the revised total before confirming.',
        reply: ['Could you tell me the total cost, including the extra night?', 'கூடுதல் இரவையும் சேர்த்து மொத்தக் கட்டணத்தைச் சொல்ல முடியுமா?', 'After “Could you tell me”, use a noun phrase such as “the total cost”.'],
        alternatives: [['Could you tell me what is the total cost?', 'In this indirect question, use “what the total cost is”, without question-word order.'], ['I already know the new total.', 'The updated price has not been provided. Ask before confirming.']],
      }, 1),
      turn({ prompt: 'The new total is six thousand rupees, including breakfast.', tamil: 'காலை உணவுடன் புதிய மொத்தக் கட்டணம் ஆறாயிரம் ரூபாய்.', task: 'Accept the change and request an updated confirmation.',
        reply: ["That works for me. Please email the updated confirmation.", 'அது எனக்கு ஏற்றது. புதுப்பிக்கப்பட்ட உறுதிப்படுத்தலை மின்னஞ்சலில் அனுப்புங்கள்.', 'Confirm your agreement first, then ask for a written record of the change.'],
        alternatives: [['Please email the confirmation update yesterday.', '“Yesterday” does not fit a request for an action now.'], ['Please remove breakfast and cancel the extra night.', 'That reverses the change you wanted. Accept and request confirmation.']],
      }, 0),
    ], closing: 'Your stay has been extended by one night. I’ve sent the new confirmation to your email.', closingTamil: 'உங்கள் தங்கும் காலம் ஓர் இரவு நீட்டிக்கப்பட்டது. புதிய உறுதிப்படுத்தல் மின்னஞ்சலில் அனுப்பப்பட்டுள்ளது.',
  },
  {
    id: 'correct-a-food-order', level: 'intermediate', category: 'dining', title: 'Correct a restaurant order',
    summary: 'Explain a mix-up without sounding rude.', role: 'Diner', partner: 'Server',
    goal: 'Politely replace a chicken dish with the vegetarian pasta you ordered.', skills: ['Polite corrections', 'Past simple', 'How long'],
    turns: [
      turn({ prompt: 'Here is your chicken pasta. Enjoy!', tamil: 'இதோ உங்கள் கோழிக்கறி பாஸ்தா. சாப்பிடுங்கள்!', task: 'Politely explain that you ordered vegetarian pasta.',
        reply: ['Excuse me, I ordered the vegetarian pasta, not the chicken pasta.', 'மன்னிக்கவும், நான் சைவ பாஸ்தா கேட்டேன், கோழிக்கறி பாஸ்தா அல்ல.', '“Excuse me” gets attention politely. “Ordered” explains the earlier request.'],
        alternatives: [['I order vegetarian pasta yesterday tomorrow.', 'Those time words conflict. Use “I ordered” to explain the order you already placed.'], ['You never listen to anyone.', 'Explain the specific mix-up instead of making a personal accusation.']],
      }, 0),
      turn({ prompt: 'I’m sorry about that. Shall I bring you the correct dish?', tamil: 'அதற்கு மன்னிக்கவும். சரியான உணவைக் கொண்டு வரலாமா?', task: 'Accept the replacement and ask how long it will take.',
        reply: ['Yes, please. About how long will it take?', 'ஆம், தயவுசெய்து. சுமார் எவ்வளவு நேரம் ஆகும்?', '“How long will it take?” asks for the amount of time you need to wait.'],
        alternatives: [['How long it will take?', 'For a direct question, put “will” before “it”.'], ['How many will it take?', 'You are asking about time, so use “how long”, not “how many”.']],
      }, 2),
      turn({ prompt: 'It will take about ten minutes. Is that all right?', tamil: 'சுமார் பத்து நிமிடங்கள் ஆகும். அது சரியா?', task: 'Accept the wait and thank the server.',
        reply: ["That's fine. Thank you for sorting it out.", 'பரவாயில்லை. பிரச்சினையைச் சரிசெய்வதற்கு நன்றி.', '“Sorting it out” means resolving the problem. This accepts the proposed wait politely.'],
        alternatives: [['That’s fine. Thank you for sort it out.', 'After “for”, use the -ing form: “sorting”.'], ['No, I will keep the chicken instead.', 'Your goal is to receive the vegetarian dish. Accept the proposed replacement.']],
      }, 1),
    ], closing: 'Thank you for your patience. I’ll bring the vegetarian pasta as soon as it’s ready.', closingTamil: 'பொறுமையாகக் காத்திருப்பதற்கு நன்றி. சைவ பாஸ்தா தயாரானவுடன் கொண்டு வருகிறேன்.',
  },
  {
    id: 'resolve-a-damaged-delivery', level: 'advanced', category: 'orders', title: 'Resolve a damaged delivery',
    summary: 'Describe the issue and agree on a practical solution.', role: 'Customer', partner: 'Support specialist',
    goal: 'Request a replacement for a cracked lamp, with a refund as a fallback if it cannot arrive by Friday.', skills: ['Precise explanations', 'Conditional requests', 'Confirming agreements'],
    turns: [
      turn({ prompt: 'I understand there’s an issue with the lamp you received. Could you describe it?', tamil: 'உங்களுக்குக் கிடைத்த விளக்கில் பிரச்சினை இருப்பதாகத் தெரிகிறது. அதை விவரிக்க முடியுமா?', task: 'Describe the damage and explain that you have photos.',
        reply: ['The base arrived cracked, although the packaging looked intact. I can send photos of the damage.', 'பொதி சேதமில்லாமல் இருந்தாலும், விளக்கின் அடிப்பகுதி விரிசலுடன் வந்தது. சேதத்தின் புகைப்படங்களை அனுப்ப முடியும்.', '“Although” contrasts the undamaged packaging with the cracked item. Specific details help resolve the issue.'],
        alternatives: [['The lamp is bad. Everything you sell is bad.', 'This is too general and adds an unsupported accusation. Describe the exact damage.'], ['Although the packaging looked intact, but the base was cracked.', 'Use either “although” or “but” to connect these clauses, not both together.']],
      }, 1),
      turn({ prompt: 'Thank you. We can replace it, but delivery may take several days.', tamil: 'நன்றி. மாற்றுப் பொருளை அனுப்பலாம், ஆனால் வந்து சேர சில நாட்கள் ஆகலாம்.', task: 'State the Friday deadline and ask for a refund if it cannot be met.',
        reply: ["If a replacement can't arrive by Friday, I'd prefer a refund. Could you check the delivery date?", 'மாற்றுப் பொருள் வெள்ளிக்கிழமைக்குள் வர முடியாவிட்டால், பணத்தைத் திரும்பப் பெற விரும்புகிறேன். வந்து சேரும் தேதியைச் சரிபார்க்க முடியுமா?', 'The “if” clause states your condition; “I’d prefer” explains your fallback politely.'],
        alternatives: [["If a replacement can't arrive by Friday, I preferred a refund yesterday.", '“Preferred … yesterday” does not express your current preference. Use “I’d prefer”.'], ['Send it whenever you like; there is no deadline.', 'That removes the Friday deadline, which is important in this scenario.']],
      }, 2),
      turn({ prompt: 'We can deliver a replacement by Friday and collect the damaged lamp at the same time.', tamil: 'வெள்ளிக்கிழமைக்குள் மாற்று விளக்கை வழங்கி, அதே நேரத்தில் சேதமடைந்த விளக்கை எடுத்துக்கொள்ளலாம்.', task: 'Accept and ask for written confirmation of both arrangements.',
        reply: ['That would resolve the issue. Please confirm the Friday delivery and collection arrangements in writing.', 'அது பிரச்சினையைத் தீர்க்கும். வெள்ளிக்கிழமை வழங்குவதையும் பழைய விளக்கை எடுத்துக்கொள்வதையும் எழுத்தில் உறுதிப்படுத்துங்கள்.', 'Summarising both arrangements prevents ambiguity about the agreed solution.'],
        alternatives: [['Please confirm only that you received my message.', 'That would not confirm the delivery date or collection arrangements.'], ['Please confirm when will you deliver and collect it.', 'Use statement order in an indirect question: “when you will deliver and collect it”.']],
      }, 0),
    ], closing: 'Agreed. I’ve emailed the replacement date and collection details. Thank you for helping us resolve this.', closingTamil: 'ஒப்புக்கொள்கிறோம். மாற்றுப் பொருள் வழங்கும் தேதி மற்றும் எடுத்துக்கொள்ளும் விவரங்கள் மின்னஞ்சலில் அனுப்பப்பட்டுள்ளன. பிரச்சினையைத் தீர்க்க உதவியதற்கு நன்றி.',
  },
  {
    id: 'negotiate-a-deadline', level: 'advanced', category: 'office', title: 'Negotiate a project deadline',
    summary: 'Explain a constraint and suggest a balanced plan.', role: 'Project team member', partner: 'Project lead',
    goal: 'Agree to share a draft on Thursday and deliver a reviewed final report on Monday.', skills: ['Diplomatic disagreement', 'Trade-offs', 'Conditional plans'],
    turns: [
      turn({ prompt: 'Could you send the final report by Thursday? The client would like an early update.', tamil: 'வியாழக்கிழமைக்குள் இறுதி அறிக்கையை அனுப்ப முடியுமா? வாடிக்கையாளர் விரைவில் தகவல் எதிர்பார்க்கிறார்.', task: 'Acknowledge the need but explain that the data arrives on Wednesday.',
        reply: ['I understand the urgency. Since the data arrives on Wednesday, completing the review by Thursday would be difficult.', 'அவசரத்தைப் புரிந்துகொள்கிறேன். தரவு புதன்கிழமையில்தான் கிடைப்பதால், வியாழக்கிழமைக்குள் ஆய்வை முடிப்பது கடினமாக இருக்கும்.', 'Acknowledge the request, then explain the constraint. “Would be difficult” is diplomatic without promising the impossible.'],
        alternatives: [['That deadline is ridiculous. It’s not my problem.', 'State the constraint professionally and keep the discussion focused on a workable plan.'], ['Since the data arrives on Wednesday, so the review is difficult.', 'Use “since” or “so” to connect the cause and result, not both together.']],
      }, 2),
      turn({ prompt: 'We still need to show progress. What could you share by Thursday?', tamil: 'இருந்தாலும் முன்னேற்றத்தைக் காட்ட வேண்டும். வியாழக்கிழமைக்குள் எதைப் பகிர முடியும்?', task: 'Offer a draft on Thursday and a reviewed report on Monday.',
        reply: ['I could share a draft on Thursday, with the reviewed final report following on Monday.', 'வியாழக்கிழமை வரைவு அறிக்கையையும், திங்கட்கிழமை ஆய்வு செய்யப்பட்ட இறுதி அறிக்கையையும் பகிரலாம்.', 'This gives a concrete compromise and clearly distinguishes a draft from the final version.'],
        alternatives: [['I could shared a draft on Thursday.', 'After “could”, use the base verb “share”.'], ['I’ll call the draft final even if it has not been reviewed.', 'That hides the review status. Offer a clearly labelled draft instead.']],
      }, 0),
      turn({ prompt: 'That sounds reasonable. Can you flag any risks in the draft?', tamil: 'அது நியாயமாக உள்ளது. வரைவில் ஏதேனும் சிக்கல்கள் இருந்தால் குறிப்பிட முடியுமா?', task: 'Agree and explain how you will handle unresolved points.',
        reply: ["Certainly. I'll highlight any unresolved points and explain their impact, so the client can review the draft with that context.", 'நிச்சயமாக. தீர்க்கப்படாத விஷயங்களையும் அவற்றின் தாக்கத்தையும் குறிப்பிடுவேன். வாடிக்கையாளர் அந்த விவரங்களுடன் வரைவைப் பார்க்கலாம்.', '“So” explains the purpose of flagging risks. The reply commits to a useful, transparent action.'],
        alternatives: [['I will highlight any unresolved points yesterday.', '“Will” describes a future action, so it cannot go with “yesterday”.'], ['There can never be any risks in a project.', 'Avoid an absolute claim. Agree to identify unresolved points honestly.']],
      }, 1),
    ], closing: 'Agreed: draft on Thursday, final report on Monday. Thanks for proposing a workable plan.', closingTamil: 'சரி: வியாழக்கிழமை வரைவு, திங்கட்கிழமை இறுதி அறிக்கை. நடைமுறைக்கு ஏற்ற திட்டத்தைச் சொன்னதற்கு நன்றி.',
  },
  {
    id: 'handle-a-booking-mixup', level: 'advanced', category: 'hotel', title: 'Handle a booking mix-up',
    summary: 'Resolve a missing reservation calmly and precisely.', role: 'Guest', partner: 'Front-desk manager',
    goal: 'Resolve a missing quiet-room reservation without paying more than the confirmed rate.', skills: ['Clarification', 'Conditions', 'Diplomatic negotiation'],
    turns: [
      turn({ prompt: 'I’m afraid I can’t find your reservation in our system.', tamil: 'மன்னிக்கவும், எங்கள் பதிவில் உங்கள் முன்பதிவைக் கண்டுபிடிக்க முடியவில்லை.', task: 'Offer your confirmation and politely ask for another check.',
        reply: ['I have a confirmation email with reference H204. Could you check whether it was recorded under my surname, Kumar?', 'H204 என்ற எண்ணுடன் உறுதிப்படுத்தும் மின்னஞ்சல் உள்ளது. குமார் என்ற எனது குடும்பப் பெயரில் பதிவு செய்யப்பட்டுள்ளதா என்று பார்க்க முடியுமா?', '“Whether it was recorded” uses statement order inside an indirect question. The reference and name make the request specific.'],
        alternatives: [['Could you check whether was it recorded under Kumar?', 'After “whether”, use statement order: “whether it was recorded”.'], ['You have definitely cancelled my booking on purpose.', 'The cause is not known. Provide your confirmation rather than assuming deliberate action.']],
      }, 1),
      turn({ prompt: 'I’ve found it, but the quiet room you requested is unavailable. We have a larger room facing the street.', tamil: 'முன்பதிவு கிடைத்துவிட்டது, ஆனால் நீங்கள் கேட்ட அமைதியான அறை இல்லை. தெருவை நோக்கிய பெரிய அறை உள்ளது.', task: 'Explain your need for quiet and ask for a suitable alternative at the same rate.',
        reply: ['I appreciate the offer, but a quiet room is important because I have an early meeting. Is there an alternative at the confirmed rate?', 'உங்கள் சலுகைக்கு நன்றி. காலையில் கூட்டம் இருப்பதால் அமைதியான அறை முக்கியம். உறுதிப்படுத்திய கட்டணத்திலேயே வேறு அறை கிடைக்குமா?', 'Acknowledge the offer before explaining your priority and the condition for an alternative.'],
        alternatives: [['A street-facing room is perfect; noise does not matter.', 'That contradicts your need for a quiet room. Explain why quiet matters.'], ['I appreciate for the offer, but I need quiet.', '“Appreciate” takes a direct object: “I appreciate the offer”, without “for”.']],
      }, 0),
      turn({ prompt: 'We can offer a courtyard room at the same rate. It will be ready in thirty minutes.', tamil: 'அதே கட்டணத்தில் உள்முற்றத்தை நோக்கிய அறையை வழங்கலாம். முப்பது நிமிடங்களில் தயாராகிவிடும்.', task: 'Accept on the condition that the confirmed rate stays unchanged.',
        reply: ['That would work, provided the confirmed rate remains unchanged. Could you update the reservation and let me know when the room is ready?', 'உறுதிப்படுத்திய கட்டணம் மாறாமல் இருந்தால் அது எனக்கு ஏற்றது. முன்பதிவைப் புதுப்பித்து அறை தயாரானதும் தெரிவிக்க முடியுமா?', '“Provided” introduces a condition. This reply accepts the solution while confirming the important detail.'],
        alternatives: [['That would work, provided the rate remain unchanged.', 'With singular “the rate”, use “remains”.'], ['Please cancel my reservation immediately.', 'A suitable option is now available. Your goal is to agree to it at the confirmed rate.']],
      }, 2),
    ], closing: 'The rate is unchanged. I’ve updated your reservation and will let you know as soon as the room is ready.', closingTamil: 'கட்டணம் மாறவில்லை. முன்பதிவைப் புதுப்பித்துவிட்டேன். அறை தயாரானவுடன் தெரிவிக்கிறேன்.',
  },
  {
    id: 'plan-a-group-dinner', level: 'advanced', category: 'dining', title: 'Plan a group dinner',
    summary: 'Coordinate seating, preferences, and final details.', role: 'Group organiser', partner: 'Restaurant host',
    goal: 'Arrange dinner for twelve colleagues, with seating together and vegetarian choices.', skills: ['Complex requests', 'Negotiating alternatives', 'Summarising'],
    turns: [
      turn({ prompt: 'Thank you for calling. What kind of booking would you like to make?', tamil: 'அழைத்ததற்கு நன்றி. எப்படிப்பட்ட முன்பதிவு செய்ய விரும்புகிறீர்கள்?', task: 'Request seating together for twelve colleagues on Friday at 7 p.m.',
        reply: ["I'd like to book for twelve colleagues this Friday at 7 p.m. Would it be possible for us to sit together?", 'இந்த வெள்ளிக்கிழமை இரவு 7 மணிக்கு பன்னிரண்டு சக ஊழியர்களுக்கு முன்பதிவு செய்ய விரும்புகிறேன். ஒன்றாக அமர முடியுமா?', 'Give the number, date, and time before adding your seating request.'],
        alternatives: [['I’d like to book for twelve colleague this Friday.', 'Use the plural “colleagues” after “twelve”.'], ['Please book something for some people at some time.', 'The host needs a group size, date, and time to check availability.']],
      }, 0),
      turn({ prompt: 'We can arrange two tables next to each other. Would that be suitable?', tamil: 'அருகருகே இரண்டு மேசைகளை ஏற்பாடு செய்யலாம். அது உங்களுக்கு ஏற்றதாக இருக்குமா?', task: 'Accept neighbouring tables and ask about vegetarian choices.',
        reply: ['That would be fine, as long as the tables are adjacent. Could you also confirm that vegetarian options are available?', 'மேசைகள் அருகருகே இருந்தால் சரி. சைவ உணவு வகைகளும் உள்ளனவா என்பதை உறுதிப்படுத்த முடியுமா?', '“As long as” states the condition for accepting an alternative. “Also” adds the second request clearly.'],
        alternatives: [['That would be fine, as long as the tables is adjacent.', '“Tables” is plural, so use “are”, not “is”.'], ['Please place the tables in different rooms.', 'Your goal is for the group to stay together. Adjacent tables are the proposed compromise.']],
      }, 2),
      turn({ prompt: 'Yes, several vegetarian dishes are available. Shall I confirm the booking?', tamil: 'ஆம், பல சைவ உணவுகள் உள்ளன. முன்பதிவை உறுதிப்படுத்தலாமா?', task: 'Summarise the agreed arrangements and request written confirmation.',
        reply: ['Yes, please: twelve people, Friday at 7 p.m., at adjacent tables. Please send the confirmation and menu by email.', 'ஆம், தயவுசெய்து: பன்னிரண்டு பேர், வெள்ளிக்கிழமை இரவு 7 மணி, அருகருகே மேசைகள். உறுதிப்படுத்தலையும் உணவுப் பட்டியலையும் மின்னஞ்சலில் அனுப்புங்கள்.', 'Repeating the key details at the end helps both people catch a misunderstanding before confirming.'],
        alternatives: [['Yes: twenty people on Saturday at 9 p.m.', 'Those details do not match the arrangement. Confirm twelve people on Friday at 7 p.m.'], ['Please sent the confirmation and menu.', 'In a request beginning with “please”, use the base verb “send”.']],
      }, 1),
    ], closing: 'Confirmed. I’ll email the details and the menu. We look forward to welcoming your group.', closingTamil: 'உறுதிப்படுத்தப்பட்டது. விவரங்களையும் உணவுப் பட்டியலையும் மின்னஞ்சலில் அனுப்புகிறேன். உங்கள் குழுவை வரவேற்கக் காத்திருக்கிறோம்.',
  },
];
