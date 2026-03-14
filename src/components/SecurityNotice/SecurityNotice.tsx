import styles from './SecurityNotice.module.css';

export function SecurityNotice() {
  return (
    <div className={styles.notice}>
      <span>🔒</span>
      <span>Files are processed locally in your browser and never uploaded.</span>
    </div>
  );
}

export function NoAccountBadge() {
  return (
    <div className={styles.noAccountBadge}>
      No account required
    </div>
  );
}
