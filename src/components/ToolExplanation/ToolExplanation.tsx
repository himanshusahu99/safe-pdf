import { useState } from 'react';
import styles from './ToolExplanation.module.css';

interface ToolExplanationProps {
  title: string;
  children: React.ReactNode;
}

export default function ToolExplanation({ title, children }: ToolExplanationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <span className={`${styles.toggleIcon} ${isOpen ? styles.toggleIconOpen : ''}`}>▶</span>
        What is {title}?
      </div>
      {isOpen && (
        <div className={styles.content}>
          <div className={styles.text}>{children}</div>
        </div>
      )}
    </div>
  );
}
