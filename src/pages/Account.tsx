import { CalendarCheck, Crown, Eye, EyeOff, LoaderCircle, ShieldCheck, TriangleAlert, Truck } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLang, type L } from '../i18n/lang';
import { BrandMark } from '../components/ui';
import { ProfileView } from '../components/ProfileView';
import { homeFor, roleOf, useAuth } from '../state/auth';
import { whatsappLink } from '../state/whatsapp';

const ERRORS: Record<string, L> = {
  BAD_LOGIN: { ta: 'கைபேசி எண் அல்லது கடவுச்சொல் தவறு.', en: 'Mobile number or password is wrong.' },
  LOCKED: { ta: 'பல முறை தவறாக உள்ளிட்டீர்கள். 15 நிமிடம் கழித்து முயற்சிக்கவும்.', en: 'Too many wrong attempts. Please try again after 15 minutes.' },
  EXISTS: { ta: 'இந்த எண் ஏற்கனவே பதிவாகியுள்ளது. உள்நுழையவும்.', en: 'This mobile number is already registered. Please log in.' },
  BAD_INPUT: { ta: 'விவரங்களைச் சரிபார்க்கவும் — கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்.', en: 'Please check the details — the password needs at least 6 characters.' },
  TOO_MANY: { ta: 'இப்போது அதிகமானோர் பதிவு செய்கிறார்கள். சிறிது நேரம் கழித்து முயற்சிக்கவும்.', en: 'Too many sign-ups right now. Please try again later.' },
  NETWORK: { ta: 'இணைய இணைப்பு இல்லை. மீண்டும் முயற்சிக்கவும்.', en: 'No internet connection. Please try again.' },
  BAD_EMAIL: { ta: 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.', en: 'Enter a valid e-mail address.' },
  OTP_BAD: { ta: 'குறியீடு தவறு. மீண்டும் சரிபார்க்கவும்.', en: 'That code is wrong. Please check and try again.' },
  OTP_EXPIRED: { ta: 'குறியீடு காலாவதியானது. புதிய குறியீட்டைக் கேளுங்கள்.', en: 'The code has expired. Please ask for a new one.' },
  OTP_WAIT: { ta: 'சில விநாடிகள் காத்திருந்து மீண்டும் கேளுங்கள்.', en: 'Please wait a few seconds before asking for another code.' },
  NO_RESET: { ta: 'இந்த எண்ணுக்கு மின்னஞ்சல் சேமிக்கப்படவில்லை. WhatsApp-ல் எங்களைத் தொடர்பு கொள்ளவும்.', en: 'No e-mail is saved for this number. Please message us on WhatsApp.' },
  MAIL_FAIL: { ta: 'மின்னஞ்சல் அனுப்ப முடியவில்லை. முகவரியைச் சரிபார்க்கவும்.', en: 'Could not send the e-mail. Please check the address.' },
};
ERRORS.DISABLED = { ta: 'இந்தக் கணக்கு தற்போது நிறுத்தப்பட்டுள்ளது. நிர்வாகியைத் தொடர்பு கொள்ளவும்.', en: 'This account is switched off. Please contact the admin.' };
const GENERIC: L = { ta: 'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.', en: 'Something went wrong. Please try again.' };
const OUTDATED: L = { ta: 'சர்வர் ஸ்கிரிப்ட் பழையது — புதிய Code.gs-ஐ “New version” ஆக Deploy செய்யவும்.', en: 'The server script is out of date — deploy the new Code.gs as a “New version”.' };

/** Known codes get a friendly message; anything else shows the code so it can be diagnosed. */
function errorText(code: string): L {
  if (ERRORS[code]) return ERRORS[code];
  if (/\s/.test(code) || code === 'BAD_ACTION') return OUTDATED; // the old script answers bookings only, with plain-text errors
  return { ta: `${GENERIC.ta} (${code})`, en: `${GENERIC.en} (${code})` };
}

function Field({ label, children }: { label: L; children: React.ReactNode }) {
  const { t, lang } = useLang();
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink/75">
        <span lang={lang}>{t(label)}</span>
      </span>
      {children}
    </label>
  );
}

