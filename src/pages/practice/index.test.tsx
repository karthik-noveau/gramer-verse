import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

import { useSpeech } from 'common/hooks/useSpeech';

import PracticePage from './index';
import { SCENARIOS } from './data';

jest.mock('common/hooks/useSpeech', () => ({ useSpeech: jest.fn() }));
const speak = jest.fn();
const stop = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useSpeech).mockReturnValue({ supported: false, speaking: false, speak, stop });
});

function at(path = '/practice'): ReturnType<typeof render> {
  return render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/practice" element={<PracticePage />} />
    <Route path="/practice/:scenarioId" element={<PracticePage />} />
  </Routes></MemoryRouter>);
}

describe('Practice catalogue', () => {
  it('offers all 12 scenarios, all levels, and all situations', () => {
    at();
    expect(screen.getByRole('heading', { level: 1, name: 'Practice' })).toBeTruthy();
    expect(screen.queryByText('A little practice goes a long way')).toBeNull();
    expect(screen.queryByText('Where shall we start?')).toBeNull();
    expect(screen.getAllByRole('link', { name: /^Practice:/ })).toHaveLength(12);
    expect(within(screen.getByRole('group', { name: 'Difficulty' })).getAllByRole('button')).toHaveLength(4);
    expect(within(screen.getByRole('group', { name: 'Situation' })).getAllByRole('button')).toHaveLength(5);
  });

  it('combines URL-backed level, situation, and search filters, and retains them on return', () => {
    at('/practice?level=intermediate&category=office');
    const links = screen.getAllByRole('link', { name: /^Practice:/ });
    expect(links).toHaveLength(1);
    expect(links[0]?.getAttribute('href')).toBe('/practice/reschedule-a-meeting?level=intermediate&category=office');
    fireEvent.click(links[0]!);
    expect(screen.getByRole('heading', { name: 'Reschedule a meeting' })).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: 'All scenarios' }));
    expect(screen.getAllByRole('link', { name: /^Practice:/ })).toHaveLength(1);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search scenarios' }), { target: { value: 'no-such-scenario' } });
    expect(screen.getByText('No matching conversations')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    expect(screen.getAllByRole('link', { name: /^Practice:/ })).toHaveLength(12);
  });

  it('filters by beginner and hotel using the controls', () => {
    at();
    fireEvent.click(screen.getByRole('button', { name: 'Beginner' }));
    expect(screen.getAllByRole('link', { name: /^Practice:/ })).toHaveLength(4);
    fireEvent.click(screen.getByRole('button', { name: 'Hotel bookings' }));
    expect(screen.getAllByRole('link', { name: /^Practice:/ })).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Practice: Book a hotel room' })).toBeTruthy();
  });

  it('safely defaults unknown filters and handles an unknown scenario', () => {
    const page = at('/practice?level=expert&category=unknown');
    expect(screen.getAllByRole('link', { name: /^Practice:/ })).toHaveLength(12);
    page.unmount();
    at('/practice/not-a-scenario');
    expect(screen.getByRole('heading', { name: 'Scenario not found' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Browse scenarios' }).getAttribute('href')).toBe('/practice');
  });
});

describe('Chat conversation', () => {
  const scenario = SCENARIOS[0]!;
  const receive = (): void => { act(() => { jest.advanceTimersByTime(650); }); };
  const send = (text: string): void => {
    fireEvent.change(screen.getByRole('textbox', { name: 'Your message' }), { target: { value: text } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  };
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it('puts the goal inside the chat with optional Tamil and no quiz panel', () => {
    at('/practice/place-an-order');
    expect(within(screen.getByRole('log')).getByText(scenario.goal)).toBeTruthy();
    expect(screen.getByText(scenario.turns[0]!.tamil).getAttribute('lang')).toBe('ta');
    expect(screen.queryByText('Your mission')).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Your message' })).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Send message' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Tamil help' }));
    expect(screen.queryByText(scenario.turns[0]!.tamil)).toBeNull();
    expect(speak).not.toHaveBeenCalled();
  });

  it('loads a suggested reply into the composer and sends it as a chat bubble', () => {
    at('/practice/place-an-order');
    fireEvent.click(screen.getByRole('switch', { name: 'Show suggested replies' }));
    const first = scenario.turns[0]!;
    const text = first.choices[first.answer]!.text;
    fireEvent.click(screen.getByRole('button', { name: text }));
    const input = screen.getByRole('textbox', { name: 'Your message' }) as HTMLTextAreaElement;
    expect(input.value).toBe(text);
    expect(document.activeElement).toBe(input);
    expect(within(screen.getByRole('log')).queryByText(text)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect(within(screen.getByRole('log')).getByText(text)).toBeTruthy();
    expect(input.value).toBe('');
    expect(input.readOnly).toBe(true);
    expect(screen.getByRole('status', { name: 'Store assistant is typing' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
    receive();
    expect(screen.getByText(scenario.turns[1]!.prompt)).toBeTruthy();
    expect(input.readOnly).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it('keeps incorrect attempts, adds an inline tip, and completes automatically after a retry', () => {
    at('/practice/place-an-order');
    const first = scenario.turns[0]!;
    const wrong = first.choices[(first.answer + 1) % 3]!;
    send(wrong.text);
    receive();
    const log = within(screen.getByRole('log'));
    expect(log.getByText(wrong.text)).toBeTruthy();
    expect(log.getByText(wrong.feedback)).toBeTruthy();
    expect(screen.getByText('1 / 3')).toBeTruthy();
    for (const turn of scenario.turns) {
      send(turn.choices[turn.answer]!.text);
      receive();
    }
    expect(screen.getByRole('heading', { name: 'Conversation complete!' })).toBeTruthy();
    expect(log.getByText(scenario.closing)).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Your message' })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Conversation complete!' }));
    fireEvent.click(screen.getByText('Review useful phrases'));
    expect(screen.getByText(scenario.turns[1]!.choices[scenario.turns[1]!.answer]!.feedback)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Practice again' }));
    expect(screen.queryByRole('heading', { name: 'Conversation complete!' })).toBeNull();
    expect(screen.getByText('1 / 3')).toBeTruthy();
    expect(log.queryByText(wrong.text)).toBeNull();
  });

  it('asks a relevant follow-up for partial free text and remembers the answer', () => {
    at('/practice/place-an-order');
    send('Could I have some notebooks?');
    receive();
    expect(within(screen.getByRole('log')).getByText('Could I have some notebooks?')).toBeTruthy();
    expect(screen.getByText('We have blue notebooks available. Would you like to order some?')).toBeTruthy();
    expect(screen.getByText('1 / 3')).toBeTruthy();
    expect(screen.queryByText(scenario.turns[1]!.prompt)).toBeNull();
    send('blue please');
    receive();
    expect(screen.getByText('2 / 3')).toBeTruthy();
    expect(screen.getByText(scenario.turns[1]!.prompt)).toBeTruthy();
  });

  it('handles natural multi-detail replies and finishes without duplicate scripted messages', () => {
    at('/practice/place-an-order');
    send('Could I buy two blue notebooks please?');
    receive();
    expect(screen.getByText('3 / 3')).toBeTruthy();
    expect(screen.queryByText(scenario.turns[1]!.prompt)).toBeNull();
    send('What is the delivery date?');
    receive();
    expect(screen.getByRole('heading', { name: 'Conversation complete!' })).toBeTruthy();
    expect(within(screen.getByRole('log')).getAllByText(scenario.closing)).toHaveLength(1);
    expect(screen.getByText(/covered all 3 conversation goals/)).toBeTruthy();
  });

  it('offers an available item naturally and follows a yes reply into the order', () => {
    at('/practice/place-an-order');
    send('Do you sell pens?');
    receive();
    expect(screen.getByText('Sorry, we don’t have that. We only have blue notebooks. Would you like to order some?')).toBeTruthy();
    expect(screen.queryByText(/I didn’t quite catch that/)).toBeNull();
    expect(screen.getByText('1 / 3')).toBeTruthy();
    send('yes please');
    receive();
    expect(screen.getByText('2 / 3')).toBeTruthy();
    expect(screen.getByText(scenario.turns[1]!.prompt)).toBeTruthy();
    send('two please');
    receive();
    expect(screen.getByText('3 / 3')).toBeTruthy();
  });

  it('sends with Enter, preserves Shift+Enter and IME composition, and blocks double sends', () => {
    at('/practice/place-an-order');
    const input = screen.getByRole('textbox', { name: 'Your message' });
    const text = 'do you have blue notebooks';
    fireEvent.change(input, { target: { value: text } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(within(screen.getByRole('log')).queryByText(text)).toBeNull();
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(within(screen.getByRole('log')).getAllByText(text)).toHaveLength(1);
    receive();
    expect(screen.getByText('2 / 3')).toBeTruthy();
  });

  it('keeps the chat open for follow-ups and confirms revisions explicitly', () => {
    at('/practice/place-an-order');
    for (const text of ['Two blue notebooks please', 'When will they arrive?', 'Actually make it five notebooks']) {
      send(text);
      receive();
    }
    expect(screen.getAllByRole('heading', { name: 'Conversation complete!' })).toHaveLength(1);
    expect(within(screen.getByRole('log')).getByText(/Shall I confirm those revised details/)).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Your message' }));
    send('yes');
    receive();
    expect(within(screen.getByRole('log')).getByText(/The revised details are confirmed.*5 blue notebooks/)).toBeTruthy();
    expect(screen.getByText('Follow-up')).toBeTruthy();
  });

  it('cancels the pending reply when restarting and shows suggestions only when enabled', () => {
    at('/practice/place-an-order');
    send(scenario.turns[0]!.choices[scenario.turns[0]!.answer]!.text);
    fireEvent.click(screen.getByRole('button', { name: 'Restart conversation' }));
    receive();
    expect(screen.getByText('1 / 3')).toBeTruthy();
    expect(screen.queryByText(scenario.turns[1]!.prompt)).toBeNull();
    const toggle = screen.getByRole('switch', { name: 'Show suggested replies' });
    expect(screen.queryByRole('group', { name: 'Suggested replies' })).toBeNull();
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(toggle);
    expect(screen.getByRole('group', { name: 'Suggested replies' })).toBeTruthy();
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(toggle);
    expect(screen.queryByRole('group', { name: 'Suggested replies' })).toBeNull();
    expect(toggle.getAttribute('aria-checked')).toBe('false');
  });

  it('plays only requested messages with optional slow playback', () => {
    jest.mocked(useSpeech).mockReturnValue({ supported: true, speaking: false, speak, stop });
    at('/practice/place-an-order');
    expect(speak).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Slow audio' }));
    fireEvent.click(screen.getByRole('button', { name: `Listen: ${scenario.turns[0]!.prompt}` }));
    expect(speak).toHaveBeenLastCalledWith(scenario.turns[0]!.prompt, 'slow');
    const reply = scenario.turns[0]!.choices[scenario.turns[0]!.answer]!.text;
    send(reply);
    expect(stop).toHaveBeenCalled();
    receive();
    fireEvent.click(screen.getByRole('button', { name: `Listen: ${reply}` }));
    expect(speak).toHaveBeenLastCalledWith(reply, 'slow');
  });

  it('starts advanced practice with Tamil help off', () => {
    at('/practice/negotiate-a-deadline');
    const button = screen.getByRole('button', { name: 'Tamil help' });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });
});
