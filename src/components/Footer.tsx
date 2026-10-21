import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { siteSettings, t } = useApp();

  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3">
              <img
                src="/logo.png"
                alt="ErikaLog"
                className="h-11 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              {t(
                siteSettings.tagline,
                'ErikaLog is the French student housing platform connecting students with verified private landlords, partner agencies, and student residences.'
              )}
            </p>
            <div className="flex flex-col gap-2 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sage-400 shrink-0" />
                <span>{siteSettings.company_address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-sage-400 shrink-0" />
                <a
                  href={`mailto:${siteSettings.contact_email}`}
                  className="hover:text-white transition-colors"
                >
                  {siteSettings.contact_email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-sage-400 shrink-0" />
                <span>{siteSettings.support_phone}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              {t('Villes Étudiantes', 'Student Cities')}
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/villes/paris" className="hover:text-white transition-colors">
                  {t('Logement étudiant Paris', 'Student housing Paris')}
                </Link>
              </li>
              <li>
                <Link to="/villes/lyon" className="hover:text-white transition-colors">
                  {t('Logement étudiant Lyon', 'Student housing Lyon')}
                </Link>
              </li>
              <li>
                <Link to="/villes/toulouse" className="hover:text-white transition-colors">
                  {t('Logement étudiant Toulouse', 'Student housing Toulouse')}
                </Link>
              </li>
              <li>
                <Link to="/villes/bordeaux" className="hover:text-white transition-colors">
                  {t('Logement étudiant Bordeaux', 'Student housing Bordeaux')}
                </Link>
              </li>
              <li>
                <Link to="/villes/lille" className="hover:text-white transition-colors">
                  {t('Logement étudiant Lille', 'Student housing Lille')}
                </Link>
              </li>
              <li>
                <Link to="/villes/montpellier" className="hover:text-white transition-colors">
                  {t('Logement étudiant Montpellier', 'Student housing Montpellier')}
                </Link>
              </li>
              <li>
                <Link
                  to="/villes"
                  className="text-sage-400 hover:text-sage-300 font-semibold transition-colors"
                >
                  {t('Toutes les villes →', 'All student cities →')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              {t('Ressources & Aide', 'Resources & Help')}
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/recherche" className="hover:text-white transition-colors">
                  {t('Rechercher un logement', 'Search listings')}
                </Link>
              </li>
              <li>
                <Link to="/guides" className="hover:text-white transition-colors">
                  {t('Guides pratiques & Conseils', 'Student Housing Guides')}
                </Link>
              </li>
              <li>
                <Link to="/aide" className="hover:text-white transition-colors">
                  {t('Centre d’aide / FAQ', 'Help Center / FAQ')}
                </Link>
              </li>
              <li>
                <Link to="/a-propos" className="hover:text-white transition-colors">
                  {t('À propos d’ErikaLog', 'About ErikaLog')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  {t('Nous contacter', 'Contact Us')}
                </Link>
              </li>
              <li>
                <Link
                  to="/inscription?role=owner"
                  className="text-sage-400 hover:text-sage-300 font-semibold transition-colors"
                >
                  {t('Espace Bailleur & Agence', 'Landlord & Agency Space')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              {t('Informations Légales', 'Legal & Privacy')}
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/mentions-legales" className="hover:text-white transition-colors">
                  {t('Mentions légales', 'Legal Notice')}
                </Link>
              </li>
              <li>
                <Link to="/politique-confidentialite" className="hover:text-white transition-colors">
                  {t('Politique de confidentialité (RGPD)', 'Privacy Policy (GDPR)')}
                </Link>
              </li>
              <li>
                <Link to="/cgu" className="hover:text-white transition-colors">
                  {t('Conditions Générales d’Utilisation', 'Terms of Use')}
                </Link>
              </li>
              <li>
                <Link to="/politique-cookies" className="hover:text-white transition-colors">
                  {t('Politique de cookies', 'Cookie Policy')}
                </Link>
              </li>
            </ul>
            <div className="pt-2">
              <div className="p-3 rounded-xl bg-navy-900/90 border border-navy-800 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-sage-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-300 leading-snug">
                  {t(
                    'Annonces vérifiées et publiées exclusivement par des propriétaires et professionnels.',
                    'Verified listings published exclusively by landlords and real estate professionals.'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-navy-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} {siteSettings.site_name}.{' '}
            {t('Tous droits réservés.', 'All rights reserved.')}
          </p>
          <p className="text-[11px] text-slate-400">
            {t(
              'Garantie Visale • Éligibilité APL • Dossier Locatif Sécurisé',
              'Visale Guarantee • APL Housing Aid • Verified Student Housing'
            )}
          </p>
        </div>
      </div>
    </footer>
  );
};
