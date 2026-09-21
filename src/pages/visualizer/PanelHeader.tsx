import type { JSX, ReactNode } from 'react';
import styles from './styles.module.css';

export function PanelHeader({ children, navigation }: { children: ReactNode; navigation?: ReactNode }): JSX.Element {
  return <header className={styles.panelHeader}>
    <div className={styles.stageHeading}>{children}</div>
    <div className={styles.panelModes}>{navigation}</div>
  </header>;
}
