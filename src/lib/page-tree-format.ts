import { formatOptionalWebsiteText, formatWebsiteText } from './site-config';

function formatTreeText(value: unknown) {
  return typeof value === 'string' ? formatWebsiteText(value) : value;
}

export function formatPageTree<T>(tree: T): T {
  if (Array.isArray(tree)) {
    return tree.map((item) => formatPageTree(item)) as T;
  }

  if (!tree || typeof tree !== 'object') {
    return tree;
  }

  const current = tree as Record<string, unknown>;
  const formatted: Record<string, unknown> = { ...current };

  formatted.name = formatTreeText(current.name);
  formatted.description = formatOptionalWebsiteText(
    current.description as string | undefined
  );

  if (Array.isArray(current.children)) {
    formatted.children = current.children.map((child) => formatPageTree(child));
  }

  return formatted as T;
}
