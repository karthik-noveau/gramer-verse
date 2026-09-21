import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, JSX } from 'react';
import { useSearchParams } from 'react-router';
import { Formation, fromScene } from 'common/components/Formation/Formation';
import { useContent } from 'common/hooks/useContent';
import { useSpeech } from 'common/hooks/useSpeech';
import { buildSentence, sentenceText } from 'common/scene/sentence';
import type { SentenceTemplates } from 'common/scene/types';
import { CannotDraw } from './components/CannotDraw/CannotDraw';
import { SentencePicker } from './components/SentencePicker/SentencePicker';
import type { SentencePickerProps } from './components/SentencePicker/SentencePicker';
import { PLACE_MEANINGS, PrepositionPicture } from './components/PrepositionPicture/PrepositionPicture';
import { examplesFor } from './utils/examples';
import { WORDS, knobAllows, modeOf, selectScene, useVisualizerStore } from 'store/visualizer.store';
import { LabIcon } from 'common/visual-learning/art';
import { GROUPS } from './learning';
import { CompareMode, PracticeMode } from './LearningModes';
import { PanelHeader } from './PanelHeader';
import { TimeExperiment } from './TimeExperiment';
import { InteractiveRoom } from './InteractiveRoom';
import { DEFAULT_ROOM_POSITION, roomSpec } from './room';
import type { RoomPreview } from './room';
import { POSITIONS } from 'common/visual-learning/data';
import type { Position } from 'common/visual-learning/data';
import styles from './styles.module.css';

const TEMPLATE: SentenceTemplates = {
  en: [
    { slot: 'det' },
    { slot: 'adj' },
    { slot: 'figure' },
    { slot: 'be' },
    { slot: 'relation' },
    { slot: 'text', text: 'the' },
    { slot: 'ground' },
    { slot: 'text', text: '.' },
  ],
  ta: [
    { slot: 'det' },
    { slot: 'adj' },
    { slot: 'figure', case: 'nominative' },
    { slot: 'ground', case: 'locative' },
    { slot: 'be' },
    { slot: 'text', text: '.' },
  ],
};


type LearningMode = 'explore' | 'compare' | 'practice';
const MODES = ['explore', 'compare', 'practice'] as const;
const ROOM_WORDS: readonly string[] = POSITIONS.map((position) => position.id);

