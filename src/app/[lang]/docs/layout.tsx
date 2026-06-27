import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { DocsNavigationFeedback } from '@/components/docs-navigation-feedback';
import { DocsSidebarFooter } from '@/components/docs-toolbar';
import { AISearchTrigger } from '@/components/search';
import 'katex/dist/katex.min.css';
import { notFound } from 'next/navigation';
import { i18n } from '@/lib/i18n';
import { formatPageTree } from '@/lib/page-tree-format';

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const { lang } = await params;

  // Check if the language is valid, prevent invalid language codes (e.g. 'api') from causing errors
  if (!i18n.languages.includes(lang as (typeof i18n.languages)[number])) {
    notFound();
  }

  const base = baseOptions(lang);

  return (
    <DocsLayout
      {...base}
      i18n={false}
      themeSwitch={{
        enabled: false,
      }}
      tree={formatPageTree(source.pageTree[lang])}
      sidebar={{
        defaultOpenLevel: 0,
        tabs: false,
        footer: <DocsSidebarFooter lang={lang} />,
      }}
    >
      <DocsNavigationFeedback />
      {children}
      {process.env.INKEEP_API_KEY && <AISearchTrigger />}
    </DocsLayout>
  );
}
