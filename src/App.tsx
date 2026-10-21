import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CookieBanner } from './components/CookieBanner';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { CitiesPage } from './pages/CitiesPage';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import { LoginPage, RegisterPage, ResetPasswordPage } from './pages/AuthPages';
import { MessagingPage } from './pages/MessagingPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { AdvertiserDashboardPage } from './pages/AdvertiserDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import {
  CmsDynamicPage,
  ContactPage,
  FaqPage,
  GuideDetailPage,
  GuidesPage,
  NotFoundPage,
} from './pages/EditorialAndLegalPages';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
};

export const AppRoutes: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recherche" element={<SearchPage />} />
          <Route path="/villes" element={<CitiesPage />} />
          <Route path="/villes/:slug" element={<CitiesPage />} />
          <Route path="/logement/:slug" element={<PropertyDetailPage />} />

          
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/inscription" element={<RegisterPage />} />
          <Route path="/mot-de-passe-oublie" element={<ResetPasswordPage />} />

          
          <Route path="/messagerie" element={<MessagingPage />} />
          <Route path="/etudiant" element={<StudentDashboardPage />} />
          <Route path="/annonceur" element={<AdvertiserDashboardPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />

          
          <Route path="/guides" element={<GuidesPage />} />
          <Route path="/guides/:slug" element={<GuideDetailPage />} />
          <Route path="/aide" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />

          
          <Route path="/a-propos" element={<CmsDynamicPage fixedSlug="a-propos" />} />
          <Route path="/mentions-legales" element={<CmsDynamicPage fixedSlug="mentions-legales" />} />
          <Route
            path="/politique-confidentialite"
            element={<CmsDynamicPage fixedSlug="politique-confidentialite" />}
          />
          <Route path="/cgu" element={<CmsDynamicPage fixedSlug="cgu" />} />
          <Route path="/politique-cookies" element={<CmsDynamicPage fixedSlug="politique-cookies" />} />
          <Route path="/page/:slug" element={<CmsDynamicPage />} />

          
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <CookieBanner />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
};

export default App;
