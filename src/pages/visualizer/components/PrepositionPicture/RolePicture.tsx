import type { JSX } from 'react';
import { ArrowHead, Floor, Label, Person } from './art';

export type OtherPreposition = 'about' | 'for' | 'with' | 'as' | 'like' | 'per';

function Gift(): JSX.Element {
  return <g>
    <rect x="-49" y="-80" width="98" height="80" rx="7" fill="var(--prop-card-light)" />
    <rect x="-56" y="-88" width="112" height="23" rx="6" fill="var(--prop-gold)" />
    <path d="M-7-87 V0 H8 V-87Z" fill="var(--accent)" />
    <path d="M0-89 C-65-125-50-64 0-89 C65-125 50-64 0-89Z" fill="none" stroke="var(--accent)" strokeWidth="7" />
  </g>;
}

function Notes({ x, y }: { readonly x: number; readonly y: number }): JSX.Element {
  return <g transform={`translate(${x} ${y})`} fill="var(--accent)">
    <path d="M0 12 V-26 L28-32 V6 H23 V-19 L5-15 V12Z" />
    <ellipse cx="-3" cy="12" rx="8" ry="6" /><ellipse cx="20" cy="6" rx="8" ry="6" />
  </g>;
}

export function RolePicture({ word }: { readonly word: OtherPreposition }): JSX.Element {
  switch (word) {
    case 'about': return <>
      <Floor />
      <g transform="translate(151 256) rotate(-8)">
        <rect x="-66" y="-161" width="134" height="171" rx="9" fill="var(--prop-card-light)" />
        <rect x="-69" y="-167" width="134" height="171" rx="9" fill="var(--accent)" />
        <path d="M-53-163 V0" stroke="var(--prop-paper)" strokeWidth="2" opacity=".4" />
        <text x="7" y="-102" textAnchor="middle" fontSize="19" letterSpacing="1" fill="var(--accent-ink)">HISTORY</text>
        <path d="M-20-62 L7-80 L34-62 M-17-53 H31 M-13-51 V-26 M7-51 V-26 M27-51 V-26 M-20-20 H34" fill="none" stroke="var(--prop-card-light)" strokeWidth="4" strokeLinecap="round" />
      </g>
      <path d="M236 176 Q281 130 317 150" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="5 7" />
      <rect x="323" y="80" width="221" height="170" rx="24" fill="var(--accent-soft)" />
      <Label x={433} y={118} small>What the book is about</Label>
      <path d="M378 157 L432 129 L487 157 M383 164 H481 M392 170 V210 M417 170 V210 M447 170 V210 M473 170 V210 M381 218 H484" fill="none" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" />
      <Label x={154} y={326}>Book</Label><Label x={433} y={288} accent>History</Label>
    </>;
    case 'for': return <>
      <Floor />
      <g transform="translate(155 267)"><Gift /></g>
      <circle cx="446" cy="219" r="82" fill="var(--accent-soft)" />
      <Person x={446} y={277} />
      <path d="M230 218 H351" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" /><ArrowHead x={351} y={218} />
      <Label x={291} y={192} small>Intended for</Label>
      <Label x={155} y={326}>Gift</Label><Label x={446} y={326} accent>You</Label>
    </>;
    case 'with': return <>
      <Floor />
      <rect x="145" y="86" width="310" height="209" rx="100" fill="var(--accent-soft)" />
      <Person x={234} y={277} /><Person x={366} y={277} colour="var(--prop-cloth)" />
      <path d="M257 223 Q300 244 343 223" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="4 6" />
      <Label x={300} y={115} accent>Together</Label>
      <Label x={233} y={326}>I</Label><Label x={373} y={326}>My friend</Label>
    </>;
    case 'as': return <>
      <Floor />
      <Person x={161} y={277} />
      <path d="M213 192 H291" stroke="var(--accent)" strokeWidth="3" strokeDasharray="5 7" />
      <rect x="310" y="80" width="212" height="196" rx="18" fill="var(--surface)" stroke="var(--line)" strokeWidth="2" />
      <rect x="375" y="70" width="82" height="19" rx="8" fill="var(--prop-card-light)" />
      <circle cx="416" cy="155" r="37" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="5" />
      <circle cx="416" cy="155" r="8" fill="var(--accent)" />
      <path d="M383 143 L410 153 M449 143 L422 153 M416 163 V189" stroke="var(--accent)" strokeWidth="5" />
      <Label x={416} y={228} accent>DRIVER</Label><Label x={416} y={253} small>His role / job</Label>
      <Label x={300} y={330}>He works in the role of a driver</Label>
    </>;
    case 'like': return <>
      <Floor />
      <Person x={151} y={277} woman />
      <Notes x={191} y={133} />
      <g transform="translate(444 217)">
        <path d="M-35 3 Q-58-38-26-45 Q-9-72 18-49 Q45-48 42-18 Q36 18 1 21 L-41 27Z" fill="var(--prop-cloth)" />
        <path d="M-24-7 Q-5-33 13-7 Q0 13-24-7Z" fill="var(--prop-glass)" />
        <path d="M40-35 L58-28 L39-21Z" fill="var(--prop-gold)" /><circle cx="25" cy="-39" r="3" fill="var(--prop-paper)" />
        <path d="M0 19 V41 M15 18 V41" stroke="var(--prop-bark)" strokeWidth="3" />
      </g>
      <Notes x={490} y={131} />
      <text x="300" y="211" textAnchor="middle" fontSize="57" fill="var(--accent)">≈</text>
      <Label x={151} y={326}>She sings</Label><Label x={451} y={326}>A bird sings</Label>
      <Label x={300} y={85} small>Similar sound · not the same thing</Label>
    </>;
    case 'per': return <>
      <Label x={184} y={54} small>QUANTITY</Label><Label x={421} y={54} small>PRICE</Label>
      {[1, 2, 3].map((count, i) => <g key={count}>
        <rect x="89" y={76 + i * 78} width="422" height="64" rx="15" fill={i === 0 ? 'var(--accent-soft)' : 'var(--surface)'} stroke="var(--line)" />
        <path d={`M116 ${94 + i * 78} h26 l6 32 h-38Z`} fill="var(--prop-card-light)" />
        <path d={`M124 ${93 + i * 78} v-5 h10 v5`} fill="none" stroke="var(--prop-card-edge)" strokeWidth="2" />
        <Label x={199} y={116 + i * 78}>{count} kg</Label>
        <path d={`M278 ${108 + i * 78} H326`} stroke="var(--accent)" strokeWidth="2" /><ArrowHead x={329} y={108 + i * 78} />
        <Label x={420} y={116 + i * 78} accent>${count * 10}</Label>
      </g>)}
      <Label x={300} y={345}>$10 for every 1 kg</Label>
    </>;
  }
}
