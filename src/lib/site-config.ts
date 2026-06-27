function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function requireValue(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`${name} is required for the documentation site.`);
  }

  return value;
}

function requireHttpUrl(name: string, value: string | undefined) {
  const url = requireValue(name, value);

  if (!/^https?:\/\//i.test(url)) {
    throw new Error(
      `${name} must be an absolute http(s) URL, for example: https://example.com`
    );
  }

  return trimTrailingSlash(url);
}

export function getWebsiteName() {
  return requireValue(
    'NEXT_PUBLIC_WEBSITE_NAME',
    process.env.NEXT_PUBLIC_WEBSITE_NAME?.trim()
  );
}

export function getWebsiteUrl() {
  return requireHttpUrl(
    'NEXT_PUBLIC_WEBSITE_URL',
    process.env.NEXT_PUBLIC_WEBSITE_URL?.trim()
  );
}

export function getNewApiServerUrl() {
  return requireHttpUrl(
    'DEFAULT_NEWAPI_SERVER_URL',
    process.env.DEFAULT_NEWAPI_SERVER_URL?.trim()
  );
}

export function formatWebsiteText(value: string) {
  const websiteName = getWebsiteName();

  return value
    .replaceAll('((WEBSITE_NAME))', websiteName)
    .replaceAll('%%WEBSITE_NAME%%', websiteName)
    .replaceAll('__WEBSITE_NAME__', websiteName)
    .replaceAll('{websiteName}', websiteName);
}

export function formatOptionalWebsiteText(value: string | undefined) {
  return typeof value === 'string' ? formatWebsiteText(value) : value;
}
