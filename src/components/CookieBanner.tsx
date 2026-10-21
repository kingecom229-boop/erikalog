import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, Settings2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const COOKIE_STORAGE_KEY = 'erikalog_cookie_consent_v1';
const COOKIE_NAME = 'erikalog_cookie_consent';
const SIX_MONTHS_SECONDS = 15552000;

interface CookieConsentState {
  essential: boolean;
  preferences: boolean;
  analytics: boolean;
  updatedAt: string;
}

function getBrowserCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function setBrowserCookie(name: string, value: string, maxAgeSeconds = SIX_MONTHS_SECONDS): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

export const CookieBanner: React.FC = () => {
  const { t } = useApp();
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [preferences, setPreferences] = useState(true);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    try {
      const existingCookie = getBrowserCookie(COOKIE_NAME);
      const savedLocal = window.localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!existingCookie && !savedLocal) {
        setVisible(true);
      } else if (savedLocal && !existingCookie) {
        const parsed = JSON.parse(savedLocal) as CookieConsentState;
        setBrowserCookie(COOKIE_NAME, JSON.stringify(parsed));
        setBrowserCookie('erikalog_essential', 'true');
        setBrowserCookie('erikalog_preferences', String(Boolean(parsed.preferences)));
        setBrowserCookie('erikalog_analytics', String(Boolean(parsed.analytics)));
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const saveChoice = (consent: CookieConsentState) => {
    const serialized = JSON.stringify(consent);
    try {
      window.localStorage.setItem(COOKIE_STORAGE_KEY, serialized);
    } catch {
      void 0;
    }
    setBrowserCookie(COOKIE_NAME, serialized);
    setBrowserCookie('erikalog_essential', 'true');
    setBrowserCookie('erikalog_preferences', String(consent.preferences));
    setBrowserCookie('erikalog_analytics', String(consent.analytics));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t('Gestion des cookies', 'Cookie consent')}
      className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-lg z-50 bg-white dark:bg-[#0d1b31] rounded-2xl shadow-card border border-slate-200 dark:border-navy-700 p-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-navy-50 dark:bg-navy-900 flex items-center justify-center shrink-0">
          <Cookie className="w-5 h-5 text-sage-500" />
        </div>
        <div className="space-y-2 flex-1">
          <h3 className="text-sm font-bold text-navy-950 dark:text-white">
            {t('Respect de votre vie privée (RGPD & CNIL)', 'Respecting your privacy (GDPR)')}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {t(
              'ErikaLog utilise des cookies strictement nécessaires à votre session, au thème clair/sombre et à la langue choisie. Consultez notre ',
              'ErikaLog uses strictly necessary cookies for your session, light/dark theme, and language preferences. Read our '
            )}
            <Link to="/politique-cookies" className="text-sage-600 font-semibold underline">
              {t('Politique de cookies', 'Cookie Policy')}
            </Link>
            .
          </p>

          {customizing && (
            <div className="pt-2 pb-1 space-y-2 border-t border-slate-100 dark:border-navy-800 text-xs">
              <label className="flex items-center justify-between gap-2 text-slate-700 dark:text-slate-200">
                <span className="font-medium">
                  {t(
                    'Cookies essentiels (session, sécurité, langue)',
                    'Essential cookies (session, security, language)'
                  )}
                </span>
                <input type="checkbox" checked disabled className="accent-navy-800" />
              </label>
              <label className="flex items-center justify-between gap-2 text-slate-700 dark:text-slate-200 cursor-pointer">
                <span>
                  {t(
                    'Préférences de recherche & filtres sauvegardés',
                    'Saved search filters & UI preferences'
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={preferences}
                  onChange={(e) => setPreferences(e.target.checked)}
                  className="accent-sage-500"
                />
              </label>
              <label className="flex items-center justify-between gap-2 text-slate-700 dark:text-slate-200 cursor-pointer">
                <span>
                  {t(
                    'Mesure d’audience anonyme',
                    'Anonymous audience measurement'
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="accent-sage-500"
                />
              </label>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                saveChoice({
                  essential: true,
                  preferences: true,
                  analytics: true,
                  updatedAt: new Date().toISOString(),
                })
              }
              className="px-4 py-2 rounded-xl bg-sage-500 hover:bg-sage-600 text-white text-xs font-bold transition-colors"
            >
              {t('Tout accepter', 'Accept all')}
            </button>
            <button
              type="button"
              onClick={() =>
                saveChoice({
                  essential: true,
                  preferences: false,
                  analytics: false,
                  updatedAt: new Date().toISOString(),
                })
              }
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-navy-900 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
            >
              {t('Essentiels uniquement', 'Essential only')}
            </button>
            {customizing ? (
              <button
                type="button"
                onClick={() =>
                  saveChoice({
                    essential: true,
                    preferences,
                    analytics,
                    updatedAt: new Date().toISOString(),
                  })
                }
                className="px-3.5 py-2 rounded-xl border border-navy-800 text-navy-900 dark:text-white text-xs font-semibold"
              >
                {t('Enregistrer mes choix', 'Save choices')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCustomizing(true)}
                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-navy-900 dark:hover:text-white"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>{t('Personnaliser', 'Customize')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
