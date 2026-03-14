import styles from './FaqSection.module.css';

const FAQS = [
  {
    question: "Do you store my PDF files?",
    answer: "No. All PDF processing happens entirely within your web browser using WebAssembly. Your files are never uploaded to any external server."
  },
  {
    question: "Is this tool completely free?",
    answer: "Yes, this tool is 100% free with no hidden fees, subscriptions, or watermarks added to your documents."
  },
  {
    question: "Can I use this on my mobile device?",
    answer: "Absolutely! The browser-based processing works on modern mobile devices, allowing you to manipulate PDFs on the go."
  },
  {
    question: "Is there a file size limit?",
    answer: "Because processing happens locally on your device, the file size limit is determined only by your device's available memory."
  }
];

export default function FaqSection() {
  return (
    <section className={styles.faqSection}>
      <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
      <div className={styles.faqGrid}>
        {FAQS.map((faq, idx) => (
          <div key={idx} className={styles.faqCard}>
            <h3 className={styles.faqQuestion}>{faq.question}</h3>
            <p className={styles.faqAnswer}>{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
