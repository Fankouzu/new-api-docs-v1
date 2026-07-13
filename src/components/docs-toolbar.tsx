'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'fumadocs-ui/components/ui/popover';
import { useI18n } from 'fumadocs-ui/contexts/i18n';
import { ThemeToggle } from 'fumadocs-ui/components/layout/theme-toggle';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { ArrowLeft, Check, Languages, LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getWebsiteName, getWebsiteUrl } from '@/lib/site-config';

const websiteName = getWebsiteName();
const websiteUrl = getWebsiteUrl();
const LANGUAGE_SWITCH_TIMEOUT_MS = 8000;
const MINIMUM_FEEDBACK_DURATION_MS = 650;
const LANGUAGE_SWITCH_STORAGE_KEY = 'lizh-docs-language-switch';

type StoredLanguageSwitch = {
  locale: string;
  startedAt: number;
};

function DocsLanguageToggle() {
  const { locale, locales, onChange, text } = useI18n();
  const [open, setOpen] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let storedSwitch: StoredLanguageSwitch | null = null;

    try {
      const storedValue = sessionStorage.getItem(LANGUAGE_SWITCH_STORAGE_KEY);
      storedSwitch = storedValue
        ? (JSON.parse(storedValue) as StoredLanguageSwitch)
        : null;
    } catch {
      sessionStorage.removeItem(LANGUAGE_SWITCH_STORAGE_KEY);
    }

    if (!storedSwitch || storedSwitch.locale !== locale) return;

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    setPendingLocale(storedSwitch.locale);
    const elapsed = Date.now() - storedSwitch.startedAt;
    const remaining = Math.max(MINIMUM_FEEDBACK_DURATION_MS - elapsed, 0);

    timeoutRef.current = window.setTimeout(() => {
      sessionStorage.removeItem(LANGUAGE_SWITCH_STORAGE_KEY);
      setPendingLocale(null);
      timeoutRef.current = null;
    }, remaining);
  }, [locale]);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  function selectLocale(nextLocale: string) {
    setOpen(false);
    if (nextLocale === locale || pendingLocale) return;

    const storedSwitch: StoredLanguageSwitch = {
      locale: nextLocale,
      startedAt: Date.now(),
    };
    sessionStorage.setItem(
      LANGUAGE_SWITCH_STORAGE_KEY,
      JSON.stringify(storedSwitch)
    );
    setPendingLocale(nextLocale);
    timeoutRef.current = window.setTimeout(() => {
      sessionStorage.removeItem(LANGUAGE_SWITCH_STORAGE_KEY);
      setPendingLocale(null);
      timeoutRef.current = null;
    }, LANGUAGE_SWITCH_TIMEOUT_MS);
    onChange?.(nextLocale);
  }

  if (!locales) return null;

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pendingLocale) setOpen(nextOpen);
      }}
    >
      <PopoverTrigger
        aria-label={text.chooseLanguage}
        aria-busy={pendingLocale ? 'true' : undefined}
        aria-disabled={pendingLocale ? 'true' : undefined}
        className={cn(
          buttonVariants({ color: 'ghost', size: 'icon-sm' }),
          'transition-[color,background-color,box-shadow,transform] duration-150',
          pendingLocale &&
            'bg-fd-primary/15 text-fd-primary ring-fd-primary/40 scale-105 cursor-progress ring-2'
        )}
      >
        {pendingLocale ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <Languages aria-hidden="true" />
        )}
        {pendingLocale && (
          <span className="sr-only">
            {locales.find((item) => item.locale === pendingLocale)?.name}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="flex flex-col overflow-x-hidden p-0">
        <p className="text-fd-muted-foreground mb-1 p-2 text-xs font-medium">
          {text.chooseLanguage}
        </p>
        {locales.map((item) => {
          const isCurrent = item.locale === locale;

          return (
            <button
              key={item.locale}
              type="button"
              className={cn(
                'flex items-center gap-2 p-2 text-start text-sm transition-colors',
                isCurrent
                  ? 'bg-fd-primary/10 text-fd-primary font-medium'
                  : 'hover:bg-fd-accent hover:text-fd-accent-foreground'
              )}
              onClick={() => selectLocale(item.locale)}
            >
              <span className="flex-1">{item.name}</span>
              {isCurrent && <Check className="size-4" aria-hidden="true" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

export function DocsSidebarFooter() {
  return (
    <div className="text-fd-muted-foreground flex items-center gap-1.5">
      <a
        aria-label={websiteName}
        href={websiteUrl}
        className={cn(
          buttonVariants({ color: 'ghost', size: 'sm' }),
          'gap-1.5'
        )}
      >
        <ArrowLeft className="size-4" />
        <span className="hidden sm:inline">{websiteName}</span>
      </a>
      <DocsLanguageToggle />
      <ThemeToggle className="ms-auto p-0" mode="light-dark" />
    </div>
  );
}