export default function VisualizerPage(): JSX.Element {
  const content = useContent();
  const [params, setParams] = useSearchParams();
  const [roomMode, setRoomMode] = useState(false);
  const [roomPreview, setRoomPreview] = useState<RoomPreview | null>(null);
  const state = useVisualizerStore();
  const { group, word, typed, cannot, choose, setGroup, setKnob, setTyped, submit } = state;
  const requestedGroup = params.get('group');
  const requestedWord = params.get('word');
  const mode = (MODES as readonly string[]).includes(params.get('mode') ?? '') ? params.get('mode') as LearningMode : 'explore';

  useEffect(() => {
    const target = GROUPS.find((item) => item.slug === requestedGroup)?.id ?? 'prep-place';
    if (useVisualizerStore.getState().group !== target) setGroup(target);
    const targetWord = requestedWord && WORDS[target]?.includes(requestedWord) ? requestedWord : WORDS[target]![0]!;
    if (useVisualizerStore.getState().word !== targetWord) choose(targetWord, target);
  }, [requestedGroup, requestedWord, setGroup, choose]);

  useEffect(() => {
    const current = useVisualizerStore.getState();
    if (content.status === 'ready' && !current.cannot && modeOf(current.word, current.group) === 'diagram') choose(current.word);
  }, [content.status, choose]);

  const updateUrl = (nextGroup: string, nextWord: string, nextMode: LearningMode = mode): void => {
    const slug = GROUPS.find((item) => item.id === nextGroup)?.slug ?? 'place';
    setParams({ group: slug, word: nextWord, ...(nextMode === 'explore' ? {} : { mode: nextMode }) }, { replace: true });
  };
  const moveBall = (position: Position): void => {
    const draft = useVisualizerStore.getState().typed;
    submit(`the ball is ${position.id} ${position.ending}`);
    setTyped(draft);
    updateUrl('prep-place', position.id);
  };
  const selectWord = (next: string): void => {
    const position = POSITIONS.find((item) => item.id === next);
    if (roomMode && group === 'prep-place' && position) moveBall(position);
    else { setRoomMode(false); choose(next); updateUrl(group, next); }
  };
  const selectGroup = (next: string): void => { setRoomMode(false); setGroup(next); updateUrl(next, useVisualizerStore.getState().word, 'explore'); };
  const draw = (text: string): void => { setRoomMode(false); submit(text); const current = useVisualizerStore.getState(); updateUrl(current.group, current.word, 'explore'); };
  const scene = useMemo(() => selectScene(state), [state]);
  const preview = roomMode && group === 'prep-place' && mode === 'explore' ? roomPreview : null;
  const displayedScene = useMemo(() => preview?.position ? roomSpec(preview.position) : scene, [preview, scene]);
  const liveWord = preview ? preview.position?.id ?? '' : word;
  const curriculum = content.status === 'ready' ? content.curriculum : null;
  const examples = useMemo(() => examplesFor(curriculum, group), [curriculum, group]);
  const example = examples.find((candidate) => candidate.word === word);
  const formation = useMemo(() => preview && !preview.position ? undefined : displayedScene?.kind === 'place' ? fromScene(displayedScene, TEMPLATE) : example?.formation, [displayedScene, example, preview]);
  const sentence = useMemo(() => {
    if (preview && !preview.position) return { en: 'Move the ball around the box and table.', ta: 'பந்தைப் பெட்டி மற்றும் மேசையைச் சுற்றி நகர்த்துங்கள்.' };
    if (displayedScene?.kind !== 'place') return example?.formation;
    const built = buildSentence(displayedScene, TEMPLATE);
    return { en: sentenceText(built.en), ta: sentenceText(built.ta) };
  }, [displayedScene, example, preview]);
  const words = WORDS[group] ?? [];
  const groupInfo = GROUPS.find((item) => item.id === group) ?? GROUPS[0];
  const roomPosition = POSITIONS.find((item) => item.id === word);
  const showRoom = roomMode && scene?.kind === 'place' && roomPosition && scene.figure === 'ball' && scene.count === 1
    && scene.adjective === null && scene.ground === (word === 'on' || word === 'under' ? 'table' : 'box')
    && (word !== 'between' || scene.ground2 === 'table');
  const availableWords = showRoom ? words.filter((candidate) => ROOM_WORDS.includes(candidate)) : words;
  const wordIndex = availableWords.indexOf(word);
  const modeNavigation = <div className={styles.modeSwitch} role="group" aria-label="Learning mode">
    {MODES.map((item) => <button type="button" key={item} aria-pressed={mode === item} onClick={() => updateUrl(group, word, item)}>{item[0]!.toUpperCase() + item.slice(1)}</button>)}
  </div>;

  return <div className={styles.lab}>
    <header className={styles.header}>
      <h1>Preposition <em>visualizer</em></h1>
      <nav className={styles.groups} aria-label="Preposition group" style={{ '--group-index': GROUPS.findIndex((entry) => entry.id === group) } as CSSProperties}>
        {GROUPS.map((entry) => <button type="button" key={entry.id} aria-pressed={entry.id === group} onClick={() => selectGroup(entry.id)} aria-label={`${entry.en} ${entry.ta}`} title={entry.question}>
          <LabIcon name={entry.icon} size={17} /><span>{entry.en}</span>
        </button>)}
      </nav>
    </header>

    {mode === 'explore' ? <>
      <div className={styles.workspace}>
        <PanelHeader navigation={modeNavigation}>
          {displayedScene?.kind === 'place' ? <div className={styles.sceneSummary}>
            {preview && !preview.position ? <span>Move the ball</span> : <><strong>{displayedScene.relation}</strong><span>{PLACE_MEANINGS[displayedScene.relation]}</span></>}
          </div> : <span><i /> {groupInfo.en.toUpperCase()} IN FOCUS</span>}
          {group === 'prep-place' && <div className={styles.sceneSwitch} role="group" aria-label="Scene interaction"><button type="button" aria-pressed={!showRoom} onClick={() => setRoomMode(false)}>Picture</button><button type="button" aria-pressed={Boolean(showRoom)} onClick={() => { if (!showRoom) { setRoomMode(true); moveBall(DEFAULT_ROOM_POSITION); } }}>Move the ball <span aria-hidden="true">↗</span></button></div>}
          <div className={styles.sceneNavigation} role="group" aria-label="Preposition navigation">
            <span>{String(wordIndex + 1).padStart(2, '0')} / {availableWords.length}</span>
            <button type="button" aria-label="Previous preposition" onClick={() => selectWord(availableWords[(wordIndex + availableWords.length - 1) % availableWords.length]!)}>←</button>
            <button type="button" aria-label="Next preposition" onClick={() => selectWord(availableWords[(wordIndex + 1) % availableWords.length]!)}>→</button>
          </div>
        </PanelHeader>
        <div className={styles.visualColumn}>
          <div className={styles.stage}>{showRoom ? <InteractiveRoom position={roomPosition} onChange={moveBall} onPreview={setRoomPreview} /> : scene && (scene.kind === 'timeline' ? <TimeExperiment key={word} word={word} spec={scene} english={sentence?.en} tamil={sentence?.ta} /> : <PrepositionPicture spec={scene} english={sentence?.en} tamil={sentence?.ta} showHeading={scene.kind !== 'place'} />)}</div>
          <Lines key={group} english={sentence?.en ?? ''} tamil={sentence?.ta ?? ''} word={liveWord} live={Boolean(preview)} showPreview={!cannot} pickerProps={{ value: typed, examples: examples.map((candidate) => candidate.en), onChange: setTyped, onDraw: draw }} />
          {cannot && <div className={styles.sentenceFeedback}><CannotDraw unknown={cannot.unknown} gaps={cannot.gaps} verb={cannot.verb} suggestion={cannot.suggestion} onTry={(text) => { setTyped(text); draw(text); }} /></div>}
        </div>
        <aside className={styles.controls} aria-label="Explore the relationship">
          <h2>{groupInfo.question}</h2><p className={styles.controlIntro}>{showRoom ? 'Pick up the ball to reveal the drop positions. Move to a faint ball and release.' : 'Choose a word and follow what changes in the picture.'}</p>
          <div className={styles.picker} role="group" aria-label="Preposition">{words.map((candidate) => <button type="button" key={candidate} aria-pressed={liveWord === candidate} disabled={Boolean(showRoom) && !ROOM_WORDS.includes(candidate)} onClick={() => selectWord(candidate)}>{candidate}</button>)}</div>
          {showRoom && <p className={styles.pickerHint}>Switch to Picture to explore the other words.</p>}
          {!showRoom && scene?.kind === 'place' && <div className={styles.quantity} role="group" aria-label="How many"><span>How many</span><div>{['one', 'two', 'three'].map((label, index) => <button type="button" key={label} aria-pressed={state.place.count === index + 1} disabled={!knobAllows(state, 'count', String(index + 1))} onClick={() => { setRoomMode(false); setKnob('count', String(index + 1)); }}>{label}</button>)}</div></div>}

        </aside>
      </div>
      {formation && <section className={styles.formation} aria-labelledby="formation-title"><div className={styles.formationHeading}><h2 id="formation-title">Formation</h2><span>See how the relationship fits into a sentence.</span></div><Formation className={styles.formationBody} spec={formation} /></section>}
    </> : mode === 'compare' ? <CompareMode key={group} group={group} state={state} curriculum={curriculum} showTamil navigation={modeNavigation} /> : <PracticeMode key={group} group={group} navigation={modeNavigation} onExplore={(next) => { choose(next); updateUrl(group, next, 'explore'); }} />}
    <footer className={styles.labFooter}><span>Little experiments. Lasting understanding.</span><span>Place · Direction · Time · Relationships</span></footer>
  </div>;
}

