import type { JSX } from 'react';
import type { TimeRelation } from 'common/scene/types';
import { ArrowHead, Label } from './art';

function Event({ x, y = 207, title, time, accent = false }: {
  readonly x: number; readonly y?: number; readonly title: string; readonly time?: string; readonly accent?: boolean;
}): JSX.Element {
  return <g>
    <path d={`M${x} ${y} V${y - 36}`} stroke={accent ? 'var(--accent)' : 'var(--line-strong)'} strokeWidth="2" />
    <circle cx={x} cy={y} r="12" fill={accent ? 'var(--accent)' : 'var(--surface)'} stroke="var(--accent)" strokeWidth="3" />
    <circle cx={x} cy={y} r="4" fill={accent ? 'var(--accent-ink)' : 'var(--accent)'} />
    <Label x={x} y={y - 55} accent={accent}>{title}</Label>
    {time && <Label x={x} y={y + 49} small>{time}</Label>}
  </g>;
}

function Axis(): JSX.Element {
  return <>
    <path d="M60 207 H541" stroke="var(--line-strong)" strokeWidth="3" strokeLinecap="round" />
    <ArrowHead x={545} y={207} />
  </>;
}

export function TimePicture({ word }: { readonly word: TimeRelation }): JSX.Element {
  if (word === 'in') return <>
    <rect x="102" y="43" width="396" height="264" rx="20" fill="var(--shadow-ink)" opacity=".4" />
    <rect x="102" y="36" width="396" height="264" rx="20" fill="var(--surface)" stroke="var(--line)" strokeWidth="2" />
    <path d="M122 36 H478 Q498 36 498 56 V99 H102 V56 Q102 36 122 36Z" fill="var(--accent)" />
    {[162, 438].map((x) => <path key={x} d={`M${x} 25 V53`} stroke="var(--prop-card-light)" strokeWidth="10" strokeLinecap="round" />)}
    <text x="300" y="80" textAnchor="middle" fill="var(--accent-ink)" fontSize="31" fontWeight="650">2000</text>
    {Array.from({ length: 12 }, (_, i) => <rect key={i} x={136 + i % 4 * 84} y={123 + Math.floor(i / 4) * 45} width="73" height="32" rx="7" fill="var(--accent-soft)" opacity=".65" />)}
    <rect x="227" y="157" width="146" height="56" rx="28" fill="var(--accent)" />
    <text x="300" y="193" textAnchor="middle" fill="var(--accent-ink)" fontSize="25" fontWeight="650">Born</text>
    <Label x={300} y={279} small>January — December</Label>
    <Label x={300} y={340}>An event within a year</Label>
  </>;

  if (word === 'on') return <>
    <rect x="50" y="53" width="500" height="242" rx="20" fill="var(--surface)" stroke="var(--line)" strokeWidth="2" />
    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => <g key={day}>
      <rect x={67 + i * 67} y="75" width="62" height="70" rx="11" fill={i === 0 ? 'var(--accent)' : 'var(--surface-sunk)'} />
      <text x={98 + i * 67} y="118" textAnchor="middle" fontSize="20" fontWeight="600" fill={i === 0 ? 'var(--accent-ink)' : 'var(--muted)'}>{day}</text>
    </g>)}
    <path d="M98 150 V210 Q98 225 117 225 H169" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="4 6" />
    <rect x="170" y="185" width="292" height="79" rx="15" fill="var(--accent-soft)" />
    <circle cx="201" cy="225" r="8" fill="var(--accent)" />
    <Label x={323} y={217}>Meeting</Label><Label x={323} y={245} small>Monday</Label>
    <Label x={300} y={337}>One specific day</Label>
  </>;

  if (word === 'at') return <>
    <circle cx="208" cy="171" r="117" fill="var(--shadow-ink)" opacity=".35" />
    <circle cx="208" cy="164" r="115" fill="var(--surface)" stroke="var(--line)" strokeWidth="3" />
    {Array.from({ length: 12 }, (_, i) => <path key={i} d="M208 64 V72" transform={`rotate(${i * 30} 208 164)`} stroke="var(--muted)" strokeWidth={i % 3 === 0 ? 4 : 2} strokeLinecap="round" />)}
    <path d="M208 164 V86 M208 164 L237 214" stroke="var(--accent)" strokeWidth="7" strokeLinecap="round" />
    <circle cx="208" cy="164" r="9" fill="var(--accent)" />
    <path d="M334 164 H368" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="5 5" />
    <rect x="372" y="107" width="158" height="115" rx="18" fill="var(--accent-soft)" />
    <Label x={451} y={151} small>Train arrives</Label>
    <text x="451" y="193" textAnchor="middle" fontSize="32" fontWeight="650" fill="var(--accent)">5 PM</text>
    <Label x={300} y={332}>An exact time</Label>
  </>;

  if (word === 'during') return <>
    <rect x="69" y="110" width="462" height="140" rx="20" fill="var(--accent-soft)" />
    <path d="M83 105 V260 M517 105 V260" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="5 6" />
    <Label x={300} y={89}>The movie</Label>
    <rect x="183" y="153" width="236" height="57" rx="28" fill="var(--accent)" />
    <text x="301" y="190" textAnchor="middle" fontSize="26" fontWeight="650" fill="var(--accent-ink)">Sleeping</text>
    <Label x={83} y={285} small>Starts</Label><Label x={517} y={285} small>Ends</Label>
    <Label x={300} y={337}>Happens within the movie’s duration</Label>
  </>;

  if (word === 'since' || word === 'until') {
    const since = word === 'since';
    return <>
      <Axis />
      <rect x="110" y="185" width="372" height="44" rx="22" fill="var(--accent-soft)" />
      <path d="M110 207 H482" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" />
      <circle cx="110" cy="207" r="9" fill="var(--accent)" />
      <path d="M482 128 V249" stroke="var(--accent)" strokeWidth="3" strokeDasharray={since ? '5 5' : undefined} />
      <circle cx="482" cy="207" r="11" fill="var(--accent)" />
      <Label x={296} y={159} accent>{since ? 'Living here' : 'Waiting'}</Label>
      <Label x={110} y={274}>{since ? '2010' : 'Start'}</Label>
      <Label x={482} y={274}>{since ? 'Now' : 'I arrive'}</Label>
      {!since && <path d="M474 120 H490" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />}
      <Label x={300} y={337}>{since ? 'From a starting point up to now' : 'Continues up to this point, then stops'}</Label>
    </>;
  }

  const before = word === 'before';
  const after = word === 'after';
  const boundaryX = after ? 185 : 477;
  return <>
    <Axis />
    <rect x={after ? 205 : 93} y="196" width={after ? 292 : 365} height="22" rx="11" fill="var(--accent-soft)" />
    <path d={`M${boundaryX} 95 V271`} stroke="var(--prop-card-2)" strokeWidth="3" strokeDasharray="5 5" />
    <Event x={after ? 420 : before ? 235 : 332} title={after ? 'Meet' : before ? 'Arrive' : 'Work finished'} accent />
    <Label x={boundaryX} y={83}>{after ? 'Lunch' : before ? '8 AM' : '6 PM'}</Label>
    <Label x={boundaryX} y={303} small>{after ? 'First' : before ? 'Reference time' : 'Deadline'}</Label>
    <Label x={300} y={346}>{after ? 'Later than lunch' : before ? 'Earlier than 8 AM' : 'Finish at or before the deadline'}</Label>
  </>;
}
