import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatWebsiteText,
  getNewApiServerUrl,
  getWebsiteName,
  getWebsiteUrl,
} from './site-config';

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
    formatWebsiteText('__WEBSITE_NAME__ Docs for {websiteName}'),
    'Example Gateway Docs for Example Gateway'
  );
});