/** Forgot password: mobile number -> code e-mailed to the saved address -> new password. */
function ForgotPassword({ onBack, next }: { onBack: () => void; next?: string }) {
  const { t, lang } = useLang();
  const { sendResetOtp, resetPassword } = useAuth();
  const nav = useNavigate();
  const [mobile, setMobile] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [wait, setWait] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<L | null>(null);
  const m = mobile.replace(/\D/g, '').slice(-10);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const sendCode = async () => {
    if (!/^[6-9]\d{9}$/.test(m)) return setError({ ta: 'சரியான 10 இலக்க கைபேசி எண்ணை உள்ளிடவும்.', en: 'Enter a valid 10-digit mobile number.' });
    setError(null); setBusy(true);
    const r = await sendResetOtp(m);
    setBusy(false);
    if (r.ok) { setSentTo(r.sentTo); setWait(45); setOtp(''); } else setError(errorText(r.error));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!sentTo) return void sendCode();
    if (otp.length !== 6) return setError({ ta: '6 இலக்கக் குறியீட்டை உள்ளிடவும்.', en: 'Enter the 6-digit code.' });
    if (pw.length < 6) return setError(ERRORS.BAD_INPUT);
    setError(null); setBusy(true);
    const r = await resetPassword(m, otp, pw);
    setBusy(false);
    if (r.ok) nav(roleOf(r.user) === 'Customer' ? next ?? homeFor(r.user) : homeFor(r.user), { replace: true });
    else setError(errorText(r.error));
  };

  return (
    <form data-hide-fab onSubmit={submit} noValidate className="card gold-frame relative space-y-5 p-5 shadow-deep sm:p-8">
      <h2 lang={lang} className="text-xl font-extrabold">{t({ ta: 'கடவுச்சொல்லை மீட்டமைக்க', en: 'Reset your password' })}</h2>
      <Field label={{ ta: 'கைபேசி எண்', en: 'Mobile number' }}>
        <input className="w-full" type="tel" inputMode="numeric" placeholder="98765 43210" value={mobile} disabled={Boolean(sentTo)}
          onChange={(e) => setMobile(e.target.value)} autoComplete="tel-national" />
      </Field>
      {sentTo && (
        <div className="space-y-4 rounded-2xl bg-primary/5 p-4 ring-1 ring-primary/15">
          <p lang={lang} className="text-sm text-ink/75">
            {t({ ta: `6 இலக்கக் குறியீடு ${sentTo} முகவரிக்கு அனுப்பப்பட்டது (Spam கோப்புறையையும் பாருங்கள்).`, en: `A 6-digit code was sent to ${sentTo} (check Spam too).` })}
          </p>
          <Field label={{ ta: 'மின்னஞ்சல் குறியீடு (OTP)', en: 'E-mail code (OTP)' }}>
            <input className="w-full text-center text-xl font-extrabold tracking-[0.4em]" inputMode="numeric" maxLength={6} placeholder="••••••" value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} autoComplete="one-time-code" />
          </Field>
          <Field label={{ ta: 'புதிய கடவுச்சொல்', en: 'New password' }}>
            <span className="relative block">
              <input className="w-full !pr-12" type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}
                className="absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-ink/50 hover:text-ink">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
            <span lang={lang} className="mt-1 block text-xs text-ink/50">{t({ ta: 'குறைந்தது 6 எழுத்துகள்', en: 'At least 6 characters' })}</span>
          </Field>
          <button type="button" disabled={wait > 0 || busy} onClick={() => void sendCode()} className="text-sm font-bold text-primary underline disabled:no-underline disabled:opacity-50">
            <span lang={lang}>{wait > 0 ? t({ ta: `மீண்டும் அனுப்ப (${wait} வி)`, en: `Resend code (${wait}s)` }) : t({ ta: 'குறியீட்டை மீண்டும் அனுப்ப', en: 'Resend code' })}</span>
          </button>
        </div>
      )}
      {error && (
        <p role="alert" lang={lang} className="flex items-start gap-2 rounded-2xl border-2 border-amber-400/60 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" /> {t(error)}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-primary w-full !py-3.5 text-base disabled:opacity-70">
        {busy && <LoaderCircle size={18} className="animate-spin" />}
        <span lang={lang}>{busy ? t({ ta: 'காத்திருக்கவும்…', en: 'Please wait…' }) : sentTo ? t({ ta: 'கடவுச்சொல்லை மாற்றி உள்நுழைய', en: 'Save password & log in' }) : t({ ta: 'OTP அனுப்புக', en: 'Send OTP' })}</span>
      </button>
      <p lang={lang} className="text-center text-sm text-ink/60">
        <button type="button" onClick={onBack} className="font-bold text-primary underline">{t({ ta: '← உள்நுழைவுக்குத் திரும்ப', en: '← Back to log in' })}</button>
      </p>
      <p lang={lang} className="text-center text-xs text-ink/45">
        {t({ ta: 'மின்னஞ்சல் இல்லாத பழைய கணக்கா? ', en: 'Old account without an e-mail? ' })}
        <a href={whatsappLink(lang)} target="_blank" rel="noreferrer" className="font-bold text-primary underline">{t({ ta: 'WhatsApp-ல் தெரிவிக்கவும்', en: 'Message us on WhatsApp' })}</a>
      </p>
    </form>
  );
}

