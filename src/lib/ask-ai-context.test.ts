import assert from 'node:assert/strict';
import test from 'node:test';
import { createDocsSystemPrompt, resolveDocsLanguage } from './ask-ai-context';

test('resolves docs language from explicit lang before referer', () => {
  assert.equal(
    resolveDocsLanguage({
      explicitLang: 'ru',
      referer: 'https://docs.example.com/zh/docs/management/auth',
    }),
    'ru'
  );
});

test('resolves docs language from referer path', () => {
  assert.equal(
    resolveDocsLanguage({
      referer: 'https://docs.example.com/ja/docs/ai-model/chat/openai',
    }),
    'ja'
  );
});

test('falls back to default docs language for unsupported language', () => {
  assert.equal(
    resolveDocsLanguage({
      explicitLang: 'de',
      referer: 'https://docs.example.com/es/docs',
    }),
    'en'
  );
});

test('creates system prompt containing the full docs corpus', () => {
  const corpus = '# Full Documentation\n\nThe complete docs corpus.';
  const prompt = createDocsSystemPrompt('zh', corpus);

  assert.equal(prompt.role, 'system');
  assert.match(prompt.content, /Lychee AI Docs assistant/);
  assert.match(prompt.content, /language: zh/);
  assert.match(prompt.content, /# Full Documentation/);
  assert.match(prompt.content, /The complete docs corpus\./);
});
