import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { registerNewAccount } from '../services/erikalogService';
import { registerSchema } from '../lib/validation';
import { SeoHead } from '../components/SeoHead';

export const LoginPage: React.FC = () => {
  const { login, showToast, t } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigateAfterLogin = (role: string) => {
    if (redirectPath && redirectPath.startsWith('/')) {
      navigate(redirectPath);
      return;
    }
    if (role === 'admin') navigate('/admin');
    else if (role === 'owner' || role === 'agent') navigate('/annonceur');
    else navigate('/etudiant');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      showToast(
        t(
          `Bienvenue sur ErikaLog, ${loggedUser.full_name} !`,
          `Welcome back to ErikaLog, ${loggedUser.full_name}!`
        ),
        'success'
      );
      navigateAfterLogin(loggedUser.role);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('Erreur de connexion.', 'Sign-in error.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
      <SeoHead
        title={t(
          'Connexion à votre espace ErikaLog | Étudiant, Propriétaire & Agence',
          'Sign in to ErikaLog | Student, Landlord & Agency'
        )}
        description={t(
          'Connectez-vous à votre compte ErikaLog pour gérer vos favoris, vos demandes de visite ou vos annonces immobilières.',
          'Sign in to your ErikaLog account to manage favorites, viewing requests, or property listings.'
        )}
        canonicalPath="/connexion"
      />

      <div className="bg-white dark:bg-[#0d1b31] rounded-3xl border border-slate-200 dark:border-navy-800 p-6 sm:p-8 shadow-card space-y-6">
        <div className="space-y-3 text-center">
          <Link to="/" className="inline-flex justify-center">
            <img src="/logo.png" alt="ErikaLog" className="h-12 w-auto object-contain" />
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-50 dark:bg-navy-900 text-navy-800 dark:text-slate-200 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-sage-500" />
            <span>{t('Accès sécurisé ErikaLog', 'Secure ErikaLog Sign-In')}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-navy-950 dark:text-white">
            {t('Connexion à votre espace', 'Sign in to your account')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            {t(
              'Retrouvez vos recherches, vos messages privés, vos demandes de visite ou vos annonces.',
              'Access your saved searches, private messages, viewing requests, or listings.'
            )}
          </p>
        </div>

        {redirectPath && (
          <div className="p-3.5 rounded-xl bg-sage-50 dark:bg-navy-900 border border-sage-200 dark:border-navy-700 text-xs text-sage-900 dark:text-slate-200 font-medium">
            {t(
              'Connectez-vous pour poursuivre votre action sur la page précédente.',
              'Please sign in to continue your action on the previous page.'
            )}
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              {t('Adresse e-mail', 'Email address')}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('votre.email@exemple.fr', 'your.email@example.com')}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 text-sm focus:outline-none focus:border-navy-800"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t('Mot de passe', 'Password')}
              </label>
              <Link
                to="/mot-de-passe-oublie"
                className="text-xs font-semibold text-sage-600 hover:underline"
              >
                {t('Mot de passe oublié ?', 'Forgot password?')}
              </Link>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 text-sm focus:outline-none focus:border-navy-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-navy-800 hover:bg-navy-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
          >
            <span>
              {loading
                ? t('Connexion en cours...', 'Signing in...')
                : t('Se connecter', 'Sign In')}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 dark:border-navy-800 text-center text-xs text-slate-600 dark:text-slate-300">
          {t('Vous n’avez pas encore de compte ?', "Don't have an account yet?")}{' '}
          <Link
            to={redirectPath ? `/inscription?redirect=${encodeURIComponent(redirectPath)}` : '/inscription'}
            className="font-bold text-sage-600 hover:underline"
          >
            {t('Créer un compte gratuitement', 'Create a free account')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const { setSessionUser, showToast, t } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRoleParam = searchParams.get('role');
  const redirectPath = searchParams.get('redirect') || '';

  const [selectedProfile, setSelectedProfile] = useState<'student' | 'owner' | 'agent'>(
    initialRoleParam === 'owner' ? 'owner' : initialRoleParam === 'agent' ? 'agent' : 'student'
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [universityOrSchool, setUniversityOrSchool] = useState('');
  const [studyCity, setStudyCity] = useState('Paris');
  const [companyName, setCompanyName] = useState('');
  const [siret, setSiret] = useState('');
  const [professionalCard, setProfessionalCard] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const accountType =
      selectedProfile === 'student'
        ? 'student'
        : selectedProfile === 'owner'
        ? 'individual_owner'
        : 'real_estate_agent';

    const parsed = registerSchema.safeParse({
      fullName,
      email,
      password,
      role: selectedProfile,
      accountType,
      phone,
      universityOrSchool: selectedProfile === 'student' ? universityOrSchool : undefined,
      studyCity: selectedProfile === 'student' ? studyCity : undefined,
      companyName: selectedProfile === 'agent' ? companyName : undefined,
      siret: selectedProfile === 'agent' ? siret : undefined,
      professionalCard: selectedProfile === 'agent' ? professionalCard : undefined,
      acceptTerms,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || t('Veuillez vérifier les informations saisies.', 'Please check your input.'));
      return;
    }

    setLoading(true);
    try {
      const created = await registerNewAccount({
        fullName,
        email,
        password,
        role: selectedProfile,
        accountType,
        phone,
        universityOrSchool,
        studyCity,
        companyName,
        siret,
        professionalCard,
      });
      setSessionUser(created);
      showToast(
        t('Votre compte ErikaLog a été créé avec succès !', 'Your ErikaLog account has been created!'),
        'success'
      );
      if (redirectPath && redirectPath.startsWith('/')) {
        navigate(redirectPath);
      } else if (created.role === 'student') {
        navigate('/etudiant');
      } else {
        navigate('/annonceur');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('Impossible de créer le compte.', 'Unable to create account.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SeoHead
        title={t(
          'Créer un compte ErikaLog | Étudiant, Propriétaire Bailleur ou Agence',
          'Create an ErikaLog Account | Student, Landlord or Agency'
        )}
        description={t(
          'Inscrivez-vous gratuitement sur ErikaLog comme étudiant en recherche de logement ou comme propriétaire/agence.',
          'Sign up for free on ErikaLog as a student looking for housing or as a landlord/agency.'
        )}
        canonicalPath="/inscription"
      />

      <div className="bg-white dark:bg-[#0d1b31] rounded-3xl border border-slate-200 dark:border-navy-800 p-6 sm:p-8 shadow-card space-y-6">
        <div className="space-y-2 text-center">
          <Link to="/" className="inline-flex justify-center">
            <img src="/logo.png" alt="ErikaLog" className="h-11 w-auto object-contain" />
          </Link>
          <span className="block text-xs font-bold uppercase tracking-wider text-sage-600">
            {t('Inscription Gratuite & Sécurisée', 'Free & Secure Registration')}
          </span>
          <h1 className="text-2xl font-extrabold text-navy-950 dark:text-white">
            {t('Choisissez votre profil ErikaLog', 'Choose your ErikaLog profile')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            {t(
              'Sélectionnez le type de compte adapté à vos besoins. Les annonces ne peuvent être déposées que par des propriétaires ou professionnels.',
              'Select the account type that fits your needs. Listings can only be posted by landlords or real estate professionals.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setSelectedProfile('student')}
            className={`p-3.5 rounded-2xl border text-left transition-all space-y-1.5 ${
              selectedProfile === 'student'
                ? 'border-sage-500 bg-sage-50/70 dark:bg-navy-900 ring-2 ring-sage-500/20'
                : 'border-slate-200 dark:border-navy-700 hover:bg-slate-50'
            }`}
          >
            <GraduationCap
              className={`w-5 h-5 ${
                selectedProfile === 'student' ? 'text-sage-600' : 'text-slate-400'
              }`}
            />
            <p className="text-xs font-bold text-navy-950 dark:text-white">
              {t('Étudiant', 'Student')}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              {t('Je cherche un logement, gère mes favoris et visites.', 'Looking for housing, favorites & viewings.')}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedProfile('owner')}
            className={`p-3.5 rounded-2xl border text-left transition-all space-y-1.5 ${
              selectedProfile === 'owner'
                ? 'border-navy-800 bg-navy-50 dark:bg-navy-900 ring-2 ring-navy-800/20'
                : 'border-slate-200 dark:border-navy-700 hover:bg-slate-50'
            }`}
          >
            <User
              className={`w-5 h-5 ${
                selectedProfile === 'owner' ? 'text-navy-800 dark:text-sage-400' : 'text-slate-400'
              }`}
            />
            <p className="text-xs font-bold text-navy-950 dark:text-white">
              {t('Propriétaire Bailleur', 'Private Landlord')}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              {t('Je publie mes studios, chambres ou appartements.', 'Publish studios, rooms or apartments.')}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedProfile('agent')}
            className={`p-3.5 rounded-2xl border text-left transition-all space-y-1.5 ${
              selectedProfile === 'agent'
                ? 'border-navy-800 bg-navy-50 dark:bg-navy-900 ring-2 ring-navy-800/20'
                : 'border-slate-200 dark:border-navy-700 hover:bg-slate-50'
            }`}
          >
            <Building2
              className={`w-5 h-5 ${
                selectedProfile === 'agent' ? 'text-navy-800 dark:text-sage-400' : 'text-slate-400'
              }`}
            />
            <p className="text-xs font-bold text-navy-950 dark:text-white">
              {t('Agence / Résidence', 'Agency / Residence')}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              {t('Professionnel de l’immobilier ou gestionnaire.', 'Real estate agency or residence manager.')}
            </p>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {t('Nom et prénom *', 'Full name *')}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Thomas Martin"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 text-sm focus:outline-none focus:border-navy-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {t('Téléphone mobile *', 'Mobile phone *')}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 text-sm focus:outline-none focus:border-navy-800"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {t('Adresse e-mail *', 'Email address *')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@exemple.fr"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 text-sm focus:outline-none focus:border-navy-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {t('Mot de passe (min. 8 caractères) *', 'Password (min. 8 chars) *')}
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 text-sm focus:outline-none focus:border-navy-800"
              />
            </div>
          </div>

          {selectedProfile === 'student' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-navy-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  {t('Université ou École fréquentée', 'University or School')}
                </label>
                <input
                  type="text"
                  value={universityOrSchool}
                  onChange={(e) => setUniversityOrSchool(e.target.value)}
                  placeholder="Ex: Sorbonne, INSA Lyon..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  {t('Ville d’études principale', 'Main study city')}
                </label>
                <select
                  value={studyCity}
                  onChange={(e) => setStudyCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                >
                  {['Paris', 'Lyon', 'Toulouse', 'Bordeaux', 'Lille', 'Montpellier', 'Rennes', 'Strasbourg'].map(
                    (c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          )}

          {selectedProfile === 'agent' && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-navy-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  {t('Raison sociale / Nom de l’agence *', 'Company / Agency name *')}
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Habitat Campus Immobilier SAS"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    {t('Numéro SIRET', 'SIRET number')}
                  </label>
                  <input
                    type="text"
                    value={siret}
                    onChange={(e) => setSiret(e.target.value)}
                    placeholder="Ex: 892 451 320 00018"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    {t('Carte Professionnelle (CPI / Loi Hoguet)', 'Professional license (CPI)')}
                  </label>
                  <input
                    type="text"
                    value={professionalCard}
                    onChange={(e) => setProfessionalCard(e.target.value)}
                    placeholder="Ex: CPI 7501 2025 000 012 345"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 accent-sage-500"
            />
            <span>
              {t('J’accepte les ', 'I accept the ')}
              <Link to="/cgu" className="text-sage-600 font-semibold underline">
                {t('Conditions Générales d’Utilisation', 'Terms of Use')}
              </Link>{' '}
              {t('et la ', 'and the ')}
              <Link to="/politique-confidentialite" className="text-sage-600 font-semibold underline">
                {t('Politique de confidentialité (RGPD)', 'Privacy Policy (GDPR)')}
              </Link>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-sage-500 hover:bg-sage-600 text-white font-bold text-sm transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading
              ? t('Création du compte...', 'Creating account...')
              : t('Créer mon compte ErikaLog', 'Create my ErikaLog account')}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 dark:border-navy-800 text-center text-xs text-slate-600 dark:text-slate-300">
          {t('Vous avez déjà un compte ?', 'Already have an account?')}{' '}
          <Link to="/connexion" className="font-bold text-sage-600 hover:underline">
            {t('Se connecter', 'Sign In')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export const ResetPasswordPage: React.FC = () => {
  const { showToast, t } = useApp();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
    showToast(
      t(
        'Instructions de réinitialisation envoyées par e-mail.',
        'Password reset instructions sent by email.'
      ),
      'success'
    );
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <SeoHead
        title={t('Réinitialiser votre mot de passe | ErikaLog', 'Reset your password | ErikaLog')}
        description={t(
          'Procédure sécurisée de réinitialisation de mot de passe pour votre compte ErikaLog.',
          'Secure password reset procedure for your ErikaLog account.'
        )}
        canonicalPath="/mot-de-passe-oublie"
      />
      <div className="bg-white dark:bg-[#0d1b31] rounded-3xl border border-slate-200 dark:border-navy-800 p-6 sm:p-8 shadow-card space-y-5">
        <div className="w-11 h-11 rounded-2xl bg-navy-50 dark:bg-navy-900 text-navy-800 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-sage-500" />
        </div>
        <h1 className="text-xl font-extrabold text-navy-950 dark:text-white">
          {t('Mot de passe oublié ?', 'Forgot your password?')}
        </h1>
        {sent ? (
          <div className="p-4 rounded-2xl bg-sage-50 border border-sage-200 space-y-2 text-xs text-sage-900">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-sage-600" />
              <span>{t('E-mail envoyé !', 'Email sent!')}</span>
            </div>
            <p>
              {t(
                `Si un compte existe pour l’adresse ${email}, un lien de réinitialisation vient d’être envoyé.`,
                `If an account exists for ${email}, a password reset link has been sent.`
              )}
            </p>
            <Link to="/connexion" className="inline-block pt-2 font-bold underline">
              {t('Retour à la connexion', 'Back to sign in')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t(
                'Saisissez l’adresse e-mail associée à votre compte ErikaLog pour recevoir un lien sécurisé de réinitialisation.',
                'Enter the email address associated with your ErikaLog account to receive a secure reset link.'
              )}
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {t('Votre adresse e-mail', 'Your email address')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.fr"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-white text-xs font-bold"
            >
              {t('Envoyer le lien de réinitialisation', 'Send reset link')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
