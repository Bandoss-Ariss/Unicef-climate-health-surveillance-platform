import { useState, FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Sun, Radio, Brain, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useL } from '../i18n/useL';
import { ouagaDate } from '../data/dates';

export default function Login() {
  const { user, login } = useAuth();
  const { language, setLanguage } = useLanguage();
  const L = useL();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // Petit délai pour matérialiser l'échange avec le serveur d'authentification
    setTimeout(() => {
      const ok = login(email, password);
      setLoading(false);
      if (ok) navigate(from, { replace: true });
      else setError(L('Identifiant ou mot de passe incorrect.', 'Incorrect email or password.'));
    }, 650);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gray-50">
      {/* Panneau gauche : identité & promesse */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-unicef-darkblue via-[#2B5BB5] to-unicef-blue text-white p-12">
        <div>
          <img src="/brand/unicef-logo-white.svg" alt="UNICEF" className="h-12 w-auto" />
          <p className="mt-3 text-sm font-bold leading-tight">{L('Plateforme Climat-Santé', 'Climate-Health Platform')}</p>
          <p className="text-[12px] text-blue-100">Burkina Faso · {L('Alerte précoce & solarisation intelligente', 'Early warning & smart solarisation')}</p>
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-tight">{L('Anticiper le risque. Garantir la continuité des soins.', 'Anticipate the risk. Ensure continuity of care.')}</h1>
          <blockquote className="mt-5 border-l-2 border-unicef-yellow pl-4 text-blue-50 text-[15px] leading-relaxed">
            {language === 'fr' ? (
              <>Au Burkina Faso, des enfants meurent non pas parce que les traitements n'existent pas, mais parce que le centre de santé a perdu l'électricité, que les vaccins ont chauffé, ou que l'alerte est arrivée trop tard. Cette plateforme relie <strong className="text-white font-semibold">énergie solaire, données climatiques et surveillance sanitaire</strong> pour agir 48 à 72 h avant la crise.</>
            ) : (
              <>In Burkina Faso, children die not because treatments do not exist, but because the health centre lost power, the vaccines got warm, or the alert came too late. This platform connects <strong className="text-white font-semibold">solar energy, climate data and health surveillance</strong> to act 48 to 72 hours before the crisis.</>
            )}
          </blockquote>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              [Sun, '10', L('formations sanitaires solarisées', 'solarised health facilities')],
              [Radio, '60', L('capteurs IoT en continu', 'IoT sensors streaming')],
              [Brain, '14 j', L("d'anticipation épidémique", 'epidemic lead time')],
            ].map(([Icon, v, lab]) => {
              const I = Icon as typeof Sun;
              return (
                <div key={lab as string} className="bg-white/10 rounded-xl p-3">
                  <I size={16} className="text-unicef-yellow" />
                  <p className="text-2xl font-bold mt-2">{v as string}</p>
                  <p className="text-[11px] text-blue-100 leading-snug">{lab as string}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-blue-200">
          <span className="flex items-center gap-1.5"><ShieldCheck size={12} /> {L('Bien public numérique · MIT · données hébergées UNICEF', 'Digital Public Good · MIT · UNICEF-hosted data')}</span>
          <img src="/brand/unicef-badge.svg" alt="UNICEF — for every child" className="h-16 w-16 rounded-lg shadow-lg" />
          <span>{ouagaDate(new Date(), language)}</span>
        </div>
      </div>

      {/* Panneau droit : formulaire */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <img src="/brand/unicef-logo.svg" alt="UNICEF" className="h-10 w-auto" />
            <p className="text-sm font-bold text-gray-800 mt-2">{L('Plateforme Climat-Santé · Burkina Faso', 'Climate-Health Platform · Burkina Faso')}</p>
          </div>

          <img src="/brand/unicef-logo.svg" alt="UNICEF" className="hidden lg:block h-9 w-auto mb-6" />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{L('Connexion', 'Sign in')}</h2>
              <p className="text-sm text-gray-500 mt-1">{L('Accès réservé au personnel autorisé', 'Restricted to authorised staff')}</p>
            </div>
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {(['fr', 'en'] as const).map(l => (
                <button key={l} type="button" onClick={() => setLanguage(l)} className={`px-2 py-1 rounded-md text-[11px] font-semibold ${language === l ? 'bg-white text-unicef-blue shadow-sm' : 'text-gray-500'}`}>{l.toUpperCase()}</button>
              ))}
            </div>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">{L('Adresse e-mail', 'Email address')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email" autoComplete="username" required autoFocus
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="prenom.nom@unicef.org"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-unicef-blue/40 focus:border-unicef-blue"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">{L('Mot de passe', 'Password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type={show ? 'text' : 'password'} autoComplete="current-password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-unicef-blue/40 focus:border-unicef-blue"
                />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600" aria-label={L('Afficher le mot de passe', 'Show password')}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 animate-in">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 disabled:opacity-70">
              {loading ? <><Loader2 size={16} className="animate-spin" /> {L('Vérification…', 'Verifying…')}</> : L('Se connecter', 'Sign in')}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1"><ShieldCheck size={12} /> {L('Session chiffrée TLS 1.3', 'TLS 1.3 encrypted session')}</span>
            <span>{L('SSO UNICEF (Azure AD) — phase 2', 'UNICEF SSO (Azure AD) — phase 2')}</span>
          </div>
          <blockquote className="lg:hidden mt-8 border-l-2 border-unicef-blue pl-3 text-xs text-gray-600 leading-relaxed">
            {language === 'fr'
              ? <>Au Burkina Faso, des enfants meurent non pas parce que les traitements n'existent pas, mais parce que le centre de santé a perdu l'électricité, que les vaccins ont chauffé, ou que l'alerte est arrivée trop tard. Cette plateforme relie <strong>énergie solaire, données climatiques et surveillance sanitaire</strong> pour agir 48 à 72 h avant la crise.</>
              : <>In Burkina Faso, children die not because treatments do not exist, but because the health centre lost power, the vaccines got warm, or the alert came too late. This platform connects <strong>solar energy, climate data and health surveillance</strong> to act 48 to 72 hours before the crisis.</>}
          </blockquote>
          <p className="mt-8 text-center text-[11px] text-gray-400">© UNICEF Burkina Faso · {L('Prototype pilote v1.2', 'Pilot prototype v1.2')}</p>
        </div>
      </div>
    </div>
  );
}
