import { Link } from 'react-router-dom';
import styles from './NotFound.module.css';

export default function NotFound() {
  return (
    <div className={styles.notFound}>
      <span className={styles.code}>404</span>
      <p className={styles.message}>Page not found</p>
      <Link to="/" className={styles.link}>
        ← Back to Dashboard
      </Link>
    </div>
  );
}