export default function AccountPage() {
  const { t, lang } = useLang();
  const { enabled, user, login, register, sendOtp } = useAuth();
  const nav = useNavigate();
  const next = (useLocation().state as { next?: string } | null)?.next;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [forgot, setForgot] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null); // set once the code has been e-mailed
  const [wait, setWait] = useState(0);                              // seconds before "Resend code" works
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<L | null>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const m = mobile.replace(/\D/g, '').slice(-10);
    if (mode === 'register' && !name.trim()) return setError({ ta: 'உங்கள் பெயரை உள்ளிடவும்.', en: 'Please enter your name.' });
    if (!/^[6-9]\d{9}$/.test(m)) return setError({ ta: 'சரியான 10 இலக்க கைபேசி எண்ணை உள்ளிடவும்.', en: 'Enter a valid 10-digit mobile number.' });
    if (password.length < 6) return setError(ERRORS.BAD_INPUT);
    if (mode === 'register' && !agree) return setError({ ta: 'தொடர விதிமுறைகள் மற்றும் தனியுரிமைக் கொள்கையை ஏற்கவும்.', en: 'Please accept the Terms and the Privacy Policy to continue.' });
    if (mode === 'register' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError(ERRORS.BAD_EMAIL);
    setError(null);
    setBusy(true);

    // Creating an account: first e-mail a one-time code (OTP), then create the account with the code.
    if (mode === 'register' && !otpSentTo) {
      const s = await sendOtp(name.trim(), m, email.trim());
      setBusy(false);
      if (s.ok) { setOtpSentTo(s.sentTo); setWait(45); } else setError(errorText(s.error));
      return;
    }
    if (mode === 'register' && otp.replace(/\D/g, '').length !== 6) { setBusy(false); return setError({ ta: '6 இலக்கக் குறியீட்டை உள்ளிடவும்.', en: 'Enter the 6-digit code.' }); }

    const r = mode === 'login' ? await login(m, password) : await register(name.trim(), m, password, email.trim(), otp);
    setBusy(false);
    if (r.ok) nav(roleOf(r.user) === 'Customer' ? next ?? homeFor(r.user) : homeFor(r.user), { replace: true });
    else setError(errorText(r.error));
  };

  // Everyone signs in the same way; the server recognises admins, providers and customers by their mobile number.
  if (enabled && user) return <ProfileView user={user} />;

  return (
    <div className="relative">
      <div className="noise absolute inset-x-0 top-0 h-56 bg-wine-luxe sm:h-72" aria-hidden>
        <div className="thoranam absolute inset-x-0 bottom-0" />
      </div>
      <section className="relative mx-auto grid grid-cols-1 max-w-5xl gap-6 px-4 pb-12 pt-6 sm:px-6 sm:pt-10 lg:grid-cols-[1fr_27rem] lg:items-start lg:gap-10">
        <div className="text-white lg:pt-6">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-[0_0_40px_rgba(147,197,253,.35)]"><BrandMark className="h-14 w-14" /></span>
          <h1 className="mt-4 text-3xl font-extrabold sm:text-5xl"><span lang={lang} className="text-gradient-gold">{t({ ta: 'உள்நுழைய', en: 'Sign in' })}</span></h1>
          <p lang={lang} className="mt-2 max-w-md text-sm text-white/80 sm:text-base">{t({ ta: 'கைபேசி எண்ணும் கடவுச்சொல்லும் போதும் — நீங்கள் யார் என்பதை நாங்களே அறிவோம்.', en: 'Just your mobile number and password — we recognise who you are.' })}</p>
          <ul className="mt-8 hidden gap-3 lg:grid">
            {([[CalendarCheck, { ta: 'முன்பதிவு நிலையை நேரலையில் பாருங்கள்', en: 'Track every booking live' }], [Truck, { ta: 'சேவை வழங்குநர்கள் பணிகளை ஏற்கலாம்', en: 'Providers accept and complete jobs' }], [Crown, { ta: 'நிர்வாகி வழங்குநர்களைச் சேர்த்து ஒதுக்கலாம்', en: 'Admin adds providers and allocates orders' }]] as const).map(([I, v]) => (
              <li key={v.en} className="flex items-center gap-3 rounded-2xl bg-white/85 p-3 text-ink shadow-card ring-1 ring-gold-2/20 backdrop-blur">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-light to-primary-dark text-gold-1"><I size={18} /></span>
                <span lang={lang} className="text-sm font-semibold">{t(v)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
        {enabled && forgot ? (
          <ForgotPassword onBack={() => setForgot(false)} next={next} />
        ) : !enabled ? (
          <p lang={lang} className="card p-6 text-center text-ink/70">
            {t({ ta: 'கணக்கு வசதி இப்போது கிடைக்கவில்லை.', en: 'Accounts are not available right now.' })}
          </p>
        ) : (
          <form data-hide-fab onSubmit={submit} noValidate className="card gold-frame relative space-y-5 p-5 shadow-deep sm:p-8">
            <div className="flex rounded-full bg-ink/5 p-1" role="tablist">
              {(['login', 'register'] as const).map((m) => (
                <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(null); setOtpSentTo(null); setOtp(''); }}
                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-bold transition ${mode === m ? 'bg-primary text-white shadow' : 'text-ink/60 hover:text-ink'}`}>
                  <span lang={lang}>{m === 'login' ? t({ ta: 'உள்நுழைய', en: 'Log in' }) : t({ ta: 'புதிய கணக்கு', en: 'Create account' })}</span>
                </button>
              ))}
            </div>

            {mode === 'register' && (
              <Field label={{ ta: 'உங்கள் பெயர்', en: 'Your name' }}>
                <input className="w-full" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </Field>
            )}
            <Field label={{ ta: 'கைபேசி எண்', en: 'Mobile number' }}>
              <input className="w-full" type="tel" inputMode="numeric" placeholder="98765 43210" value={mobile}
                onChange={(e) => setMobile(e.target.value)} autoComplete="tel-national" />
            </Field>
            {mode === 'register' && (
              <Field label={{ ta: 'மின்னஞ்சல் (Gmail)', en: 'E-mail (Gmail)' }}>
                <input className="w-full" type="email" inputMode="email" placeholder="name@gmail.com" value={email} disabled={Boolean(otpSentTo)}
                  onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </Field>
            )}
            <Field label={{ ta: 'கடவுச்சொல்', en: 'Password' }}>
              <span className="relative block">
                <input className="w-full !pr-12" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-ink/50 hover:text-ink">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
              {mode === 'register' && <span lang={lang} className="mt-1 block text-xs text-ink/50">{t({ ta: 'குறைந்தது 6 எழுத்துகள்', en: 'At least 6 characters' })}</span>}
            </Field>

            {mode === 'register' && (
              <label className="flex items-start gap-2.5 text-sm text-ink/75">
                <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-primary" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span lang={lang}>
                  {t({ ta: 'நான் ', en: 'I agree to the ' })}
                  <a href="terms.html" target="_blank" rel="noreferrer" className="font-bold text-primary underline">{t({ ta: 'விதிமுறைகள்', en: 'Terms of Use' })}</a>
                  {t({ ta: ' மற்றும் ', en: ' and ' })}
                  <a href="privacy.html" target="_blank" rel="noreferrer" className="font-bold text-primary underline">{t({ ta: 'தனியுரிமைக் கொள்கையை', en: 'Privacy Policy' })}</a>
                  {t({ ta: ' ஏற்கிறேன்.', en: '.' })}
                </span>
              </label>
            )}

            {mode === 'register' && otpSentTo && (
              <div className="space-y-2 rounded-2xl bg-primary/5 p-4 ring-1 ring-primary/15">
                <p lang={lang} className="text-sm text-ink/75">
                  {t({ ta: `6 இலக்கக் குறியீடு ${otpSentTo} முகவரிக்கு அனுப்பப்பட்டது (Spam கோப்புறையையும் பாருங்கள்).`, en: `A 6-digit code was sent to ${otpSentTo} (check Spam too).` })}
                </p>
                <Field label={{ ta: 'மின்னஞ்சல் குறியீடு (OTP)', en: 'E-mail code (OTP)' }}>
                  <input className="w-full text-center text-xl font-extrabold tracking-[0.4em]" inputMode="numeric" maxLength={6} placeholder="••••••" value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} autoComplete="one-time-code" />
                </Field>
                <div className="flex flex-wrap gap-4 text-sm">
                  <button type="button" disabled={wait > 0 || busy} className="font-bold text-primary underline disabled:no-underline disabled:opacity-50"
                    onClick={async () => {
                      setBusy(true); setError(null);
                      const s = await sendOtp(name.trim(), mobile.replace(/\D/g, '').slice(-10), email.trim());
                      setBusy(false);
                      if (s.ok) { setWait(45); setOtp(''); } else setError(errorText(s.error));
                    }}>
                    <span lang={lang}>{wait > 0 ? t({ ta: `மீண்டும் அனுப்ப (${wait} வி)`, en: `Resend code (${wait}s)` }) : t({ ta: 'குறியீட்டை மீண்டும் அனுப்ப', en: 'Resend code' })}</span>
                  </button>
                  <button type="button" className="font-semibold text-ink/55 underline" onClick={() => { setOtpSentTo(null); setOtp(''); setError(null); }}>
                    <span lang={lang}>{t({ ta: 'மின்னஞ்சலை மாற்ற', en: 'Change e-mail' })}</span>
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p role="alert" lang={lang} className="flex items-start gap-2 rounded-2xl border-2 border-amber-400/60 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                <TriangleAlert size={16} className="mt-0.5 shrink-0" /> {t(error)}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full !py-3.5 text-base disabled:opacity-70">
              {busy && <LoaderCircle size={18} className="animate-spin" />}
              <span lang={lang}>
                {busy ? t({ ta: 'காத்திருக்கவும்…', en: 'Please wait…' })
                  : mode === 'login' ? t({ ta: 'உள்நுழைய', en: 'Log in' })
                    : otpSentTo ? t({ ta: 'சரிபார்த்து கணக்கு உருவாக்க', en: 'Verify & create account' })
                      : t({ ta: 'OTP அனுப்புக', en: 'Send OTP' })}
              </span>
            </button>

            {mode === 'login' && (
              <p lang={lang} className="text-center text-sm text-ink/60">
                <button type="button" onClick={() => { setForgot(true); setError(null); }} className="font-bold text-primary underline">
                  {t({ ta: 'கடவுச்சொல் மறந்துவிட்டதா?', en: 'Forgot your password?' })}
                </button>
              </p>
            )}
            <p lang={lang} className="flex items-start justify-center gap-1.5 text-center text-xs text-ink/45">
              <ShieldCheck size={14} className="mt-px shrink-0" /> {t({ ta: 'உங்கள் கடவுச்சொல் பாதுகாப்பாக மறைகுறியாக்கப்பட்டு சேமிக்கப்படுகிறது.', en: 'Your password is stored securely, never as plain text.' })}
            </p>
          </form>
        )}
        </div>
      </section>
    </div>
  );
}