function Lines({ english, tamil, word, live, showPreview, pickerProps }: { readonly english: string; readonly tamil: string; readonly word: string; readonly live: boolean; readonly showPreview: boolean; readonly pickerProps: Omit<SentencePickerProps, 'preview'> }): JSX.Element {
  const speech = useSpeech();

  return (
    <div className={styles.lines} data-live={live}>
      {live && <span className={styles.liveSentenceLabel}>LIVE PREVIEW · RELEASE TO PLACE</span>}
      <div className={styles.sentencePicker}>
        <SentencePicker {...pickerProps} preview={showPreview && english ? <p className={styles.lineEn} lang="en">
          {(word ? english.split(new RegExp(`(\\b${word}\\b)`, 'gi')) : [english]).map((part, i) => part.toLowerCase() === word ? <mark key={i}>{part}</mark> : part)}
        </p> : undefined} />
      </div>
      {tamil && <p className={styles.lineTa} lang="ta">
        {tamil}
      </p>}
      <div className={styles.sentenceActions}>
        <div className={styles.listen} role="group" aria-label="Listen to the visualized sentence">
          <button
            type="button"
            className={styles.listenButton}
            disabled={!speech.supported || !english}
            onClick={() => speech.speak(english)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m11 5-5 4H3v6h3l5 4V5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg> Hear
          </button>
          <button
            type="button"
            className={styles.listenButton}
            disabled={!speech.supported || !english}
            onClick={() => speech.speak(english, 'slow')}
          >
            <span aria-hidden="true">½×</span> Slow
          </button>
        </div>
      </div>
    </div>
  );
}
