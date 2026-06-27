import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from 'fumadocs-mdx/config';
import { visit } from 'unist-util-visit';

function remarkWebsiteName() {
  const websiteName = process.env.NEXT_PUBLIC_WEBSITE_NAME?.trim();

  if (!websiteName) {
    return;
  }

  const replaceWebsiteName = (value: string) =>
    value
      .replaceAll('__WEBSITE_NAME__', websiteName)
      .replaceAll('{websiteName}', websiteName);

  return (tree: unknown) => {
    visit(tree as never, (node: { type?: unknown; value?: unknown }) => {
      if (
        node.type === 'code' ||
        node.type === 'inlineCode' ||
        node.type === 'yaml'
      ) {
        return;
      }

      if (typeof node.value === 'string') {
        node.value = replaceWebsiteName(node.value);
      }
    });
  };
}

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  // Enable last modified time from git
  lastModifiedTime: 'git',
  mdxOptions: {
    // MDX options
    remarkPlugins: [remarkWebsiteName],
  },
});
