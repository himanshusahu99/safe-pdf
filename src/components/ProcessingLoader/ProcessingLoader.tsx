import styles from './ProcessingLoader.module.css';

interface ProcessingLoaderProps {
  message?: string;
  progress?: number;
}

export default function ProcessingLoader({ message = 'Processing...', progress }: ProcessingLoaderProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.spinner} />
        <p className={styles.message}>{message}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px', color: 'var(--color-success)', fontSize: '12px', fontWeight: 500 }}>
          <span>🔒</span>
          <span>Processing securely in your browser</span>
        </div>
        {progress !== undefined && progress >= 0 && (
          <>
            <div className={styles.progressBarOuter}>
              <div
                className={styles.progressBarInner}
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <span className={styles.percentage}>{Math.round(progress)}%</span>
          </>
        )}
      </div>
    </div>
  );
}
