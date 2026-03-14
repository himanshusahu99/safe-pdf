import styles from './TrustSection.module.css';

export default function TrustSection() {
  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3 className={styles.title}><span>🛡️</span> Privacy Transparency</h3>
        <p className={styles.text}>
          Your documents never leave your device. All PDF processing runs locally in your browser using secure technologies. We do not upload, store, or analyze your files.
        </p>
      </div>

      <div className={styles.section}>
        <h3 className={styles.title}><span>💻</span> Technology Transparency</h3>
        <p className={styles.text}>
          Built with modern browser technologies like WebAssembly (Wasm) and the Canvas API. All file operations happen locally in your browser for maximum privacy and unparalleled speed.
        </p>
      </div>
    </div>
  );
}
