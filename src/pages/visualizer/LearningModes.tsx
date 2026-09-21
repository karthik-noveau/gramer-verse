import { useState } from 'react';
import type { JSX, ReactNode } from 'react';
import type { Curriculum } from 'common/scene/types';
import type { VisualizerState } from 'store/visualizer.store';
import { PrepositionPicture } from './components/PrepositionPicture/PrepositionPicture';
import { TimeRelationship } from './TimeExperiment';
import { PanelHeader } from './PanelHeader';
import { CHALLENGES, CONTRASTS, comparisonScene } from './learning';
import { examplesFor } from './utils/examples';
import styles from './styles.module.css';

export function CompareMode({ group, state, curriculum, showTamil, navigation }: { group: string; state: VisualizerState; curriculum: Curriculum | null; showTamil: boolean; navigation?: ReactNode }): JSX.Element {
  const pairs = CONTRASTS[group] ?? [];
  const [index, setIndex] = useState(0);
  const pair = pairs[index]!;
  const deadline = group === 'prep-time' && index === 0;
  return <section className={styles.modeContent} aria-label="Compare prepositions">
    <PanelHeader navigation={navigation}>
      <div className={styles.sceneSummary}><strong>Compare</strong><span>Small change, different meaning</span></div>
      <div className={styles.sceneNavigation}><span>{String(index + 1).padStart(2, '0')} / {pairs.length}</span></div>
    </PanelHeader>
    <div className={styles.compareBody}>
      <div className={styles.modeIntro}><div><h2>{pair.title}</h2><p>Look at the relationship in each picture.</p></div></div>
      <div className={styles.pairPicker} role="group" aria-label="Comparison pairs">{pairs.map((item, i) => <button type="button" key={item.words.join('-')} aria-pressed={i === index} onClick={() => setIndex(i)}>{item.words[0]} <span>vs</span> {item.words[1]}</button>)}</div>
      <div className={styles.compareGrid}>{pair.words.map((word, i) => {
        const spec = comparisonScene(state, group, word);
        const example = examplesFor(curriculum, group).find((item) => item.word === word);
        return <div className={styles.compareCard} key={word}>
          <div className={styles.compareLabel}><span>0{i + 1}</span><strong>{word}</strong></div>
          {deadline ? <TimeRelationship word={word} deadline progress={.8} /> : spec && <PrepositionPicture spec={spec} english={example?.en} tamil={example?.formation?.ta} />}
          {group !== 'prep-place' && <p className={styles.compareSentence}>{deadline ? (word === 'by' ? 'Finish the work by 6 PM.' : 'Work until 6 PM.') : example?.en}</p>}
        </div>;
      })}</div>
      <div className={styles.takeaway}><span aria-hidden="true">↳</span><div><strong>The difference to remember</strong><p>{pair.takeaway}</p>{showTamil && <p lang="ta">{pair.ta}</p>}</div></div>
    </div>
  </section>;
}

export function PracticeMode({ group, onExplore, navigation }: { group: string; onExplore: (word: string) => void; navigation?: ReactNode }): JSX.Element {
  const questions = CHALLENGES[group]!;
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [score, setScore] = useState(0);
  const question = questions[index]!;
  const correct = guess === question.answer;
  const reset = (): void => { setIndex(0); setGuess(null); setComplete(false); setAttempted(false); setScore(0); };
  return <section className={styles.practice} aria-label="Practice prepositions">
    <PanelHeader navigation={navigation}>
      <div className={styles.sceneSummary}><strong>Practice</strong><span>Put your understanding to work</span></div>
      <div className={styles.sceneNavigation}><span>{complete ? 'Complete' : `${String(index + 1).padStart(2, '0')} / ${questions.length}`}</span></div>
    </PanelHeader>
    <div className={styles.practiceBody}>
      <div className={styles.practiceProgress}>{questions.map((_, i) => <span key={i} data-done={complete || i < index} data-current={!complete && i === index} />)}</div>
      {complete ? <div className={styles.completion}><span className={styles.completionIcon}>✓</span><h2>Three relationships, understood.</h2><p>{score} of {questions.length} correct on the first try. You worked through every explanation.</p><button type="button" className={styles.primaryButton} onClick={reset}>Practice again</button></div> : <>
        <h2>{question.prompt}</h2><p className={styles.practiceHint}>Choose the word that fits the meaning.</p>
        <div className={styles.answers}>{question.options.map((option, i) => <button type="button" key={option} disabled={correct} aria-pressed={guess === option} data-result={guess === option ? (correct ? 'correct' : 'retry') : undefined} onClick={() => { setGuess(option); if (option === question.answer && !attempted) setScore((value) => value + 1); setAttempted(true); }}><span>0{i + 1}</span>{option}{guess === option && <span className={styles.answerMark}>{correct ? '✓' : '↻'}</span>}</button>)}</div>
        <div className={styles.answerFeedback} role="status">{guess === null ? 'Think about the relationship, then choose.' : correct ? `That’s right. ${question.explanation}` : `“${guess}” does not express this relationship. Read the situation again and try another word.`}</div>
        {correct && <div className={styles.practiceActions}><button type="button" className={styles.textButton} onClick={() => onExplore(question.answer)}>See “{question.answer}” in the visualizer ↗</button><button type="button" className={styles.primaryButton} onClick={() => { if (index === questions.length - 1) setComplete(true); else { setIndex((value) => value + 1); setGuess(null); setAttempted(false); } }}>{index === questions.length - 1 ? 'See results' : 'Next situation'} →</button></div>}
      </>}
    </div>
  </section>;
}
