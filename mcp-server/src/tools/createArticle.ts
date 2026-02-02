import * as fs from 'fs';
import * as path from 'path';
import { createArticle as createArticleApi } from '../../../dist/create-article.js';
import type { FieldValue } from '../../../dist/create-article.js';

const ARTICLES_COPY_TO = 'ARTICLES_COPY_TO';
const ARTICLES_REPO_ROOT = 'ARTICLES_REPO_ROOT';

export interface CreateArticleParams {
  type: 'blog' | 'project';
  name: string;
  frontmatterOverrides?: Record<string, unknown>;
}

export interface CreateArticleResult {
  createdPath: string;
  copiedTo?: string;
  error?: string;
}

/**
 * Normalize frontmatter overrides from tool input (plain objects) to FieldValue.
 */
function normalizeOverrides(
  raw: Record<string, unknown> | undefined
): Record<string, FieldValue> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: Record<string, FieldValue> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string') {
      out[key] = value;
    } else if (Array.isArray(value)) {
      const first = value[0];
      if (first !== null && typeof first === 'object' && 'text' in first && 'url' in first) {
        out[key] = value as Array<{ text: string; url: string }>;
      } else {
        out[key] = value.map(String);
      }
    } else {
      out[key] = String(value);
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Copy a file to the ARTICLES_COPY_TO directory. Creates the directory if needed.
 */
function copyToDestination(sourcePath: string): string {
  const copyTo = process.env[ARTICLES_COPY_TO];
  if (!copyTo || typeof copyTo !== 'string' || !copyTo.trim()) {
    throw new Error('ARTICLES_COPY_TO is not set');
  }
  const destDir = path.resolve(copyTo.trim());
  const basename = path.basename(sourcePath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  const destPath = path.join(destDir, basename);
  fs.copyFileSync(sourcePath, destPath);
  return destPath;
}

/**
 * Execute createArticle tool: create an article and optionally copy to ARTICLES_COPY_TO.
 */
function getArticlesRepoRoot(): string {
  if (process.env[ARTICLES_REPO_ROOT]) {
    return path.resolve(process.env[ARTICLES_REPO_ROOT]);
  }
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), '..'),
    path.resolve(process.cwd(), '..', '..'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'BLOG.md')) && fs.existsSync(path.join(dir, 'PROJECT.md'))) {
      return dir;
    }
  }
  return process.cwd();
}

export function executeCreateArticle(params: CreateArticleParams): CreateArticleResult {
  const repoRoot = getArticlesRepoRoot();

  const frontmatterOverrides = normalizeOverrides(params.frontmatterOverrides);

  const createdPath = createArticleApi({
    type: params.type,
    name: params.name,
    cwd: repoRoot,
    frontmatterOverrides,
  });

  let copiedTo: string | undefined;
  if (process.env[ARTICLES_COPY_TO]) {
    try {
      copiedTo = copyToDestination(createdPath);
    } catch (err) {
      return {
        createdPath,
        error: `Article created at ${createdPath} but copy to ARTICLES_COPY_TO failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  return { createdPath, copiedTo };
}
