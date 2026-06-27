import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import test from 'node:test';
import { remark } from 'remark';
import { visit } from 'unist-util-visit';
import {
  formatWebsiteText,
  getNewApiServerUrl,
  getWebsiteName,
  getWebsiteUrl,
} from './site-config';
import { formatPageTree } from './page-tree-format';

const markdownSafePlaceholder = '((WEBSITE_NAME))';

test('reads website identity from environment variables', () => {
  process.env.NEXT_PUBLIC_WEBSITE_NAME = '  Example Gateway  ';
  process.env.NEXT_PUBLIC_WEBSITE_URL = 'https://www.example.com/';
  process.env.DEFAULT_NEWAPI_SERVER_URL = 'https://api.example.com/';

  assert.equal(getWebsiteName(), 'Example Gateway');
  assert.equal(getWebsiteUrl(), 'https://www.example.com');
  assert.equal(getNewApiServerUrl(), 'https://api.example.com');
});

test('requires absolute http urls for configured links', () => {
  process.env.NEXT_PUBLIC_WEBSITE_URL = 'example.com';

  assert.throws(
    () => getWebsiteUrl(),
    /NEXT_PUBLIC_WEBSITE_URL must be an absolute http\(s\) URL/
  );
});

test('formats site-owned display text with the configured website name', () => {
  process.env.NEXT_PUBLIC_WEBSITE_NAME = 'Example Gateway';

  assert.equal(
    formatWebsiteText('((WEBSITE_NAME)) Docs for {websiteName}'),
    'Example Gateway Docs for Example Gateway'
  );
  assert.equal(
    formatWebsiteText('%%WEBSITE_NAME%% Docs'),
    'Example Gateway Docs'
  );
  assert.equal(
    formatWebsiteText('__WEBSITE_NAME__ Docs'),
    'Example Gateway Docs'
  );
});

test('uses a markdown-safe website name placeholder', () => {
  const tree = remark().parse(markdownSafePlaceholder);
  const textValues: string[] = [];

  visit(tree, 'text', (node) => {
    textValues.push(node.value);
  });

  assert.deepEqual(textValues, [markdownSafePlaceholder]);
});

test('formats website placeholders in page tree metadata', () => {
  process.env.NEXT_PUBLIC_WEBSITE_NAME = 'Example Gateway';

  const tree = formatPageTree({
    name: 'Docs',
    description: '((WEBSITE_NAME)) Complete API Documentation',
    children: [
      {
        name: '((WEBSITE_NAME)) Integration',
        description: 'Uses %%WEBSITE_NAME%% and __WEBSITE_NAME__',
      },
    ],
  });

  assert.deepEqual(tree, {
    name: 'Docs',
    description: 'Example Gateway Complete API Documentation',
    children: [
      {
        name: 'Example Gateway Integration',
        description: 'Uses Example Gateway and Example Gateway',
      },
    ],
  });
});

test('uses MDX components instead of website placeholders in document bodies', () => {
  const mdxFiles = globSync('content/docs/**/*.mdx');
  const leakingFiles: string[] = [];
  const missingImports: string[] = [];

  for (const file of mdxFiles) {
    const source = readFileSync(file, 'utf8');
    const body = source.replace(/^---\n[\s\S]*?\n---\n?/, '');

    if (body.includes(markdownSafePlaceholder)) {
      leakingFiles.push(file);
    }

    if (
      body.includes('<WebsiteName />') &&
      !source.includes("import { WebsiteName } from '@/components/website-name';")
    ) {
      missingImports.push(file);
    }
  }

  assert.deepEqual(leakingFiles, []);
  assert.deepEqual(missingImports, []);
});
