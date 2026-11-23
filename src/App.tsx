import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { Layout } from './components/Layout.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { DirectoryPage } from './pages/DirectoryPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ManageAccessPage } from './pages/ManageAccessPage.tsx';
import { ManageProjectPage } from './pages/ManageProjectPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { PrivacyPage } from './pages/PrivacyPage.tsx';
import { ProjectDetailPage } from './pages/ProjectDetailPage.tsx';
import { SubmitProjectPage } from './pages/SubmitProjectPage.tsx';
import { TermsPage } from './pages/TermsPage.tsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects" element={<DirectoryPage />} />
            <Route path="/projects/:slug" element={<ProjectDetailPage />} />
            <Route path="/submit" element={<SubmitProjectPage />} />
            <Route path="/manage" element={<ManageAccessPage />} />
            <Route path="/manage/:token" element={<ManageProjectPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
