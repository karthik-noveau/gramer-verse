import type { JSX } from 'react';
import type { PathRelation } from 'common/scene/types';
import { ArrowHead, Building, Car, Floor, Journey, Label, Person, Plane, PropArt, Route, Tree } from './art';

const SKYLINE = [90, 125, 105, 155, 110, 140, 80];

export function DirectionPicture({ word, reduced }: { readonly word: PathRelation; readonly reduced: boolean }): JSX.Element {
  if (word === 'over') return <>
    <Floor />
    {SKYLINE.map((height, i) => <g key={i}>
      <rect x={110 + i * 57} y={282 - height} width="44" height={height} rx="5" fill={i % 2 ? 'var(--prop-metal)' : 'var(--prop-grey)'} opacity=".7" />
      {Array.from({ length: Math.floor((height - 20) / 24) }, (_, row) =>
        <path key={row} d={`M${120 + i * 57} ${258 - row * 24} H${143 + i * 57}`} stroke="var(--prop-glass)" strokeWidth="9" />)}
    </g>)}
    <Route d="M70 105 Q300-5 530 105" dashed />
    <Journey path="M70 105 Q300-5 530 105" end={[530, 105]} reduced={reduced}><g transform="scale(.65)"><Plane /></g></Journey>
    <Label x={300} y={327}>City</Label>
  </>;

  if (word === 'across') return <>
    <rect x="44" y="124" width="512" height="112" rx="15" fill="var(--prop-metal)" opacity=".8" />
    <path d="M54 180 H546" stroke="var(--prop-paper)" strokeWidth="3" strokeDasharray="26 18" />
    {[0, 1, 2, 3, 4].map((i) => <rect key={i} x="265" y={133 + i * 20} width="70" height="10" rx="2" fill="var(--prop-paper)" />)}
    <Route d="M300 292 V88" dashed />
    <Journey path="M300 292 L300 104" end={[300, 104]} reduced={reduced}><g transform="scale(.7)"><Person /></g></Journey>
    <circle cx="300" cy="292" r="6" fill="var(--accent)" />
    <Label x={132} y={110} small>Other side</Label>
    <Label x={120} y={276} small>Start</Label>
    <Label x={465} y={184}>Road</Label>
    <Label x={300} y={335}>From one side to the other</Label>
  </>;

  if (word === 'along') return <>
    <path d="M40 261 Q182 205 321 254 T564 256" stroke="var(--accent-soft)" strokeWidth="98" fill="none" strokeLinecap="round" />
    <path d="M40 273 Q182 217 321 266 T564 268" stroke="var(--prop-glass)" strokeWidth="60" fill="none" strokeLinecap="round" />
    {[0, 1, 2].map((i) => <path key={i} d={`M${75 + i * 168} 272 q25-10 48 0`} stroke="var(--prop-cloth)" strokeWidth="2" opacity=".4" fill="none" />)}
    <Tree x={520} y={176} scale={.6} />
    <Route d="M95 194 Q235 142 435 201" dashed />
    <Journey path="M95 194 Q235 142 435 201" end={[435, 201]} reduced={reduced}>
      <g transform="scale(.65)"><Person x={-22} /><Person x={35} colour="var(--prop-cloth)" /></g>
    </Journey>
    <Label x={300} y={328}>Along the riverbank</Label>
  </>;

  if (word === 'into') return <>
    <Floor />
    <path d="M355 92 H535 V282 H355Z" fill="var(--accent-soft)" />
    <path d="M355 92 L326 119 V282 H355Z" fill="var(--prop-metal)" opacity=".45" />
    <path d="M355 257 H535 L556 282 H326Z" fill="var(--prop-card-light)" />
    <path d="M355 92 H535 V282 M355 92 V282" fill="none" stroke="var(--accent)" strokeWidth="4" />
    <rect x="404" y="121" width="80" height="60" rx="5" fill="var(--prop-glass)" stroke="var(--surface)" strokeWidth="5" />
    <path d="M444 124 V178 M407 151 H481" stroke="var(--surface)" strokeWidth="3" />
    <Route d="M85 267 H444" dashed />
    <Journey path="M85 270 L449 270" end={[449, 270]} reduced={reduced}><PropArt name="dog" x={0} y={0} scale={.8} /></Journey>
    <Label x={126} y={326}>Outside</Label><Label x={441} y={326} accent>Inside the room</Label>
  </>;

  if (word === 'past') return <>
    <Floor />
    <Tree x={304} y={234} scale={1.05} /><Tree x={390} y={234} scale={.75} />
    <rect x="235" y="213" width="108" height="34" rx="6" fill="var(--surface)" stroke="var(--line)" />
    <Label x={289} y={238} small>Park</Label>
    <path d="M44 273 H556" stroke="var(--prop-metal)" strokeWidth="26" opacity=".16" />
    <Route d="M74 287 H532" dashed /><ArrowHead x={542} y={287} />
    <Journey path="M74 279 L515 279" end={[515, 279]} reduced={reduced}><g transform="scale(.8)"><Car /></g></Journey>
    <Label x={300} y={333}>Continue beyond the park</Label>
  </>;

  const from = word === 'from';
  const towards = word === 'towards';
  const end = from ? 110 : towards ? 303 : 397;
  const start = from ? 398 : 92;
  return <>
    <Floor />
    <Building x={466} y={282} name={from ? 'Office' : towards ? 'Station' : 'School'} />
    <Route d={`M92 284 H${towards ? 311 : 395}`} dashed />
    {towards && <path d="M320 284 H373" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="3 8" />}
    <ArrowHead x={from ? 92 : towards ? 317 : 400} y={284} left={from} />
    <Journey path={`M${start} 277 L${end} 277`} end={[end, 277]} reduced={reduced}><g transform={`scale(${from ? -.82 : .82} .82)`}><Person /></g></Journey>
    <Label x={300} y={334}>{from ? 'Away from the starting point' : towards ? 'In that direction · not there yet' : 'The destination is reached'}</Label>
  </>;
}
