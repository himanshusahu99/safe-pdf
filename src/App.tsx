import { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { toolRegistry } from './config/toolRegistry';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Dashboard from './pages/Dashboard/Dashboard';
import NotFound from './pages/NotFound/NotFound';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import styles from './App.module.css';

import { HelmetProvider } from 'react-helmet-async';

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className={styles.app}>
          <Header />
          <Suspense fallback={<div className={styles.loadingFallback}>Loading tool...</div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              {toolRegistry.map(tool => (
                <Route key={tool.id} path={tool.route} element={<tool.component />} />
              ))}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Footer />
        </div>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
