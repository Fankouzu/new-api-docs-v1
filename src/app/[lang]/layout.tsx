import { defineI18nUI } from 'fumadocs-ui/i18n';
import { i18n } from '@/lib/i18n';
import { Provider } from '@/components/provider';
import '../global.css';
import type { Metadata } from 'next';
import { createMetadata, baseUrl } from '@/lib/metadata';
import { notFound } from 'next/navigation';

const { provider } = defineI18nUI(i18n, {
  translations: {
    en: {
      displayName: 'English',
    },
    zh: {
      displayName: '简体中文',
      search: '搜索文档',
      searchNoResult: '没有结果',
      toc: '目录',
      lastUpdate: '最后更新于',
      chooseTheme: '选择主题',
      chooseLanguage: '选择语言',
      nextPage: '下一页',
      previousPage: '上一页',
      tocNoHeadings: '目录为空',
    },
    ja: {
      displayName: '日本語',
      search: 'ドキュメントを検索',
      searchNoResult: '結果が見つかりません',
      toc: '目次',
      lastUpdate: '最終更新',
      chooseTheme: 'テーマを選択',
      chooseLanguage: '言語を選択',
      nextPage: '次のページ',
      previousPage: '前のページ',
      tocNoHeadings: '見出しがありません',
    },
    ru: {
      displayName: 'Русский',
      search: 'Поиск по документации',
      searchNoResult: 'Ничего не найдено',
      toc: 'Содержание',
      lastUpdate: 'Последнее обновление',
      chooseTheme: 'Выбрать тему',
      chooseLanguage: 'Выбрать язык',
      nextPage: 'Следующая страница',
      previousPage: 'Предыдущая страница',
      tocNoHeadings: 'Заголовки отсутствуют',
    },
  },
});

const titleMap: Record<
  string,
  { default: string; template: string; description: string }
> = {
  en: {
    default: 'Lychee AI API Reference',
    template: '%s | Lychee AI',
    description:
      'API reference for Lychee AI model endpoints, management endpoints, and supported AI application integrations.',
  },
  zh: {
    default: 'Lychee AI API 参考',
    template: '%s | Lychee AI',
    description: 'Lychee AI 模型接口、管理接口与 AI 应用接入的 API 参考文档。',
  },
  ja: {
    default: 'Lychee AI APIリファレンス',
    template: '%s | Lychee AI',
    description:
      'Lychee AI のモデルエンドポイント、管理エンドポイント、AI アプリ連携の API リファレンス。',
  },
  ru: {
    default: 'Справочник API Lychee AI',
    template: '%s | Lychee AI',
    description:
      'Справочник API для модельных и административных интерфейсов Lychee AI, а также поддерживаемых интеграций AI-приложений.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = (await params).lang;
  const titles = titleMap[lang] || titleMap.en;

  return createMetadata({
    metadataBase: baseUrl,
    title: {
      default: titles.default,
      template: titles.template,
    },
    description: titles.description,
    keywords: [
      'AI Infrastructure',
      'AI Gateway',
      'AI Asset Management',
      'API Orchestration',
      'AI Application Platform',
      'Multi-Model Integration',
      'Enterprise AI',
      'AI Ecosystem',
      'Unified AI Interface',
      'Intelligent API Management',
    ],
    authors: [
      { name: 'Lychee AI Team', url: 'https://github.com/QuantumNous/new-api' },
    ],
    creator: 'Lychee AI Team',
    alternates: {
      languages: {
        en: '/en/docs',
        zh: '/zh/docs',
        ja: '/ja/docs',
        ru: '/ru/docs',
      },
    },
    openGraph: {
      type: 'website',
      locale: lang,
      title: titles.default,
      description: titles.description,
      siteName: 'Lychee AI',
    },
    twitter: {
      card: 'summary_large_image',
      title: titles.default,
      description: titles.description,
    },
  });
}

export async function generateStaticParams() {
  return i18n.languages.map((lang) => ({ lang }));
}

export default async function RootLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const lang = (await params).lang;

  // Check if the language is valid, prevent invalid language codes (e.g. 'api') from causing errors
  if (!i18n.languages.includes(lang as (typeof i18n.languages)[number])) {
    notFound();
  }

  return (
    <Provider i18n={provider(lang)} lang={lang}>
      {children}
    </Provider>
  );
}
