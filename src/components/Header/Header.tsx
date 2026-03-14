import { Link } from 'react-router-dom';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>📄</span>
          <span className={styles.logoText}>Love</span>
          <span className={styles.logoAccent}>PDF</span>
        </Link>
        <nav className={styles.nav}>
          <div className={styles.privacyChip}>
            <span className={styles.privacyDot} />
            100% Private — Files never leave your device
          </div>
        </nav>
      </div>
    </header>
  );
}
