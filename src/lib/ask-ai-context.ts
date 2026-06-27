import type { SystemModelMessage } from 'ai';
import { getNewApiServerUrl, getWebsiteName } from './site-config';

const docsLanguages = ['en', 'zh', 'ja', 'ru'];
const defaultDocsLanguage = 'en';
const docsCorpusCache = new Map<string, Promise<string>>();

function isDocsLanguage(lang: string): boolean {
  return docsLanguages.includes(lang);
}

export function resolveDocsLanguage({
  explicitLang,
  referer,
}: {
  explicitLang?: unknown;
  referer?: string | null;
}) {
  if (typeof explicitLang === 'string' && isDocsLanguage(explicitLang)) {
    return explicitLang;
  }

  if (referer) {
    try {
      const pathname = new URL(referer).pathname;
      const [, lang] = pathname.split('/');
      if (isDocsLanguage(lang)) {
        return lang;
      }
    } catch {
      // Ignore malformed referer headers and use the default language below.
    }
  }

  return defaultDocsLanguage;
}

export function createDocsSystemPrompt(
  lang: string,
  docsCorpus: string
): SystemModelMessage {
  const websiteName = getWebsiteName();
  const apiGatewayUrl = getNewApiServerUrl();

  return {
    role: 'system',
    content: `You are the ${websiteName} Docs assistant.
Answer using the full ${websiteName} documentation corpus below.
Current docs language: ${lang}.
The ${websiteName} API gateway address is: ${apiGatewayUrl}.

Rules:
- Prioritize the documentation corpus over your training data.
- If the documentation corpus does not contain enough information, say so clearly.
- Keep answers practical and cite relevant page titles or sections when possible.
- Answer in the user's language unless they ask otherwise.

<docs_corpus>
${docsCorpus}
</docs_corpus>`,
  };
}

export async function getDocsSystemPrompt(lang: string) {
  if (!docsCorpusCache.has(lang)) {
    docsCorpusCache.set(
      lang,
      import('./llms').then(({ generateLLMsFullText }) =>
        generateLLMsFullText(lang)
      )
    );
  }

  const docsCorpus = await docsCorpusCache.get(lang)!;
  return createDocsSystemPrompt(lang, docsCorpus);
}
