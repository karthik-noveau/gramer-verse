import { useEffect, useReducer, useRef, useState } from 'react';
import type { JSX } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';

import { Button } from 'common/components/Button/Button';
import { Icon } from 'common/components/Icon/Icon';
import { paths } from 'common/constants/routes';
import { useSpeech } from 'common/hooks/useSpeech';

import { CATEGORIES, LEVELS, SCENARIOS } from './data';
import type { Category, Scenario } from './data';
import { INITIAL_SESSION, MAX_REPLY_LENGTH, reduceSession } from './session';
import type { SessionAction } from './session';
import { conversationSuggestions } from './suggestions';
import styles from './styles.module.css';

export default function PracticePage(): JSX.Element {
  const { scenarioId } = useParams();
  useEffect(() => {
    document.scrollingElement?.scrollTo?.({ top: 0, behavior: 'instant' });
  }, [scenarioId]);
  if (!scenarioId) return <Catalogue />;
  const scenario = SCENARIOS.find((item) => item.id === scenarioId);
  return scenario ? <Conversation key={scenario.id} scenario={scenario} /> : (
    <section className={styles.empty}>
      <Icon name="search" />
      <h1>Scenario not found</h1>
      <p>Choose a conversation from the practice collection.</p>
      <Button variant="primary" to={paths.practice()}>Browse scenarios</Button>
    </section>
  );
}

function ScenarioIcon({ category }: { readonly category: Category }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {category === 'orders' && <><path d="M5 7h14l1 14H4L5 7Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>}
      {category === 'office' && <><rect x="3" y="7" width="18" height="14" rx="3" /><path d="M8 7V4h8v3M3 12a20 20 0 0 0 18 0M10 13h4" /></>}
      {category === 'hotel' && <><path d="M3 20V8m18 12V8M3 17h18M3 11h18v6H3zM6 11V6h12v5M9 8h1m4 0h1" /></>}
      {category === 'dining' && <><path d="M4 5h13v9a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V5ZM17 7h2a3 3 0 0 1 0 6h-2M3 22h16" /></>}
    </svg>
  );
}

