import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Lang = 'ta' | 'en';
/** A bilingual string. Tamil is always authored first. */
export type L = { ta: string; en: string };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Primary text in the active language. */
  t: (l: L) => string;
  /** The other language — shown as a small companion line. */
  alt: (l: L) => string;
};

const LangContext = createContext<Ctx | null>(null);

function readStored(): Lang {
  try {
    const v = localStorage.getItem('lang');
    if (v === 'ta' || v === 'en') return v;
  } catch {
    /* storage unavailable */
  }
  return 'ta';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStored);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem('lang', lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const value: Ctx = {
    lang,
    setLang: setLangState,
    t: (l) => l[lang],
    alt: () => '', // one language at a time: the other language is never shown
  };
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside LangProvider');
  return ctx;
}

/** Renders the active-language text with the other language underneath. */
export function Bi({
  v,
  className = '',
  altClassName = '',
  inline = false,
}: {
  v: L;
  className?: string;
  altClassName?: string;
  inline?: boolean;
}) {
  const { lang, t } = useLang();
  void altClassName;
  if (inline) return <span lang={lang} className={className}>{t(v)}</span>;
  return <span lang={lang} className={`block ${className}`}>{t(v)}</span>;
}

/** Active-language text only. */
export function Tx({ v, className }: { v: L; className?: string }) {
  const { lang, t } = useLang();
  return (
    <span lang={lang} className={className}>
      {t(v)}
    </span>
  );
}

export const inr = (n: number) =>
  '₹' + Math.round(n).toLocaleString('en-IN');
