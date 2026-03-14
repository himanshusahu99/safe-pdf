import styles from './HowItWorks.module.css';

export default function HowItWorks() {
  const steps = [
    {
      icon: '📂',
      title: 'Step 1 — Upload',
      desc: 'Select and drop your PDF file.'
    },
    {
      icon: '⚙️',
      title: 'Step 2 — Process',
      desc: 'Everything happens locally in your browser.'
    },
    {
      icon: '⬇️',
      title: 'Step 3 — Download',
      desc: 'Get your processed file instantly.'
    }
  ];

  return (
    <div className={styles.container}>
      {steps.map((step, idx) => (
        <div key={idx} className={styles.step}>
          <div className={styles.iconWrapper}>{step.icon}</div>
          <h4 className={styles.title}>{step.title}</h4>
          <p className={styles.desc}>{step.desc}</p>
        </div>
      ))}
    </div>
  );
}
