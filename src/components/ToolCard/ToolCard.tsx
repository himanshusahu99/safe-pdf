import { Link } from 'react-router-dom';
import type { ToolConfig } from '../../types';
import styles from './ToolCard.module.css';

interface ToolCardProps {
  tool: ToolConfig;
}

export default function ToolCard({ tool }: ToolCardProps) {
  return (
    <Link
      to={tool.route}
      className={styles.card}
      style={{ '--tool-color': tool.color } as React.CSSProperties}
    >
      <div className={styles.iconWrapper}>
        {tool.icon}
      </div>
      <h3 className={styles.name}>{tool.name}</h3>
      <p className={styles.description}>{tool.description}</p>
      <span className={styles.arrow}>→</span>
    </Link>
  );
}
