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

export function DocsSidebarFooter({ lang }: { lang: string }) {
  const homeLabel =
    homeLabels[lang as keyof typeof homeLabels] || homeLabels.en;

  return (
    <div className="flex items-center gap-1.5 text-fd-muted-foreground">
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
      <ThemeToggle className="ms-auto p-0" mode="light-dark" />
    </div>
  );
}
