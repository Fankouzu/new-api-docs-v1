import { ProvideLinksToolSchema } from '../../../lib/inkeep-qa-schema';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { convertToModelMessages, streamText } from 'ai';
import { getDocsSystemPrompt, resolveDocsLanguage } from '@/lib/ask-ai-context';

export const runtime = 'nodejs';

const openai = createOpenAICompatible({
  name: 'inkeep',
  apiKey: process.env.INKEEP_API_KEY,
  baseURL: process.env.AI_BASE_URL || 'https://api.inkeep.com/v1',
});

export async function POST(req: Request) {
  const reqJson = await req.json();
  const lang = resolveDocsLanguage({
    explicitLang: reqJson.lang,
    referer: req.headers.get('referer'),
  });
  const docsSystemPrompt = await getDocsSystemPrompt(lang);

  const result = streamText({
    model: openai(process.env.AI_MODEL || 'inkeep-qa-sonnet-4'),
    tools: {
      provideLinks: {
        inputSchema: ProvideLinksToolSchema,
      },
    },
    messages: [
      docsSystemPrompt,
      ...convertToModelMessages(reqJson.messages, {
        ignoreIncompleteToolCalls: true,
      }),
    ],
    toolChoice: 'auto',
  });

  return result.toUIMessageStreamResponse();
}
