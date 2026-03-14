import styles from './TrustBadge.module.css';

export default function TrustBadge() {
  const badges = [
    { icon: '🔒', text: '100% Private' },
    { icon: '⚡', text: 'Instant Browser Processing' },
    { icon: '🛡️', text: 'No File Uploads' },
    { icon: '👤', text: 'No Account Required' }
  ];

  return (
    <div className={styles.container}>
      {badges.map((badge, index) => (
        <div key={index} className={styles.badge}>
          <span className={styles.icon}>{badge.icon}</span>
          <span>{badge.text}</span>
        </div>
      ))}
    </div>
  );
}
