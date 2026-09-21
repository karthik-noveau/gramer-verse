import type { JSX, ReactNode } from 'react';

import { nodeToSvg } from 'common/components/Stage/toSvg';
import { propFor } from 'common/scene/props';

import styles from './styles.module.css';

export function Label({ x, y, children, small = false, accent = false }: {
  readonly x: number; readonly y: number; readonly children: ReactNode;
  readonly small?: boolean; readonly accent?: boolean;
}): JSX.Element {
  return <text x={x} y={y} textAnchor="middle" className={small ? styles.smallLabel : styles.label}
    fill={accent ? 'var(--accent)' : 'var(--ink)'}>{children}</text>;
}

export function Floor({ y = 282 }: { readonly y?: number }): JSX.Element {
  return <>
    <ellipse cx="300" cy={y + 8} rx="240" ry="18" fill="var(--accent-soft)" opacity=".38" />
    <path d={`M40 ${y} H560`} stroke="var(--line)" strokeWidth="2" strokeLinecap="round" />
  </>;
}

export function Person({ x = 0, y = 0, colour = 'var(--accent)', woman = false }: {
  readonly x?: number; readonly y?: number; readonly colour?: string; readonly woman?: boolean;
}): JSX.Element {
  return <g transform={`translate(${x} ${y})`}>
    <ellipse cy="3" rx="27" ry="5" fill="var(--shadow-ink)" />
    {woman && <path d="M-20-99 Q0-131 20-99 L24-67 H-24Z" fill="var(--prop-bark)" />}
    <path d="M-9-35 L-12-2 M9-35 L14-2" stroke="var(--prop-cloth)" strokeWidth="12" strokeLinecap="round" />
    <path d="M-19-72 L-28-40 M19-72 L29-42" stroke="var(--prop-skin)" strokeWidth="10" strokeLinecap="round" />
    <rect x="-20" y="-82" width="40" height="54" rx="15" fill={colour} />
    <path d="M-12-68 V-42" stroke="var(--prop-paper)" strokeWidth="3" opacity=".25" strokeLinecap="round" />
    <circle cy="-103" r="18" fill="var(--prop-skin)" />
    <path d="M-17-108 Q-16-127 4-122 Q19-120 18-103 Q9-110 2-115 Q-3-105-17-108Z" fill="var(--prop-bark)" />
    <circle cx="7" cy="-102" r="1.8" fill="var(--prop-detail)" />
    <path d="M5-94 Q10-91 13-95" fill="none" stroke="var(--prop-bark)" strokeWidth="1.5" strokeLinecap="round" />
  </g>;
}

export function PropArt({ name, x, y, scale = 1 }: {
  readonly name: string; readonly x: number; readonly y: number; readonly scale?: number;
}): JSX.Element | null {
  const prop = propFor(name);
  if (!prop) return null;
  return <g transform={`translate(${x - prop.box.w * scale / 2} ${y - prop.box.h * scale}) scale(${scale})`}>
    {prop.draw().map((node) => nodeToSvg(node))}
  </g>;
}

export function Building({ x, y, name }: { readonly x: number; readonly y: number; readonly name: string }): JSX.Element {
  return <g transform={`translate(${x} ${y})`}>
    <ellipse cy="5" rx="95" ry="8" fill="var(--shadow-ink)" />
    <rect x="-84" y="-159" width="168" height="159" rx="9" fill="var(--prop-card-light)" />
    <path d="M67-159 H84 V-9 Q84 0 75 0 H67Z" fill="var(--prop-card)" />
    <rect x="-92" y="-167" width="184" height="15" rx="6" fill="var(--accent)" />
    <rect x="-66" y="-136" width="132" height="34" rx="7" fill="var(--prop-paper)" />
    <text y="-112" textAnchor="middle" fontSize="21" fontWeight="650" fill="var(--prop-detail)">{name}</text>
    {[-53, 53].map((cx) => <g key={cx}>
      <rect x={cx - 16} y="-81" width="32" height="45" rx="5" fill="var(--prop-glass)" />
      <path d={`M${cx}-79 V-38 M${cx - 14}-59 H${cx + 14}`} stroke="var(--prop-paper)" strokeWidth="3" />
    </g>)}
    <path d="M-22 0 V-61 Q-22-83 0-83 Q22-83 22-61 V0Z" fill="var(--prop-bark)" />
    <circle cx="12" cy="-36" r="3" fill="var(--prop-gold)" />
    <rect x="-29" y="-5" width="58" height="7" rx="3" fill="var(--prop-card-2)" />
  </g>;
}

