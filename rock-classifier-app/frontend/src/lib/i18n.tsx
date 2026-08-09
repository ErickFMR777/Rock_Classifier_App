/**
 * Bilingual (ES/EN) content layer.
 *
 * Every translatable string is a `Localized<T>` — `Record<Locale, T>` — so
 * omitting a language is a TypeScript error, not a silent runtime fallback to
 * the other locale. The Vercel build runs `tsc && vite build`, so a half-
 * translated string cannot reach production.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export const LOCALES = ['es', 'en'] as const
export type Locale = (typeof LOCALES)[number]

/** A value that must exist in every supported locale. */
export type Localized<T> = Record<Locale, T>

const STORAGE_KEY = 'rockclassifier.locale'

function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'es'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'es' || stored === 'en') return stored
  return window.navigator.language.toLowerCase().startsWith('en') ? 'en' : 'es'
}

interface LocaleContextValue {
  locale: Locale
  setLocale: (next: Locale) => void
  /** Resolve a Localized value against the active locale. */
  t: <T>(value: Localized<T>) => T
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale)

  useEffect(() => {
    document.documentElement.lang = locale
    window.localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const setLocale = useCallback((next: Locale) => setLocaleState(next), [])

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: <T,>(localized: Localized<T>) => localized[locale],
    }),
    [locale, setLocale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

/**
 * Render a translated string with `**bold**` segments.
 *
 * Splitting a sentence into prefix/bold/suffix pieces forces the two languages
 * to share a word order they do not share, and leaves one piece empty whenever
 * a sentence happens to open on the emphasised word. Marking emphasis inside
 * the string keeps each translation a single grammatical unit. Only `**` is
 * interpreted — the text is still rendered as text, never as HTML.
 */
export function RichText({ value }: { value: string }) {
  return (
    <>
      {value.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          part
        ),
      )}
    </>
  )
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used inside a <LocaleProvider>')
  return ctx
}

/** Locale-aware number formatting, so decimals use the right separator. */
export function useFormatters() {
  const { locale } = useLocale()
  const tag = locale === 'es' ? 'es-ES' : 'en-GB'
  return useMemo(
    () => ({
      /** `value` is a fraction in [0, 1], not an already-multiplied percentage. */
      percent: (v: number, digits = 1) =>
        new Intl.NumberFormat(tag, {
          style: 'percent',
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        }).format(v),
      integer: (v: number) => new Intl.NumberFormat(tag).format(v),
      date: (iso: string) => {
        const d = new Date(iso)
        return Number.isNaN(d.getTime())
          ? iso
          : new Intl.DateTimeFormat(tag, { dateStyle: 'long' }).format(d)
      },
    }),
    [tag],
  )
}
