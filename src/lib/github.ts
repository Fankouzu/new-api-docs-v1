import { App, Octokit } from 'octokit';
import type { ActionResponse, Feedback } from '@/components/feedback';

// GitHub repository info
const [owner = 'Fankouzu', repo = 'new-api-docs-v1'] = (
  process.env.SOURCE_REPO || 'Fankouzu/new-api-docs-v1'
).split('/');
export const DocsCategory = 'Docs Feedback'; // GitHub Discussion

let instance: Octokit | undefined;
let initError: Error | undefined;

async function getOctokit(): Promise<Octokit | null> {
  // If we already encountered an error, don't retry
  if (initError) return null;
  if (instance) return instance;

  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !privateKey) {
    console.warn(
      '[GitHub] No GitHub keys provided for Github app, docs feedback feature will not work.'
    );
    initError = new Error('Missing GitHub App credentials');
    return null;
  }

  try {
    const app = new App({
      appId,
      privateKey,
    });

    const { data } = await app.octokit.request(
      'GET /repos/{owner}/{repo}/installation',
      {
        owner,
        repo,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    instance = await app.getInstallationOctokit(data.id);
    return instance;
  } catch (error) {
    console.error('[GitHub] Failed to initialize GitHub App:', error);
    initError = error as Error;
    return null;
  }
}

interface RepositoryInfo {
  id: string;
  discussionCategories: {
    nodes: {
      id: string;
      name: string;
    }[];
  };
}

let cachedDestination: RepositoryInfo | undefined;
async function getFeedbackDestination(): Promise<RepositoryInfo | null> {
  if (cachedDestination) return cachedDestination;
  const octokit = await getOctokit();
  if (!octokit) return null;

  const {
    repository,
  }: {
    repository: RepositoryInfo;
  } = await octokit.graphql(
    `
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      id
      discussionCategories(first: 25) {
        nodes { id name }
      }
    }
  }
`,
    { owner, repo }
  );

  return (cachedDestination = repository);
}

export async function onRateAction(
  url: string,
  feedback: Feedback
): Promise<ActionResponse> {
  'use server';
  const octokit = await getOctokit();
  const destination = await getFeedbackDestination();
  if (!octokit || !destination) {
    console.warn(
      '[GitHub] GitHub integration is not configured, feedback will not be submitted.'
    );
    // Return a placeholder response instead of throwing an error
    return {
      githubUrl: `https://github.com/${owner}/${repo}/discussions`,
    };
  }

  const category = destination.discussionCategories.nodes.find(
    (category) => category.name === DocsCategory
  );

  if (!category) {
    console.warn(
      `[GitHub] Please create a "${DocsCategory}" category in GitHub Discussion`
    );
    return {
      githubUrl: `https://github.com/${owner}/${repo}/discussions`,
    };
  }

  const title = `Feedback for ${url}`;
  const body = `[${feedback.opinion}] ${feedback.message}\n\n> Forwarded from user feedback.`;

  let {
    search: {
      nodes: [discussion],
    },
  }: {
    search: {
      nodes: { id: string; url: string }[];
    };
  } = await octokit.graphql(
    `
          query($query: String!) {
            search(type: DISCUSSION, query: $query, first: 1) {
              nodes {
                ... on Discussion { id, url }
              }
            }
          }`,
    { query: `${title} in:title repo:${owner}/${repo} author:@me` }
  );

  if (discussion) {
    await octokit.graphql(
      `
            mutation($body: String!, $discussionId: ID!) {
              addDiscussionComment(input: { body: $body, discussionId: $discussionId }) {
                comment { id }
              }
            }`,
      { body, discussionId: discussion.id }
    );
  } else {
    const result: {
      createDiscussion: { discussion: { id: string; url: string } };
    } = await octokit.graphql(
      `
            mutation($repositoryId: ID!, $categoryId: ID!, $body: String!, $title: String!) {
              createDiscussion(input: { repositoryId: $repositoryId, categoryId: $categoryId, body: $body, title: $title }) {
                discussion { id, url }
              }
            }`,
      {
        repositoryId: destination.id,
        categoryId: category!.id,
        body,
        title,
      }
    );

    discussion = result.createDiscussion.discussion;
  }

  return {
    githubUrl: discussion.url,
  };
}
