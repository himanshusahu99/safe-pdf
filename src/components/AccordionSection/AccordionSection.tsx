import { useState } from 'react';
import styles from './AccordionSection.module.css';

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  summaryText?: string;
}

export default function AccordionSection({
  title,
  children,
  defaultOpen = false,
  summaryText,
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.accordion}>
      <div className={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <div className={styles.titleWrapper}>
          <h4 className={styles.title}>{title}</h4>
          {summaryText && <span className={styles.summary}>({summaryText})</span>}
        </div>
        <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}>▼</span>
      </div>
      {isOpen && <div className={styles.content}>{children}</div>}
    </div>
  );
}
