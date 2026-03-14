import { useState, useMemo, useEffect } from 'react';
import { toolRegistry, TOOL_CATEGORIES } from '../../config/toolRegistry';
import ToolCard from '../../components/ToolCard/ToolCard';
import type { ToolCategory } from '../../types';
import TrustBadge from '../../components/TrustBadge/TrustBadge';
import HowItWorks from '../../components/HowItWorks/HowItWorks';
import TrustSection from '../../components/TrustSection/TrustSection';
import FaqSection from '../../components/FaqSection/FaqSection';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return toolRegistry;
    const query = searchQuery.toLowerCase();
    return toolRegistry.filter(
      tool =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const categories = Object.entries(TOOL_CATEGORIES) as [ToolCategory, { label: string; description: string }][];

  // Restore scroll position when coming back to dashboard
  useEffect(() => {
    const savedPos = sessionStorage.getItem('dashboardScrollPos');
    if (savedPos) {
      // Need a small timeout to let the grid render first
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedPos, 10));
      }, 0);
    }

    // Save scroll position when unmounting
    return () => {
      sessionStorage.setItem('dashboardScrollPos', window.scrollY.toString());
    };
  }, []);

  return (
    <div className={styles.dashboard}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Secure PDF Tools Built for <span className={styles.heroGradient}>Privacy</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Process PDFs instantly in your browser. Your files never leave your device.
        </p>
        <TrustBadge />
      </section>

      <HowItWorks />

      {/* Search */}
      <div className={styles.searchWrapper}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tool Grid by Category */}
      {searchQuery.trim() ? (
        filteredTools.length > 0 ? (
          <div className={styles.toolGrid}>
            {filteredTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <div className={styles.noResults}>
            No tools found for "{searchQuery}"
          </div>
        )
      ) : (
        categories.map(([categoryKey, categoryInfo]) => {
          const categoryTools = filteredTools.filter(t => t.category === categoryKey);
          if (categoryTools.length === 0) return null;
          return (
            <section key={categoryKey} className={styles.categorySection}>
              <div className={styles.categoryHeader}>
                <h2 className={styles.categoryTitle}>{categoryInfo.label}</h2>
                <span className={styles.categoryDescription}>{categoryInfo.description}</span>
                <div className={styles.categoryDivider} />
              </div>
              <div className={styles.toolGrid}>
                {categoryTools.map(tool => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </section>
          );
        })
      )}

      <TrustSection />
      
      <FaqSection />
    </div>
  );
}
