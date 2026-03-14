import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.privacyMessage}>
          <span className={styles.shieldIcon}>🛡️</span>
          All processing happens in your browser. Your files never leave your device.
        </div>
        <p className={styles.copyright}>
          © {new Date().getFullYear()} LovePDF — Privacy-first PDF tools. Built with ❤️
        </p>
      </div>
    </footer>
  );
}
