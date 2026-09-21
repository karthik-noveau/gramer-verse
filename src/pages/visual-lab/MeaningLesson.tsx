import { useState } from 'react';
import type { JSX } from 'react';
import { LabIcon, StoryScene } from 'common/visual-learning/art';
import { COMPARISONS } from 'common/visual-learning/data';
import { Insight, PlaybackBar, Sentence } from 'common/visual-learning/shared';
import { usePlayback } from 'common/visual-learning/usePlayback';
import styles from 'common/visual-learning/styles.module.css';

function Comparison({ example, showTamil }: { example: (typeof COMPARISONS)[number]; showTamil: boolean }): JSX.Element {
  const playback = usePlayback(7000, 0, true);
  const [guess, setGuess] = useState<number | null>(null);
  const correctStory = example.answer === 0 ? example.left : example.right;
  const otherStory = example.answer === 0 ? example.right : example.left;
  return <div className={styles.workspace}>
    <div className={styles.visualColumn}>
      <div className={styles.stageHeading}><span><span className={styles.liveDot} /> TWO SENTENCES. TWO STORIES.</span><span>03 / 03</span></div>
      <div className={styles.comparisonScenes}>
        {[example.left, example.right].map((story, index) => <div className={styles.story} key={`${example.id}-${index}`}>
          <div className={styles.storyLabel}><span>{index === 0 ? 'A' : 'B'}</span><strong>{story.meaning}</strong></div>
          <StoryScene kind={example.id} side={index} progress={playback.progress} reduced={playback.reduced} />
          <Sentence english={`${story.start}${story.focus}${story.end}`} tamil={story.ta} showTamil={showTamil}>{story.start}<mark>{story.focus}</mark>{story.end}</Sentence>
          <p className={styles.storyCaption}>{story.caption}</p>
        </div>)}
      </div>
      <PlaybackBar playback={playback} label="Play both scenes" />
      <div className={styles.meaningTakeaway}><span className={styles.eyebrow}>THE WORDS THAT CHANGE THE STORY</span><p>{example.takeaway}</p></div>
    </div>
    <aside className={styles.lessonControls}>
      <span className={styles.eyebrow}>LOOK A LITTLE CLOSER</span><h2>Small words. Big difference.</h2><p className={styles.controlIntro}>Play both scenes together. Follow the highlighted words to see what each sentence means.</p>
      <Insight>{example.id === 'stop' ? 'On the left, the action ends. On the right, a new action explains the pause.' : example.id === 'read' ? 'An open book shows the action in progress. A closed book shows completion.' : 'Being ready to jump is different from being in the air.'}</Insight>
      <div className={styles.challenge}>
        <span className={styles.eyebrow}>YOUR TURN</span><p>{example.question}</p>
        <div className={styles.sceneAnswers}>{[0, 1].map((answer) => <button type="button" key={answer} aria-pressed={guess === answer} onClick={() => setGuess(answer)} data-result={guess === answer ? (answer === example.answer ? 'correct' : 'retry') : undefined}>Scene {answer === 0 ? 'A' : 'B'}{guess === answer && answer === example.answer && <LabIcon name="check" size={16} />}</button>)}</div>
        <p className={styles.feedback} role="status">{guess === null ? 'Choose the scene that matches.' : guess === example.answer ? `Yes! ${correctStory.meaning}` : `Look again. ${otherStory.meaning} Try the other scene.`}</p>
      </div>
    </aside>
  </div>;
}

export default function MeaningLesson({ showTamil }: { showTamil: boolean }): JSX.Element {
  const [selected, setSelected] = useState(0);
  return <>
    <div className={styles.examplePicker} role="group" aria-label="Sentence pair">{COMPARISONS.map((example, i) => <button type="button" key={example.id} onClick={() => setSelected(i)} aria-pressed={selected === i}><span>0{i + 1}</span>{example.label}</button>)}</div>
    <Comparison key={selected} example={COMPARISONS[selected]!} showTamil={showTamil} />
  </>;
}