export function Tree({ x, y, scale = 1 }: { readonly x: number; readonly y: number; readonly scale?: number }): JSX.Element {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M0 0 V-80 M0-42 L-18-59 M0-57 L17-75" stroke="var(--prop-bark)" strokeWidth="8" strokeLinecap="round" />
    <path d="M-37-60 C-65-84-38-110-19-105 C-15-141 31-139 35-105 C64-102 68-58 37-51 Q6-33-37-60Z" fill="var(--prop-leaf)" />
    <path d="M-30-87 Q-23-111-5-111" stroke="var(--prop-paper)" strokeWidth="6" opacity=".3" fill="none" strokeLinecap="round" />
  </g>;
}

export function Car(): JSX.Element {
  return <g>
    <ellipse cy="4" rx="61" ry="7" fill="var(--shadow-ink)" />
    <path d="M-48-39 L-30-68 Q-25-75-15-75 H24 Q32-75 38-65 L54-39Z" fill="var(--accent)" />
    <path d="M-29-44 L-17-66 H7 V-44Z M13-66 H22 L38-44Z" fill="var(--prop-glass)" />
    <rect x="-65" y="-43" width="130" height="35" rx="12" fill="var(--accent)" />
    <path d="M-48-38 H44" stroke="var(--prop-paper)" strokeWidth="3" opacity=".4" />
    <rect x="52" y="-32" width="13" height="9" rx="3" fill="var(--prop-gold)" />
    {[-39, 39].map((x) => <g key={x}><circle cx={x} cy="-9" r="15" fill="var(--prop-detail)" /><circle cx={x} cy="-9" r="7" fill="var(--prop-metal)" /></g>)}
  </g>;
}

export function Plane(): JSX.Element {
  return <g>
    <path d="M-64 2 L-43-5 L-49-31 L-37-31 L-17-9 L10-9 L-4-46 L10-46 L39-8 L67-5 Q82-2 67 5 L39 8 L10 43 L-4 43 L10 9 L-17 9 L-37 28 L-49 28 L-43 5Z" fill="var(--prop-paper)" stroke="var(--prop-metal)" strokeWidth="2" strokeLinejoin="round" />
    <path d="M-33 0 H58" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
    <path d="M58-5 L67-3" stroke="var(--prop-cloth)" strokeWidth="4" strokeLinecap="round" />
  </g>;
}

/** One finite journey. Reduced motion shows the meaningful end state. */
export function Journey({ path, end, reduced, children }: {
  readonly path: string; readonly end: readonly [number, number];
  readonly reduced: boolean; readonly children: ReactNode;
}): JSX.Element {
  return <g transform={reduced ? `translate(${end[0]} ${end[1]})` : undefined} data-journey="true">
    {!reduced && <animateMotion dur="2.8s" path={path} fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".35 0 .2 1" />}
    {children}
  </g>;
}

export function Route({ d, dashed = false }: { readonly d: string; readonly dashed?: boolean }): JSX.Element {
  return <path d={d} fill="none" stroke="var(--accent)" strokeWidth="4" strokeDasharray={dashed ? '6 9' : undefined} strokeLinecap="round" opacity=".55" />;
}

export function ArrowHead({ x, y, left = false }: { readonly x: number; readonly y: number; readonly left?: boolean }): JSX.Element {
  return <path d="M-9-7 L0 0 L-9 7" transform={`translate(${x} ${y}) rotate(${left ? 180 : 0})`}
    fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />;
}
