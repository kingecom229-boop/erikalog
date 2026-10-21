import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AppNotification, Profile, SiteSettings } from '../types/database';
import { supabase } from '../lib/supabase';
import {
  getActiveSessionUser,
  getPublicReferenceData,
  getUserConversations,
  getUserFavorites,
  getUserNotifications,
  reloadLocalStateFromStorage,
  signInWithEmail,
  signOutUser,
  syncFromSupabase,
  toggleFavoriteProperty,
} from '../services/erikalogService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

export type ThemeMode = 'light' | 'dark';
export type AppLanguage = 'fr' | 'en';

const THEME_STORAGE_KEY = 'erikalog_theme';
const LANG_STORAGE_KEY = 'erikalog_lang';

interface AppContextValue {
  user: Profile | null;
  siteSettings: SiteSettings;
  favoritePropertyIds: string[];
  favoriteIds: string[];
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  unreadMessagesCount: number;
  isSupabaseSynced: boolean;
  toasts: ToastMessage[];
  theme: ThemeMode;
  language: AppLanguage;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  setLanguage: (lang: AppLanguage) => void;
  t: (fr: string, en: string) => string;
  refreshState: () => void;
  login: (email: string, password: string) => Promise<Profile>;
  logout: () => Promise<void>;
  setSessionUser: (user: Profile | null) => void;
  setUser: (user: Profile | null) => void;
  toggleFavorite: (propertyId: string) => Promise<boolean>;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function getInitialTheme(): ThemeMode {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    return 'light';
  }
  return 'light';
}

function getInitialLanguage(): AppLanguage {
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'en' || saved === 'fr') return saved;
  } catch {
    return 'fr';
  }
  return 'fr';
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(() => getActiveSessionUser());
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(
    () => getPublicReferenceData().siteSettings
  );
  const [favoritePropertyIds, setFavoritePropertyIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [isSupabaseSynced, setIsSupabaseSynced] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [language, setLanguageState] = useState<AppLanguage>(getInitialLanguage);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      return;
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, language);
    } catch {
      return;
    }
  }, [language]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'fr' ? 'en' : 'fr'));
  }, []);

  const t = useCallback(
    (fr: string, en: string) => {
      return language === 'en' ? en : fr;
    },
    [language]
  );

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const refreshState = useCallback(() => {
    const currentUser = getActiveSessionUser();
    setUser(currentUser);
    const refData = getPublicReferenceData();
    setSiteSettings(refData.siteSettings);

    if (currentUser) {
      const favs = getUserFavorites(currentUser.id);
      setFavoritePropertyIds(favs.map((f) => f.property_id));
      const notifs = getUserNotifications(currentUser.id);
      setNotifications(notifs);
      const convs = getUserConversations(currentUser);
      const unreadConvs = convs.reduce((acc, c) => acc + (c.unread_count || 0), 0);
      setUnreadMessagesCount(unreadConvs);
    } else {
      setFavoritePropertyIds([]);
      setNotifications([]);
      setUnreadMessagesCount(0);
    }
  }, []);

  useEffect(() => {
    refreshState();
    syncFromSupabase().then((synced) => {
      if (synced) {
        setIsSupabaseSynced(true);
        refreshState();
      }
    });
  }, [refreshState]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel('erikalog-realtime-events')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications' },
          () => {
            syncFromSupabase().then(() => refreshState());
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages' },
          () => {
            syncFromSupabase().then(() => refreshState());
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'viewing_requests' },
          () => {
            syncFromSupabase().then(() => refreshState());
          }
        )
        .subscribe();
    } catch {
      channel = null;
    }

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('erikalog_live_sync');
        bc.onmessage = () => {
          reloadLocalStateFromStorage();
          refreshState();
        };
      }
    } catch {
      bc = null;
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'erikalog_db_state_v1') {
        reloadLocalStateFromStorage();
        refreshState();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (bc) bc.close();
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [refreshState]);

  const login = useCallback(
    async (email: string, password: string): Promise<Profile> => {
      const { user: loggedInUser } = await signInWithEmail(email, password);
      refreshState();
      return loggedInUser;
    },
    [refreshState]
  );

  const logout = useCallback(async () => {
    await signOutUser();
    setUser(null);
    setFavoritePropertyIds([]);
    setNotifications([]);
    setUnreadMessagesCount(0);
    showToast(
      language === 'en'
        ? 'You have been signed out of ErikaLog.'
        : 'Vous êtes déconnecté de votre espace ErikaLog.',
      'info'
    );
  }, [showToast, language]);

  const setSessionUser = useCallback(
    (nextUser: Profile | null) => {
      setUser(nextUser);
      refreshState();
    },
    [refreshState]
  );

  const toggleFavorite = useCallback(
    async (propertyId: string): Promise<boolean> => {
      if (!user) return false;
      const res = await toggleFavoriteProperty(user.id, propertyId);
      refreshState();
      return res.favorited;
    },
    [user, refreshState]
  );

  const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AppContext.Provider
      value={{
        user,
        siteSettings,
        favoritePropertyIds,
        favoriteIds: favoritePropertyIds,
        notifications,
        unreadNotificationsCount,
        unreadMessagesCount,
        isSupabaseSynced,
        toasts,
        theme,
        language,
        toggleTheme,
        toggleLanguage,
        setLanguage,
        t,
        refreshState,
        login,
        logout,
        setSessionUser,
        setUser: setSessionUser,
        toggleFavorite,
        showToast,
        dismissToast,
      }}
    >
      {children}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full px-4 pointer-events-none"
        >
          {toasts.map((toastItem) => (
            <div
              key={toastItem.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl shadow-card border text-sm font-medium transition-all ${
                toastItem.type === 'success'
                  ? 'bg-navy-900 text-white border-sage-500'
                  : toastItem.type === 'error'
                  ? 'bg-red-950 text-red-100 border-red-700'
                  : 'bg-navy-950 text-slate-100 border-navy-700'
              }`}
            >
              <span>{toastItem.text}</span>
              <button
                type="button"
                onClick={() => dismissToast(toastItem.id)}
                className="text-xs opacity-75 hover:opacity-100 ml-2 shrink-0"
              >
                Fermer
              </button>
            </div>
          ))}
        </div>
      )}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
