import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  HelpCircle,
  Mail,
  MapPin,
  Phone,
  Search,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getArticleBySlug,
  getPageBySlug,
  getPublishedArticles,
  getPublishedFaqs,
  submitContactForm,
} from '../services/erikalogService';
import { SeoHead } from '../components/SeoHead';

export const GuidesPage: React.FC = () => {
  const articles = getPublishedArticles();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(articles.map((a) => a.category)))];
  const filtered =
    selectedCategory === 'all'
      ? articles
      : articles.filter((a) => a.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <SeoHead
        title="Guides pratiques du logement étudiant : Dossier, Visale, APL & Conseils"
        description="Tous nos guides pratiques rédigés pour les étudiants et les propriétaires bailleurs : constituer son dossier locatif, garantie Visale, CAF/APL, éviter les arnaques."
        canonicalPath="/guides"
      />

      <div className="bg-navy-950 text-white rounded-3xl p-8 sm:p-10 space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-600/20 text-sage-300 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" /> Guides & Conseils ErikaLog
        </span>
        <h1 className="text-3xl font-extrabold">
          Tout savoir sur le logement étudiant en France
        </h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
          Préparer son dossier de location, obtenir la garantie Visale, simuler ses aides CAF/APL
          ou louer un studio meublé en toute conformité.
        </p>
      </div>

      
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              selectedCategory === cat
                ? 'bg-navy-900 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {cat === 'all' ? 'Tous les guides' : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((art) => (
          <Link
            key={art.id}
            to={`/guides/${art.slug}`}
            className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-card transition-all flex flex-col"
          >
            {art.cover_image_url && (
              <div className="h-52 overflow-hidden bg-slate-100">
                <img
                  src={art.cover_image_url}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-md bg-sage-50 text-sage-800 font-bold uppercase">
                    {art.category}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {art.reading_time_min} min de lecture
                  </span>
                </div>
                <h2 className="text-lg font-bold text-navy-950 group-hover:text-sage-700 transition-colors">
                  {art.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{art.excerpt}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sage-700">
                <span>Lire le guide complet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export const GuideDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : null;

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-navy-950">Guide introuvable</h1>
        <Link
          to="/guides"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux guides
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <SeoHead
        title={article.seo_title || article.title}
        description={article.seo_description || article.excerpt}
        canonicalPath={`/guides/${article.slug}`}
      />

      <Link
        to="/guides"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-900"
      >
        <ArrowLeft className="w-4 h-4" /> Tous les guides pratiques
      </Link>

      <article className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {article.cover_image_url && (
          <div className="h-64 sm:h-80 overflow-hidden">
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6 sm:p-10 space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="px-3 py-1 rounded-full bg-sage-100 text-sage-800 font-bold uppercase">
              {article.category}
            </span>
            <span className="text-slate-500">
              Temps de lecture : {article.reading_time_min} min
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950">{article.title}</h1>
          <p className="text-base font-medium text-slate-700 border-l-4 border-sage-600 pl-4">
            {article.excerpt}
          </p>
          <div className="prose prose-slate max-w-none text-sm sm:text-base text-slate-700 whitespace-pre-line leading-relaxed pt-2">
            {article.content}
          </div>
        </div>
      </article>
    </div>
  );
};

export const FaqPage: React.FC = () => {
  const faqs = getPublishedFaqs();
  const [query, setQuery] = useState('');

  const filtered = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(query.toLowerCase()) ||
      f.answer.toLowerCase().includes(query.toLowerCase()) ||
      f.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <SeoHead
        title="Centre d’aide & FAQ ErikaLog | Logement étudiant en France"
        description="Questions fréquentes sur le fonctionnement d’ErikaLog : recherche étudiante gratuite, dépôt d’annonce propriétaire/agence, demandes de visite et modération."
        canonicalPath="/aide"
      />

      <div className="bg-navy-950 text-white rounded-3xl p-8 space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-600/20 text-sage-300 text-xs font-bold uppercase">
          <HelpCircle className="w-3.5 h-3.5" /> Centre d’aide ErikaLog
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold">Questions fréquentes (FAQ)</h1>
        <div className="relative max-w-xl">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un sujet (Visale, frais, propriétaire, visite...)"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-900 border border-navy-700 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-sage-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((faq) => (
          <div
            key={faq.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2 shadow-sm"
          >
            <span className="text-[11px] font-bold uppercase text-sage-700">{faq.category}</span>
            <h2 className="text-base font-bold text-navy-950">{faq.question}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const { user, siteSettings, showToast } = useApp();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('Question sur une annonce ou un compte');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitContactForm({ fullName, email, subject, message });
      setSent(true);
      setMessage('');
      showToast('Votre message a bien été transmis à l’équipe ErikaLog.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur d’envoi', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <SeoHead
        title="Contacter l’équipe ErikaLog | Assistance Étudiants & Propriétaires"
        description="Contactez le support ErikaLog pour toute question relative à votre recherche de logement étudiant ou à la publication de vos annonces."
        canonicalPath="/contact"
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 bg-navy-950 text-white rounded-3xl p-8 space-y-6">
          <h1 className="text-2xl font-extrabold">Contactez l’équipe ErikaLog</h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Notre équipe dédiée aux étudiants, propriétaires bailleurs et agences immobilières vous
            répond sous 24 heures ouvrées.
          </p>
          <div className="space-y-4 pt-2 text-sm text-slate-200">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-sage-400 shrink-0" />
              <span>{siteSettings.contact_email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-sage-400 shrink-0" />
              <span>{siteSettings.support_phone}</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-sage-400 shrink-0 mt-0.5" />
              <span>{siteSettings.company_address}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-7 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          {sent ? (
            <div className="py-12 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-sage-600 mx-auto" />
              <h2 className="text-xl font-bold text-navy-950">Message envoyé avec succès</h2>
              <p className="text-sm text-slate-600">
                Merci {fullName}, notre équipe de modération et d’accompagnement vous répondra à
                l’adresse <strong>{email}</strong>.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-bold"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-bold text-navy-950">Formulaire de contact direct</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Objet *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Votre message *
                </label>
                <textarea
                  rows={5}
                  required
                  minLength={10}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Précisez votre demande (référence d’annonce, question compte, partenariat école...)"
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-sage-600 hover:bg-sage-500 text-white text-sm font-bold inline-flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Envoyer le message</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export const CmsDynamicPage: React.FC<{ fixedSlug?: string }> = ({ fixedSlug }) => {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const slug = fixedSlug || routeSlug || 'a-propos';
  const page = getPageBySlug(slug);

  if (!page) {
    return <NotFoundPage />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <SeoHead
        title={page.seo_title || `${page.title} | ErikaLog`}
        description={page.seo_description || page.subtitle || page.title}
        canonicalPath={`/${page.slug}`}
      />

      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-6">
        <div className="space-y-2 border-b border-slate-100 pb-6">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-sage-700">
            <ShieldCheck className="w-4 h-4" /> Informations officielles ErikaLog
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950">{page.title}</h1>
          {page.subtitle && <p className="text-sm text-slate-600">{page.subtitle}</p>}
        </div>

        <div className="prose prose-slate max-w-none text-sm sm:text-base text-slate-700 whitespace-pre-line leading-relaxed">
          {page.content}
        </div>

        <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
          Dernière mise à jour via le CMS ErikaLog :{' '}
          {new Date(page.updated_at).toLocaleDateString('fr-FR')}
        </div>
      </div>
    </div>
  );
};

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
      <SeoHead
        title="Page introuvable (404) | ErikaLog"
        description="La page que vous recherchez n’existe pas ou a été déplacée."
      />
      <span className="inline-block px-3 py-1 rounded-full bg-navy-100 text-navy-900 text-xs font-extrabold">
        Erreur 404
      </span>
      <h1 className="text-3xl font-extrabold text-navy-950">
        Cette page ou cette annonce n’est plus accessible
      </h1>
      <p className="text-sm text-slate-600">
        Le lien que vous avez suivi est peut-être expiré ou l’annonce a été retirée de la
        publication.
      </p>
      <div className="flex justify-center gap-3">
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-bold hover:bg-navy-800"
        >
          Retour à l’accueil
        </Link>
        <Link
          to="/recherche"
          className="px-5 py-2.5 rounded-xl bg-sage-600 text-white text-xs font-bold hover:bg-sage-500"
        >
          Parcourir les logements
        </Link>
      </div>
    </div>
  );
};
