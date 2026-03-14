import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import styles from './ToolLayout.module.css';

interface ToolLayoutProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  error?: string | null;
  children: React.ReactNode;
}

export default function ToolLayout({ title, description, icon, color, error, children }: ToolLayoutProps) {
  return (
    <div className={styles.layout}>
      <Helmet>
        <title>{title} | Love-PDF</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${title} | Love-PDF`} />
        <meta property="og:description" content={description} />
      </Helmet>
      <div className={styles.topBar}>
        <Link to="/" className={styles.backButton}>←</Link>
        <div className={styles.titleGroup}>
          <div className={styles.icon} style={{ '--tool-color': color } as React.CSSProperties}>
            {icon}
          </div>
          <div>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.description}>{description}</p>
          </div>
        </div>
      </div>
      {error && (
        <div className={styles.errorBanner}>
          ⚠️ {error}
        </div>
      )}
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
