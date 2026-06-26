'use client';

import { LanguageToggle } from 'fumadocs-ui/components/layout/language-toggle';
import { ThemeToggle } from 'fumadocs-ui/components/layout/theme-toggle';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { ArrowLeft, Languages } from 'lucide-react';

const homeLabels = {
  en: 'Back to lizh.ai',
  zh: '返回 lizh.ai',
  ja: 'lizh.ai に戻る',
} as const;

export function DocsToolbar({ lang }: { lang: string }) {
  const homeLabel =
    homeLabels[lang as keyof typeof homeLabels] || homeLabels.en;

  return (
    <div className="docs-floating-toolbar pointer-events-none fixed z-30 flex justify-end px-4 pt-3 md:px-6 xl:px-8">
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-lg border bg-fd-background/90 p-1 text-fd-muted-foreground shadow-sm backdrop-blur-sm">
        <a
          href="https://lizh.ai/"
          className={cn(
            buttonVariants({ color: 'ghost', size: 'sm' }),
            'gap-1.5'
          )}
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">{homeLabel}</span>
        </a>
        <LanguageToggle>
          <Languages className="size-4.5" />
        </LanguageToggle>
        <ThemeToggle className="p-0" mode="light-dark" />
      </div>
    </div>
  );
}
