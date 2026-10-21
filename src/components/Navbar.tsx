import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Globe,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  PlusCircle,
  Search,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    user,
    unreadNotificationsCount,
    unreadMessagesCount,
    favoritePropertyIds,
    theme,
    language,
    toggleTheme,
    toggleLanguage,
    t,
    logout,
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== '/' && location.pathname.startsWith(path));

  const getDashboardPath = () => {
    if (!user) return '/connexion';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'owner' || user.role === 'agent') return '/annonceur';
    return '/etudiant';
  };

  const getRoleBadge = () => {
    if (!user) return null;
    if (user.role === 'admin') {
      return (
        <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-sage-500 text-white">
          Admin
        </span>
      );
    }
    if (user.role === 'agent') {
      return (
        <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-navy-800 text-white">
          {t('Agence Pro', 'Pro Agency')}
        </span>
      );
    }
    if (user.role === 'owner') {
      return (
        <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-navy-700 text-white">
          {t('Propriétaire', 'Landlord')}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-navy-50 text-navy-800 dark:bg-navy-900 dark:text-navy-100">
        {t('Étudiant', 'Student')}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0d1b31]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-[#1e3252] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <img
              src="/logo.png"
              alt="ErikaLog"
              className="h-11 sm:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <Link
              to="/recherche"
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                isActive('/recherche')
                  ? 'bg-navy-800 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-200 hover:text-navy-800 hover:bg-slate-100 dark:hover:bg-navy-900/60'
              }`}
            >
              <Search className="w-4 h-4 text-sage-500" />
              <span>{t('Rechercher un logement', 'Find Housing')}</span>
            </Link>

            <Link
              to="/villes"
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive('/villes')
                  ? 'bg-navy-800 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-200 hover:text-navy-800 hover:bg-slate-100 dark:hover:bg-navy-900/60'
              }`}
            >
              {t('Villes étudiantes', 'Student Cities')}
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-2.5">
            {(!user || user.role !== 'student') && (
              <Link
                to={
                  user && (user.role === 'owner' || user.role === 'agent')
                    ? '/annonceur?tab=new'
                    : '/inscription?role=owner'
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-sage-500 hover:bg-sage-600 text-white transition-all shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('Déposer une annonce', 'Post a Listing')}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={toggleLanguage}
              title={t('Basculer en anglais (EN)', 'Switch to French (FR)')}
              aria-label={t('Changer la langue FR/EN', 'Switch language FR/EN')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900/70 text-xs font-extrabold text-navy-900 dark:text-white hover:border-sage-500 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-sage-500" />
              <span>{language === 'fr' ? 'FR' : 'EN'}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              title={
                theme === 'dark'
                  ? t('Passer en mode clair', 'Switch to light mode')
                  : t('Passer en mode sombre', 'Switch to dark mode')
              }
              aria-label={t('Basculer le thème clair/sombre', 'Toggle light/dark theme')}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900/70 text-navy-900 dark:text-amber-400 hover:border-sage-500 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-navy-800" />
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-navy-800">
                {user.role === 'student' && (
                  <Link
                    to="/etudiant?tab=favorites"
                    title={t('Mes favoris', 'My favorites')}
                    className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                  >
                    <Heart className="w-5 h-5" />
                    {favoritePropertyIds.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-sage-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {favoritePropertyIds.length}
                      </span>
                    )}
                  </Link>
                )}

                <Link
                  to="/messagerie"
                  title={t('Messagerie privée', 'Private messages')}
                  className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-sage-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadMessagesCount}
                    </span>
                  )}
                </Link>

                <Link
                  to={`${getDashboardPath()}?tab=notifications`}
                  title={t('Notifications', 'Notifications')}
                  className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </Link>

                <Link
                  to={getDashboardPath()}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-white text-xs font-bold transition-colors"
                >
                  {user.role === 'admin' ? (
                    <ShieldCheck className="w-4 h-4 text-sage-400" />
                  ) : (
                    <LayoutDashboard className="w-4 h-4 text-sage-400" />
                  )}
                  <span className="max-w-[110px] truncate">{user.full_name.split(' ')[0]}</span>
                  {getRoleBadge()}
                </Link>

                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                  title={t('Se déconnecter', 'Sign out')}
                  className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-1">
                <Link
                  to="/connexion"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-navy-900 dark:text-white hover:bg-slate-100 dark:hover:bg-navy-900 transition-colors"
                >
                  {t('Connexion', 'Sign In')}
                </Link>
                <Link
                  to="/inscription"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-navy-800 hover:bg-navy-700 text-white transition-colors shadow-sm"
                >
                  {t('Inscription', 'Sign Up')}
                </Link>
              </div>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 text-xs font-extrabold text-navy-900 dark:text-white"
            >
              {language === 'fr' ? 'FR' : 'EN'}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-navy-700 text-navy-900 dark:text-amber-400"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-navy-800 bg-white dark:bg-[#0d1b31] px-4 pt-3 pb-5 space-y-2 shadow-lg">
          <Link
            to="/recherche"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100"
          >
            {t('Rechercher un logement', 'Find Housing')}
          </Link>
          <Link
            to="/villes"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100"
          >
            {t('Villes étudiantes', 'Student Cities')}
          </Link>

          <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-navy-800 text-white text-sm font-bold text-center"
                >
                  {t('Mon espace', 'My Dashboard')} ({user.full_name})
                </Link>
                <Link
                  to="/messagerie"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-800 text-sm font-medium text-center"
                >
                  {t('Messagerie', 'Messages')} ({unreadMessagesCount})
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await logout();
                    navigate('/');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-50 text-red-700 text-sm font-semibold text-center"
                >
                  {t('Se déconnecter', 'Sign out')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/connexion"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-800 dark:text-white text-sm font-bold text-center"
                >
                  {t('Se connecter', 'Sign In')}
                </Link>
                <Link
                  to="/inscription"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-sage-500 text-white text-sm font-bold text-center"
                >
                  {t('Créer un compte', 'Create an Account')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
