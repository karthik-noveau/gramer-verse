import { useId } from 'react';
import type { CSSProperties, JSX } from 'react';
import { nodeToSvg } from 'common/components/Stage/toSvg';
import { woodenBoxBack, woodenBoxFront } from 'common/scene/props/wooden-box';
import styles from './styles.module.css';

export function LabIcon({ name, size = 20 }: { name: 'space' | 'time' | 'meaning' | 'play' | 'pause' | 'replay' | 'sound' | 'arrow' | 'check'; size?: number }): JSX.Element {
  const paths = {
    space: <><path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3" /></>,
    time: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    meaning: <><rect x="3" y="5" width="7" height="14" rx="2" /><rect x="14" y="5" width="7" height="14" rx="2" /><path d="m6 10 2 2-2 2m11-4 2 2-2 2" /></>,
    play: <path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none" />,
    pause: <><path d="M8 5v14M16 5v14" strokeWidth="3" /></>,
    replay: <><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" /></>,
    sound: <><path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function Ball(): JSX.Element {
  const id = useId();
  return <g>
    <defs><radialGradient id={id} cx="30%" cy="24%" r="78%"><stop stopColor="var(--lab-ball-light)" /><stop offset=".52" stopColor="var(--lab-ball)" /><stop offset="1" stopColor="var(--lab-ball-dark)" /></radialGradient></defs>
    <circle r="24" fill={`url(#${id})`} />
    <path d="M-21-10Q-5-3 6-22M-22 8Q0 3 17 17M8-22Q0 0 17 17" fill="none" stroke="var(--lab-ball-dark)" strokeWidth="1.6" opacity=".55" />
    <ellipse cx="-8" cy="-12" rx="7" ry="4" fill="var(--lab-white)" opacity=".36" transform="rotate(-35 -8 -12)" />
  </g>;
}

export function SpaceRoom(): JSX.Element {
  return <g aria-hidden="true">
    <path d="M0 0H720V292H0Z" fill="var(--lab-wall)" />
    <path d="M0 292H720V420H0Z" fill="var(--lab-floor)" />
    <path d="M0 292H720" stroke="var(--lab-edge)" />
    <path d="M40 420 190 292M240 420 285 292M480 420 415 292M680 420 520 292M0 352H720" stroke="var(--lab-edge)" opacity=".45" />
    <path d="M84 292V153a84 84 0 0 1 168 0v139" fill="var(--lab-arch)" />
    <path d="M93 292V153a75 75 0 0 1 150 0v139" fill="var(--lab-wall)" />
    <path d="M445 0 600 0 408 292 287 292Z" fill="var(--lab-white)" opacity=".3" />
    <g transform="translate(616 192)"><ellipse cy="154" rx="34" ry="8" fill="var(--lab-shadow)" /><path d="m-25 111 6 39h36l8-39Z" fill="var(--lab-pot)" /><path d="M0 114V33m0 63-19-24m19 7 22-28" stroke="var(--lab-green-dark)" strokeWidth="4" /><path d="M0 70C-33 73-45 47-29 38-4 29 1 62 0 70ZM1 49C-19 16 2-5 15 10 30 27 9 44 1 49ZM4 86C8 54 40 42 43 61 47 80 18 89 4 86Z" fill="var(--lab-green)" /></g>
  </g>;
}

export function Crate({ x, front = false, shadow = true }: { x: number; front?: boolean; shadow?: boolean }): JSX.Element {
  return <g transform={`translate(${x} 255)`} aria-hidden="true">
    {!front && shadow && <ellipse cx="2" cy="87" rx="68" ry="12" fill="var(--lab-shadow)" />}
    <g transform="translate(-53 -7) scale(.5)">{(front ? woodenBoxFront() : woodenBoxBack()).map((node) => nodeToSvg(node))}</g>
  </g>;
}
export function Table({ layer = 'all' }: { layer?: 'all' | 'back' | 'front' }): JSX.Element {
  return <g aria-hidden="true">
    {layer !== 'front' && <>
      <ellipse cx="398" cy="348" rx="121" ry="14" fill="var(--lab-shadow)" />
      <path d="m319 231-8 110h13l13-110m127 0 10 109h13l-5-112" fill="var(--lab-green-dark)" />
      <path d="M281 224 309 207H493L468 224Z" fill="var(--lab-table-top)" />
    </>}
    {layer !== 'back' && <>
      <path d="m292 235-9 110h16l14-110m135 0 5 110h16l-2-110" fill="var(--lab-green)" />
      <path d="M281 224H468v16H281Z" fill="var(--lab-green)" />
      <path d="m468 224 25-17v16l-25 17Z" fill="var(--lab-green-dark)" />
      <path d="M283 225h183" stroke="var(--lab-white)" opacity=".32" />
    </>}
  </g>;
}

export function Person({ x, y, scale = 1, stride = 0, wave = false, female = false, crouch = 0 }: { x: number; y: number; scale?: number; stride?: number; wave?: boolean; female?: boolean; crouch?: number }): JSX.Element {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <g transform={`translate(0 ${crouch})`}>
      <g transform={`rotate(${stride} -10 -52)`}><path d="M-10-52-15-5" stroke="var(--lab-trousers)" strokeWidth="15" strokeLinecap="round" /><path d="M-17-6h-12q-7 9 2 10h19v-9Z" fill="var(--lab-hair)" /></g>
      <g transform={`rotate(${-stride} 10 -52)`}><path d="M10-52 17-5" stroke="var(--lab-trousers-light)" strokeWidth="15" strokeLinecap="round" /><path d="M12-6h17q10 8 0 10H11Z" fill="var(--lab-hair)" /></g>
      <path d="M-22-103q23-11 44 0l5 51h-53Z" fill={female ? 'var(--lab-lilac)' : 'var(--lab-shirt)'} />
      <path d="m-20-96-12 33" stroke="var(--lab-skin)" strokeWidth="11" strokeLinecap="round" transform={`rotate(${-stride} -20 -96)`} />
      <path d={wave ? 'M20-96 39-80 49-103' : 'M20-96 30-63'} fill="none" stroke="var(--lab-skin)" strokeWidth="11" strokeLinecap="round" transform={`rotate(${wave ? 0 : stride} 20 -96)`} />
      <path d="M-5-116v15q5 7 12 0v-15" fill="var(--lab-skin)" />
      {female && <ellipse cx="-18" cy="-132" rx="15" ry="22" fill="var(--lab-hair)" />}
      <rect x="-19" y="-155" width="40" height="44" rx="19" fill="var(--lab-skin)" />
      <path d="M-20-134q-9-30 17-30 28 0 26 23-17-2-29-13-1 18-14 20Z" fill="var(--lab-hair)" />
      <circle cx="7" cy="-134" r="2" fill="var(--lab-hair)" /><path d="m14-132 3 6h-5m-10 7q5 3 10-1" fill="none" stroke="var(--lab-skin-dark)" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  </g>;
}

export function Kitchen({ moment, progress, reduced }: { moment: number; progress: number; reduced: boolean }): JSX.Element {
  const phase = reduced ? .5 : progress;
  const stir = Math.sin(phase * Math.PI * 30) * 8;
  return <svg viewBox="0 0 720 420" role="img" aria-label={['A finished meal on the kitchen counter. The cooking is over.', 'A woman stirring a steaming pot. She is cooking now.', 'A woman with fresh ingredients. She has not started cooking yet.'][moment]}>
    <rect width="720" height="420" fill="var(--lab-kitchen-wall)" /><path d="M0 338H720V420H0Z" fill="var(--lab-floor)" />
    <path d="M0 338H720M0 382H720M70 420l55-82m150 82 17-82m153 82-20-82m170 82-56-82" stroke="var(--lab-edge)" opacity=".5" />
    <path d="M90 257V144a75 75 0 0 1 150 0v113Z" fill="var(--lab-white)" />
    <path d="M101 244V144a64 64 0 0 1 128 0v100Z" fill="var(--lab-sky)" />
    <circle cx={moment === 0 ? 138 : moment === 1 ? 185 : 158} cy="128" r="21" fill="var(--lab-sun)" />
    <path d="M102 232q25-57 65-11 34-60 63 0v23H102Z" fill="var(--lab-leaf-light)" /><path d="M164 78v167m-63-70h128" stroke="var(--lab-white)" strokeWidth="7" />
    <path d="M83 257h165v8H83Z" fill="var(--lab-wood)" />
    <g fill="var(--lab-wood)"><rect x="464" y="138" width="171" height="9" rx="3" /><rect x="488" y="78" width="143" height="8" rx="3" /></g>
    <g fill="var(--lab-pot)"><rect x="478" y="101" width="25" height="36" rx="6" /><rect x="513" y="105" width="19" height="32" rx="5" /><rect x="508" y="55" width="30" height="22" rx="4" /></g>
    <g fill="var(--lab-green)"><path d="m570 138-7-30h33l-7 30Z" /><path d="M579 110q-21-27-14-35 17-2 14 35m2 0q-2-39 16-39 10 16-16 39" /></g>
    <path d="M359 0v44" stroke="var(--lab-hair)" strokeWidth="2" /><path d="M330 70q2-33 29-33 27 0 29 33Z" fill="var(--lab-green)" /><ellipse cx="359" cy="70" rx="29" ry="4" fill="var(--lab-sun)" />
    <ellipse cx="412" cy="379" rx="201" ry="14" fill="var(--lab-shadow)" />
    <g className={styles.chef}>
      <ellipse cx="326" cy="162" rx="34" ry="39" fill="var(--lab-hair)" /><circle cx="301" cy="135" r="19" fill="var(--lab-hair)" />
      <path d="M320 190v22h22v-25" fill="var(--lab-skin)" /><path d="M312 204q20 11 38-1 25 11 27 80h-82q-2-64 17-79Z" fill="var(--lab-lilac)" />
      <rect x="311" y="141" width="45" height="53" rx="21" fill="var(--lab-skin)" /><path d="M307 162q-10-36 19-35 29 1 29 20-28 0-31-8-4 19-17 23Z" fill="var(--lab-hair)" />
      <circle cx="341" cy="163" r="2.3" fill="var(--lab-hair)" /><path d="m347 165 3 6h-7m-7 9q7 4 13-1" fill="none" stroke="var(--lab-skin-dark)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m318 210-1 29-9 49h58l-10-49-9-30" fill="var(--lab-sun)" /><path d="M324 247h21v21h-21Z" fill="var(--lab-pot)" opacity=".65" />
      <path d="m307 220-16 38 23 12" fill="none" stroke="var(--lab-skin)" strokeWidth="13" strokeLinecap="round" />
      <path d={moment === 1 ? `M359 219 382 251 ${414 + stir} 241` : 'M358 220 380 262 395 267'} fill="none" stroke="var(--lab-skin)" strokeWidth="13" strokeLinecap="round" />
    </g>
    <rect x="242" y="291" width="335" height="85" rx="3" fill="var(--lab-green)" /><path d="M255 305h93v57h-93Zm110 0h93v57h-93Zm110 0h87v57h-87Z" fill="none" stroke="var(--lab-green-dark)" opacity=".55" /><path d="M242 371h335v9H242Z" fill="var(--lab-green-dark)" />
    <rect x="228" y="279" width="361" height="14" rx="4" fill="var(--lab-wood)" /><path d="M232 280h353" stroke="var(--lab-wood-light)" strokeWidth="3" />
    {moment === 1 ? <g>
      <ellipse cx="440" cy="275" rx="44" ry="6" fill="var(--lab-hair)" /><path d="M411 250h59v16q0 13-29 13t-30-13Z" fill="var(--lab-pot)" /><ellipse cx="440" cy="250" rx="29" ry="7" fill="var(--lab-pot-dark)" /><ellipse cx="440" cy="250" rx="24" ry="4" fill="var(--lab-sun)" />
      <path d="m408 257-12-2v9h15m61-7 12-2v9h-14" fill="none" stroke="var(--lab-pot-dark)" strokeWidth="4" />
      <path d={`M${414 + stir} 229 ${432 + stir / 2} 255`} stroke="var(--lab-wood-dark)" strokeWidth="5" strokeLinecap="round" />
      {[0, 1, 2].map((n) => { const rise = ((phase * 6 + n / 3) % 1); return <path key={n} d={`M${425 + n * 14} ${240 - rise * 45}q-10-10 0-19t0-18`} fill="none" stroke="var(--lab-steam)" strokeWidth="3" strokeLinecap="round" opacity={1 - rise} />; })}
    </g> : moment === 0 ? <g className={styles.sceneReveal}>
      <ellipse cx="450" cy="274" rx="56" ry="8" fill="var(--lab-white)" /><path d="M411 267q37-49 77 0Z" fill="var(--lab-rice)" />
      <g fill="var(--lab-green)"><circle cx="426" cy="261" r="4" /><circle cx="464" cy="256" r="4" /><circle cx="451" cy="265" r="3" /></g><g fill="var(--lab-ball)"><circle cx="440" cy="252" r="4" /><circle cx="473" cy="266" r="4" /></g>
      <circle cx="512" cy="227" r="15" fill="var(--lab-green)" /><path d="m505 227 5 5 9-10" fill="none" stroke="var(--lab-white)" strokeWidth="2.5" />
    </g> : <g className={styles.sceneReveal}>
      <rect x="410" y="272" width="114" height="7" rx="4" fill="var(--lab-wood-dark)" />
      <path d="m416 258 36 6-34 9Z" fill="var(--lab-ball)" /><path d="m447 264 12-14m-12 14 17-3" stroke="var(--lab-green)" strokeWidth="3" /><circle cx="482" cy="263" r="12" fill="var(--lab-pot)" /><path d="m479 250 4 5 6-6" stroke="var(--lab-green)" strokeWidth="3" fill="none" />
      <path d="M537 249h27v24h-27Z" fill="var(--lab-white)" /><path d="M542 249v-8h16v8" fill="var(--lab-wood)" />
    </g>}
    <g transform="translate(108 314)"><path d="M0 0h74v55H0Z" fill="var(--lab-white)" /><path d="M0 0h74v13H0Z" fill="var(--lab-pot)" /><text x="37" y="40" textAnchor="middle" fill="var(--lab-hair)" fontSize="17" fontWeight="700">{['YEST.', 'NOW', 'TMRW.'][moment]}</text></g>
  </svg>;
}

export function StoryScene({ kind, side, progress, reduced }: { kind: 'stop' | 'read' | 'jump'; side: number; progress: number; reduced: boolean }): JSX.Element {
  const p = reduced ? (progress < .5 ? 0 : 1) : progress;
  const walking = p < .53;
  const x = 67 + Math.min(p / .53, 1) * 94;
  const stride = walking ? Math.sin(p * 42) * 24 : 0;
  const jump = side === 1 ? Math.sin(Math.min(1, Math.max(0, (p - .22) / .78)) * Math.PI / 2) * 68 : 0;
  const bookClosed = side === 1 && p >= .58;
  return <svg viewBox="0 0 340 280" role="img" aria-label={kind === 'stop' ? (side === 0 ? 'A man walks and then stops walking.' : 'A man stops walking to talk to his friend.') : kind === 'read' ? (side === 0 ? 'A woman is reading an open book.' : 'A woman finishes reading and closes her book.') : (side === 0 ? 'A man prepares to jump, with his feet on the ground.' : 'A man jumps into the air.')}>
    <rect width="340" height="280" fill={side === 0 ? 'var(--lab-wall)' : 'var(--lab-blue-wall)'} />
    <circle cx="270" cy="55" r="23" fill="var(--lab-sun)" opacity=".65" />
    <path d="M0 170q52-61 103-14 38-27 91 9 75-72 146-6v63H0Z" fill="var(--lab-leaf-light)" opacity=".6" />
    <path d="M0 218H340v62H0Z" fill="var(--lab-floor)" /><path d="M0 218H340" stroke="var(--lab-edge)" />
    <path d="M28 109v110m0-37-15-18m15 3 18-22" stroke="var(--lab-wood-dark)" strokeWidth="5" /><ellipse cx="27" cy="104" rx="26" ry="47" fill="var(--lab-green)" opacity=".8" />
    <path d="M0 252H340" stroke="var(--lab-white)" strokeWidth="2" strokeDasharray="14 12" />
    {kind === 'stop' ? <>
      <ellipse cx={x} cy="240" rx="28" ry="6" fill="var(--lab-shadow)" /><Person x={x} y={234} scale={.85} stride={stride} wave={side === 1 && !walking} />
      {side === 1 && <><ellipse cx="267" cy="240" rx="27" ry="6" fill="var(--lab-shadow)" /><g transform="translate(534 0) scale(-1 1)"><Person x={267} y={234} scale={.85} female wave={!walking} /></g></>}
      {p >= .55 && <g className={styles.sceneReveal}>
        <path d={side === 0 ? 'M119 47h89v37h-32l-11 10V84h-46Z' : 'M172 40h73v39h-27l-12 11V79h-34Z'} fill="var(--lab-white)" />
        <text x={side === 0 ? 164 : 208} y={side === 0 ? 71 : 65} textAnchor="middle" fontSize="13" fontWeight="650" fill="var(--lab-hair)">{side === 0 ? 'And… stop.' : 'Hello!'}</text>
        {side === 1 && <g opacity={p > .7 ? 1 : 0}><path d="M262 69h62v32h-16l-10 9v-9h-36Z" fill="var(--lab-blue)" /><text x="293" y="90" textAnchor="middle" fill="var(--lab-white)" fontSize="13">Hi!</text></g>}
      </g>}
    </> : kind === 'read' ? <>
      <path d="M106 194h130v14H106Zm12 14v30m107-30v30" fill="var(--lab-wood)" stroke="var(--lab-wood-dark)" strokeWidth="5" />
      <Person x={171} y={235} female scale={.84} />
      <path d="m143 171 17 12m39-12-20 12" fill="none" stroke="var(--lab-skin)" strokeWidth="9" strokeLinecap="round" />
      {bookClosed ? <g><path d="m148 173 41 4-2 30-41-4Z" fill="var(--lab-blue)" /><path d="m151 176 33 4-1 23-33-4Z" fill="var(--lab-white)" /><path d="m146 173 5 3-1 23-4 4Z" fill="var(--lab-blue)" /></g> : <g style={{ transform: `translateY(${Math.sin(p * 18) * 1.5}px)` } as CSSProperties}><path d="m137 170 32 9 32-9v32l-32 10-32-10Z" fill="var(--lab-blue)" /><path d="m141 168 28 8 28-8v29l-28 9-28-9Z" fill="var(--lab-white)" /><path d="M169 177v29m-23-27 17 5m-17 3 17 5m12-8 17-5m-17 13 17-5" stroke="var(--lab-edge)" /></g>}
      <g transform="translate(244 75)"><circle r="22" fill="var(--lab-white)" />{bookClosed ? <path d="m-10 0 7 7L12-8" stroke="var(--lab-green)" strokeWidth="3" fill="none" /> : <><circle r="12" fill="none" stroke="var(--lab-blue)" strokeWidth="2" /><path d="M0-8v8l5 4" stroke="var(--lab-blue)" strokeWidth="2" fill="none" /></>}</g>
    </> : <>
      <ellipse cx="169" cy="241" rx={32 - jump / 5} ry="6" fill="var(--lab-shadow)" opacity={1 - jump / 100} />
      <Person x={169} y={234 - jump} scale={.88} wave={side === 1 && jump > 5} crouch={side === 0 ? 5 * Math.sin(p * Math.PI) : 0} />
      {side === 1 && jump > 10 && <path d={`M130 236v-${jump * .4}m80 0v-${jump * .4}`} stroke="var(--lab-blue)" strokeWidth="2" strokeDasharray="4 5" opacity=".6" />}
      <path d="M128 242h84" stroke="var(--lab-green)" strokeWidth="3" strokeLinecap="round" />
      {side === 0 && <g><path d="M205 56h98v38h-78l-10 10V94h-10Z" fill="var(--lab-white)" /><text x="254" y="80" fill="var(--lab-hair)" textAnchor="middle" fontSize="12">Ready to jump…</text></g>}
    </>}
  </svg>;
}
