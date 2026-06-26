/**
 * Translate generated OpenAPI JSON display strings for locale-specific API pages.
 *
 * The source `openapi/generated/**` files are shared by every locale. Do not
 * mutate them for one language; instead write translated copies under
 * `openapi/generated-i18n/{locale}/**` and point that locale's MDX files there.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SOURCE_ROOT = path.join(process.cwd(), 'openapi', 'generated');
const OUT_ROOT = path.join(process.cwd(), 'openapi', 'generated-i18n');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gemini-2.5-flash';
const TARGET_LOCALE = process.env.TARGET_LOCALE || 'ru';
const MAX_RETRIES = Number.parseInt(process.env.MAX_RETRIES || '3', 10);
const RETRY_DELAY = Number.parseFloat(process.env.RETRY_DELAY || '2');
const BATCH_SIZE = Number.parseInt(process.env.OPENAPI_TRANSLATE_BATCH || '40', 10);

const TARGETS = {
  en: {
    name: 'English',
    nativeName: '英文',
    extraInstruction:
      '英文输出不得包含任何中文字符。中文品牌/产品名请使用英文写法：即梦=Jimeng，可灵=Kling，通义千问=Tongyi Qianwen/Qwen，百炼=Bailian，易支付=Epay。',
  },
  ja: {
    name: 'Japanese',
    nativeName: '日文',
    extraInstruction:
      '使用自然、专业的日语。包含中文字符的输入不能原样返回，例如“成功”应译为“成功しました”。产品品牌请优先使用拉丁字母品牌名：即梦=Jimeng，可灵=Kling，通义千问=Tongyi Qianwen/Qwen，百炼=Bailian，易支付=Epay。',
  },
  ru: {
    name: 'Russian',
    nativeName: '俄文',
    extraInstruction:
      '俄文输出不得包含任何中文字符。中文品牌/产品名请使用拉丁字母品牌名：即梦=Jimeng，可灵=Kling，通义千问=Tongyi Qianwen/Qwen，百炼=Bailian，易支付=Epay。',
  },
} as const;

type TargetLocale = keyof typeof TARGETS;

const NON_TRANSLATABLE_KEYS = new Set([
  '$ref',
  'bearerFormat',
  'format',
  'in',
  'operationId',
  'scheme',
  'type',
  'version',
]);

const NON_TRANSLATABLE_ARRAYS = new Set([
  'enum',
  'required',
  'x-apifox-orders',
]);

interface OpenAIResponse {
  choices: Array<{ message: { content: string } }>;
}

function assertConfig(locale: string): asserts locale is TargetLocale {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  if (!(locale in TARGETS)) {
    throw new Error(`Unsupported TARGET_LOCALE: ${locale}`);
  }
}

async function walkJsonFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(current: string) {
    const entries = await import('node:fs/promises').then((fs) =>
      fs.readdir(current, { withFileTypes: true })
    );

    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        out.push(full);
      }
    }
  }

  await walk(dir);
  return out.sort();
}

function hasChinese(value: string) {
  return /\p{Script=Han}/u.test(value);
}

function shouldTranslateString(key: string, value: string, parentPath: string[]) {
  if (!value.trim()) return false;
  if (!hasChinese(value)) return false;

  if (NON_TRANSLATABLE_KEYS.has(key)) return false;
  if (NON_TRANSLATABLE_ARRAYS.has(parentPath[parentPath.length - 1] ?? '')) {
    return false;
  }

  return true;
}

function collectStrings(
  value: unknown,
  out: Set<string>,
  parentPath: string[] = []
) {
  if (Array.isArray(value)) {
    const parentKey = parentPath[parentPath.length - 1] ?? '';
    if (!NON_TRANSLATABLE_ARRAYS.has(parentKey)) {
      for (const item of value) {
        if (typeof item === 'string' && hasChinese(item)) out.add(item);
      }
    }
    value.forEach((item, index) =>
      collectStrings(item, out, [...parentPath, String(index)])
    );
    return;
  }

  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    if (typeof child === 'string' && shouldTranslateString(key, child, parentPath)) {
      out.add(child);
    } else {
      collectStrings(child, out, [...parentPath, key]);
    }
  }
}

function applyTranslations(
  value: unknown,
  translations: Map<string, string>,
  parentPath: string[] = []
): unknown {
  if (Array.isArray(value)) {
    if (!NON_TRANSLATABLE_ARRAYS.has(parentPath[parentPath.length - 1] ?? '')) {
      return value.map((item, index) =>
        typeof item === 'string'
          ? translations.get(item) ?? item
          : applyTranslations(item, translations, [...parentPath, String(index)])
      );
    }
    return value.map((item, index) =>
      applyTranslations(item, translations, [...parentPath, String(index)])
    );
  }

  if (!value || typeof value !== 'object') return value;

  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === 'string' && shouldTranslateString(key, child, parentPath)) {
      out[key] = translations.get(child) ?? child;
    } else {
      out[key] = applyTranslations(child, translations, [...parentPath, key]);
    }
  }
  return out;
}

function getPrompt(locale: TargetLocale, items: string[]) {
  const target = TARGETS[locale];
  return `你是专业技术文档翻译。请把下面 JSON 数组中的中文 OpenAPI 可见文本翻译成${target.nativeName}。

要求：
1. 只输出 JSON 数组，数组长度和顺序必须与输入完全一致。
2. 保留 Markdown、反引号代码、URL、HTTP header、API path、模型名、品牌名（OpenAI、Gemini、Claude、Anthropic、Google、New API、Bailian、Qwen 等）。
3. 不要翻译 JSON key、枚举值、代码标识符；只翻译自然语言说明和 tag 显示名称。
4. 语气正式、技术准确。
5. ${target.extraInstruction}

输入：
${JSON.stringify(items)}`;
}

async function callOpenAI(prompt: string): Promise<string> {
  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You translate technical OpenAPI documentation while preserving JSON structure and identifiers.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as OpenAIResponse;
  return data.choices[0].message.content.trim();
}

function parseJsonArray(raw: string): string[] {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === 'string')) {
    throw new Error('translation output is not a string array');
  }
  return parsed;
}

function validateTranslations(
  locale: TargetLocale,
  source: string[],
  translated: string[]
) {
  const unchanged = translated.filter(
    (item, index) => hasChinese(source[index]) && item === source[index]
  );
  if (unchanged.length > 0) {
    throw new Error(
      `translation output still matches Chinese source: ${unchanged
        .slice(0, 3)
        .map((item) => JSON.stringify(item))
        .join(', ')}`
    );
  }

  if (locale === 'ja') return;

  const withChinese = translated.filter((item) => hasChinese(item));
  if (withChinese.length > 0) {
    throw new Error(
      `translation output still contains Chinese characters: ${withChinese
        .slice(0, 3)
        .map((item) => JSON.stringify(item))
        .join(', ')}`
    );
  }
}

async function translateBatch(locale: TargetLocale, batch: string[]): Promise<string[]> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const translated = parseJsonArray(await callOpenAI(getPrompt(locale, batch)));
      if (translated.length !== batch.length) {
        throw new Error(`expected ${batch.length} translations, got ${translated.length}`);
      }
      validateTranslations(locale, batch, translated);
      return translated;
    } catch (error) {
      if (attempt >= MAX_RETRIES) throw error;
      const delay = RETRY_DELAY * 2 ** attempt;
      console.log(
        `[translate-openapi-json] retry ${attempt + 1}/${MAX_RETRIES}: ${(error as Error).message}`
      );
      await new Promise((resolve) => setTimeout(resolve, delay * 1000));
    }
  }
  throw new Error('unreachable');
}

async function main() {
  assertConfig(TARGET_LOCALE);
  if (!existsSync(SOURCE_ROOT)) {
    throw new Error(`Missing source directory: ${SOURCE_ROOT}`);
  }

  const files = await walkJsonFiles(SOURCE_ROOT);
  const strings = new Set<string>();

  for (const file of files) {
    collectStrings(JSON.parse(await readFile(file, 'utf8')), strings);
  }

  const entries = [...strings].sort((a, b) => a.localeCompare(b));
  const translations = new Map<string, string>();

  console.log(
    `[translate-openapi-json] files=${files.length}, uniqueStrings=${entries.length}, locale=${TARGET_LOCALE}, model=${OPENAI_MODEL}`
  );

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const translated = await translateBatch(TARGET_LOCALE, batch);
    batch.forEach((item, index) => translations.set(item, translated[index]));
    console.log(
      `[translate-openapi-json] translated ${Math.min(i + BATCH_SIZE, entries.length)}/${entries.length}`
    );
  }

  for (const file of files) {
    const source = JSON.parse(await readFile(file, 'utf8'));
    const translated = applyTranslations(source, translations);
    const rel = path.relative(SOURCE_ROOT, file);
    const outPath = path.join(OUT_ROOT, TARGET_LOCALE, rel);
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, `${JSON.stringify(translated, null, 2)}\n`, 'utf8');
  }

  console.log(
    `[translate-openapi-json] wrote ${files.length} files to ${path.join(OUT_ROOT, TARGET_LOCALE)}`
  );
}

main().catch((error) => {
  console.error('[translate-openapi-json] failed:', error);
  process.exit(1);
});
