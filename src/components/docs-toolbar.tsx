'use client';

import { LanguageToggle } from 'fumadocs-ui/components/layout/language-toggle';
import { ThemeToggle } from 'fumadocs-ui/components/layout/theme-toggle';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { ArrowLeft, Languages } from 'lucide-react';
import { getWebsiteName, getWebsiteUrl } from '@/lib/site-config';

const websiteName = getWebsiteName();
const websiteUrl = getWebsiteUrl();

export function DocsSidebarFooter({ lang }: { lang: string }) {
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
      <LanguageToggle>
        <Languages className="size-4.5" />
      </LanguageToggle>
      <ThemeToggle className="ms-auto p-0" mode="light-dark" />
    </div>
  );
}