function Catalogue(): JSX.Element {
  const [params, setParams] = useSearchParams();
  const level = LEVELS.find((item) => item.id === params.get('level'))?.id ?? 'all';
  const category = CATEGORIES.find((item) => item.id === params.get('category'))?.id ?? 'all';
  const query = params.get('q') ?? '';
  const search = params.toString();
  const scenarios = SCENARIOS.filter((item) =>
    (level === 'all' || item.level === level) &&
    (category === 'all' || item.category === category) &&
    `${item.title} ${item.summary} ${item.goal} ${item.skills.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const filter = (key: string, value: string): void => {
    const next = new URLSearchParams(params);
    if (value === 'all' || value === '') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  return (
    <div className={`${styles.page} ${styles.cataloguePage}`}>
      <header className={styles.intro}>
        <div>
          <h1>Practice</h1>
          <p className={styles.description}>Everyday conversations. Choose a situation and start chatting.</p>
        </div>
        <label className={styles.search}><Icon name="search" size="sm" /><span className="sr-only">Search scenarios</span><input type="search" value={query} placeholder="Search conversations" onChange={(event) => filter('q', event.target.value)} /></label>
      </header>

      <section className={styles.catalogue} aria-labelledby="choose-scenario">
        <h2 id="choose-scenario" className="sr-only">Choose a conversation</h2>
        <div className={styles.levels} role="group" aria-label="Difficulty">
          <button type="button" aria-pressed={level === 'all'} onClick={() => filter('level', 'all')}>All levels</button>
          {LEVELS.map((item) => (
            <button type="button" key={item.id} aria-pressed={level === item.id} onClick={() => filter('level', item.id)} title={item.description}>
              {item.label}
            </button>
          ))}
        </div>
        <div className={styles.categoryRow}>
          <div className={styles.categories} role="group" aria-label="Situation">
            <button type="button" aria-pressed={category === 'all'} onClick={() => filter('category', 'all')}>All situations</button>
            {CATEGORIES.map((item) => <button type="button" key={item.id} aria-pressed={category === item.id} onClick={() => filter('category', item.id)}>{item.label}</button>)}
          </div>
          <span className={styles.resultCount} role="status">{scenarios.length} {scenarios.length === 1 ? 'scenario' : 'scenarios'}</span>
        </div>
        {scenarios.length ? (
          <ul className={styles.grid} aria-label="Practice scenarios">
            {scenarios.map((scenario) => (
              <li key={scenario.id}>
                <Link className={styles.scenarioCard} to={`${paths.practiceScenario(scenario.id)}${search ? `?${search}` : ''}`} aria-label={`Practice: ${scenario.title}`}>
                  <span className={styles.categoryIcon}><ScenarioIcon category={scenario.category} /></span>
                  <div className={styles.cardContent}>
                    <h3>{scenario.title}</h3>
                    <p>{scenario.summary}</p>
                    <span className={styles.cardMeta}>{LEVELS.find((item) => item.id === scenario.level)?.label}<span aria-hidden="true"> · </span>3–5 min</span>
                  </div>
                  <span className={styles.cardArrow}><Icon name="chevronRight" size="sm" /></span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}><Icon name="search" /><h3>No matching conversations</h3><p>Try a different phrase or reset your filters.</p><Button onClick={() => setParams({}, { replace: true })}>Reset filters</Button></div>
        )}
      </section>
      <p className={styles.catalogueNote}>Tamil help available · Local, rule-based practice · No real bookings or orders</p>
    </div>
  );
}

function Conversation({ scenario }: { readonly scenario: Scenario }): JSX.Element {
  const [params] = useSearchParams();
  const search = params.toString();
  const backTo = `${paths.practice()}${search ? `?${search}` : ''}`;
  const [session, dispatch] = useReducer((state: typeof INITIAL_SESSION, action: SessionAction) => reduceSession(scenario, state, action), INITIAL_SESSION);
  const [draft, setDraft] = useState('');
  const [showTamil, setShowTamil] = useState(scenario.level === 'beginner');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [slow, setSlow] = useState(false);
  const [playingText, setPlayingText] = useState('');
  const speech = useSpeech();
  const transcriptRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const summaryRef = useRef<HTMLHeadingElement>(null);
  const turn = scenario.turns[session.turn];
  const complete = !turn;
  const level = LEVELS.find((item) => item.id === scenario.level);
  const peers = SCENARIOS.filter((item) => item.level === scenario.level);
  const next = peers[(peers.findIndex((item) => item.id === scenario.id) + 1) % peers.length];
  const latest = session.replies[session.replies.length - 1];
  const suggestions = conversationSuggestions(scenario, session.turn, session.dialogue);

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, []);

  useEffect(() => {
    if (!session.pending) return;
    const timer = window.setTimeout(() => dispatch({ type: 'receive' }), 650);
    return () => window.clearTimeout(timer);
  }, [session.pending]);

  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    if (!session.pending && session.replies.length > 0) {
      (complete && (session.replies[session.replies.length - 1]?.turn ?? 0) < scenario.turns.length ? summaryRef.current : composerRef.current)?.focus({ preventScroll: true });
    }
  }, [complete, session.replies, session.pending, scenario.turns.length]);

  const send = (): void => {
    if (session.pending || !draft.trim()) return;
    speech.stop();
    dispatch({ type: 'send', text: draft });
    setDraft('');
  };
  const restart = (): void => {
    speech.stop();
    dispatch({ type: 'restart' });
    setDraft('');
    headingRef.current?.focus({ preventScroll: true });
  };
  const listen = (text: string): void => {
    if (speech.speaking && playingText === text) speech.stop();
    else { setPlayingText(text); speech.speak(text, slow ? 'slow' : 'normal'); }
  };
  const bubbleAudio = speech.supported ? { onListen: listen, playingText: speech.speaking ? playingText : '' } : {};
  const review = <section className={styles.chatComplete} aria-label="Conversation review">
    <span className={styles.completionLabel}><Icon name="check" size="sm" /> Nicely done</span>
    <h2 ref={summaryRef} tabIndex={-1}>Conversation complete!</h2>
    <p>You’ve covered all {scenario.turns.length} conversation goals. You can keep chatting or try another situation.</p>
    <details className={styles.review}>
      <summary>Review useful phrases</summary>
      <ol>{scenario.turns.map((item, index) => <li key={index}><strong>{item.choices[item.answer]?.text}</strong>{showTamil && <p lang="ta">{item.replyTamil}</p>}<p>{item.choices[item.answer]?.feedback}</p></li>)}</ol>
    </details>
  </section>;

  return (
    <div className={`${styles.page} ${styles.chatPage}`}>
      <div className={styles.chatBreadcrumb}>
        <Link className={styles.backLink} to={backTo}><Icon name="chevronLeft" size="sm" /> All scenarios</Link>
        <span className={styles.levelBadge} data-level={scenario.level}>{level?.label}</span>
      </div>

      <section className={styles.conversation} aria-label="Conversation practice">
        <header className={styles.chatHeader}>
          <span className={styles.partnerAvatar}><ScenarioIcon category={scenario.category} /></span>
          <div className={styles.chatIdentity}>
            <h1 ref={headingRef} tabIndex={-1}>{scenario.title}</h1>
            <p>{scenario.partner}<span aria-hidden="true"> · </span><span>Practice partner</span></p>
          </div>
          <button type="button" className={styles.iconButton} aria-label="Restart conversation" title="Restart conversation" onClick={restart}>
            <ChatIcon name="restart" />
          </button>
        </header>

        <div className={styles.chatToolbar}>
          <span className={styles.chatMode} title="Local rules recognize common intents and details. No AI model or chat server.">Local · No AI</span>
          <div className={styles.chatSettings}>
            <button type="button" className={styles.settingButton} aria-label="Tamil help" aria-pressed={showTamil} onClick={() => setShowTamil(!showTamil)}>
              <span lang="ta" aria-hidden="true">அ</span> Tamil
            </button>
            {speech.supported && <button type="button" className={styles.settingButton} aria-label="Slow audio" aria-pressed={slow} onClick={() => setSlow(!slow)}>½× Audio</button>}
          </div>
        </div>

        <div ref={transcriptRef} className={styles.transcript} role="log" aria-label="Conversation transcript" aria-live="polite" aria-relevant="additions" tabIndex={0}>
          <div className={styles.chatContext}>
            <span>{CATEGORIES.find((item) => item.id === scenario.category)?.label} · You’re the {scenario.role.toLowerCase()}</span>
            <p>{scenario.goal}</p>
          </div>
          {scenario.turns[0] && <Bubble speaker={scenario.partner} text={scenario.turns[0].prompt} tamil={showTamil ? scenario.turns[0].tamil : undefined} {...bubbleAudio} />}
          {session.replies.map((reply, index) => (
            <div className={styles.exchange} key={index}>
              <Bubble speaker="You" text={reply.text} tamil={showTamil && reply.choice === scenario.turns[reply.turn]?.answer ? scenario.turns[reply.turn]?.replyTamil : undefined} yours {...bubbleAudio} />
              {!(session.pending && reply === latest) && <>
                <Bubble speaker={scenario.partner} text={reply.response.text} tamil={showTamil ? reply.response.tamil : undefined} {...bubbleAudio} />
                {reply.response.tip && <div className={styles.chatTip}>
                  <span className={styles.tipLabel}><ChatIcon name="spark" /> Practice tip</span>
                  <p>{reply.response.tip}</p>
                </div>}
                {reply.turn < scenario.turns.length && reply.turn + reply.response.advanceBy >= scenario.turns.length && review}
              </>}
            </div>
          ))}
          {session.pending && <div className={styles.typing} role="status" aria-label={`${scenario.partner} is typing`}>
            <span aria-hidden="true"><i /><i /><i /></span>
            <small>{scenario.partner} is typing…</small>
          </div>}
        </div>

        <form className={styles.composer} aria-label="Message composer" onSubmit={(event) => { event.preventDefault(); send(); }}>
          <div className={styles.composerHeading}>
            <button type="button" role="switch" className={styles.suggestionToggle} aria-checked={showSuggestions} aria-controls="reply-suggestions" onClick={() => setShowSuggestions((shown) => !shown)}>
              <span className={styles.switchTrack} aria-hidden="true" />
              Show suggested replies
            </button>
            <span className={styles.turnCount}>{complete ? 'Follow-up' : `${session.turn + 1} / ${scenario.turns.length}`}</span>
          </div>
          <div id="reply-suggestions" hidden={!showSuggestions}>
            <p className={styles.replyTask} id="reply-task">{suggestions.hint}</p>
            <div className={styles.suggestions} role="group" aria-label="Suggested replies">
              {suggestions.replies.map((text, index) => <button type="button" key={`${session.turn}-${index}`} disabled={session.pending} aria-pressed={draft === text}
                onClick={() => { setDraft(text); composerRef.current?.focus({ preventScroll: true }); }}>{text}</button>)}
            </div>
          </div>
          <div className={styles.inputRow} data-pending={session.pending}>
            <label className="sr-only" htmlFor="chat-message">Your message</label>
            <textarea ref={composerRef} id="chat-message" rows={2} maxLength={MAX_REPLY_LENGTH} value={draft} readOnly={session.pending}
              aria-describedby="composer-note" placeholder={session.pending ? 'Waiting for a reply…' : 'Type your reply…'}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229) {
                  event.preventDefault(); send();
                }
              }} />
            <button type="submit" className={styles.sendButton} disabled={session.pending || !draft.trim()} aria-label="Send message" title="Send message"><ChatIcon name="send" /></button>
          </div>
          <p className={styles.composerNote} id="composer-note">Use your own words · Type “help” for a hint · Simulated conversation</p>
        </form>
        {complete && <div className={styles.finishedActions}>
          <Button onClick={restart}>Practice again</Button>
          {next && <Button variant="primary" to={paths.practiceScenario(next.id)}>Next conversation <Icon name="chevronRight" size="sm" /></Button>}
        </div>}
      </section>
    </div>
  );
}

function ChatIcon({ name }: { readonly name: 'send' | 'restart' | 'audio' | 'spark' }): JSX.Element {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {name === 'send' && <><path d="m21 3-6.5 18-4-7.5L3 9.5 21 3Z" /><path d="m10.5 13.5 5-5" /></>}
    {name === 'restart' && <><path d="M4 10a8 8 0 1 1 1.6 7M4 4v6h6" /></>}
    {name === 'audio' && <><path d="m11 4-5 4H3v8h3l5 4V4ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>}
    {name === 'spark' && <><path d="m10 3 2.5 6.5L19 12l-6.5 2.5L10 21l-2.5-6.5L1 12l6.5-2.5L10 3ZM20 2v6m-3-3h6" /></>}
  </svg>;
}

function Bubble({ speaker, text, tamil, yours = false, onListen, playingText }: {
  readonly speaker: string;
  readonly text: string;
  readonly tamil?: string | undefined;
  readonly yours?: boolean;
  readonly onListen?: (text: string) => void;
  readonly playingText?: string;
}): JSX.Element {
  return <div className={styles.message} data-yours={yours}>
    {!yours && <span className={styles.messageAvatar} aria-hidden="true">{speaker.split(' ').map((word) => word[0]).slice(0, 2).join('')}</span>}
    <div className={styles.messageContent}>
      <span className={styles.speaker}>{speaker}</span>
      <div className={styles.bubble}>
        <p>{text}</p>
        {tamil && <p className={styles.translation} lang="ta">{tamil}</p>}
      </div>
      {onListen && <button type="button" className={styles.listenButton} aria-label={playingText === text ? 'Stop audio' : `Listen: ${text}`} onClick={() => onListen(text)}>
        <ChatIcon name="audio" /><span>{playingText === text ? 'Stop' : 'Listen'}</span>
      </button>}
    </div>
  </div>;
}
