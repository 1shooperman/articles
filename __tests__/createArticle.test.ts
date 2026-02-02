import * as fs from 'fs';
import * as path from 'path';
import { createArticle } from '../create-article';

describe('createArticle', () => {
  const cwd = process.cwd();
  const articlesDir = path.join(cwd, 'articles');

  afterEach(() => {
    // Clean up test articles (match pattern from tests)
    if (fs.existsSync(articlesDir)) {
      const entries = fs.readdirSync(articlesDir);
      for (const name of entries) {
        if (name.startsWith('jest-test-') && name.endsWith('.md')) {
          fs.unlinkSync(path.join(articlesDir, name));
        }
      }
    }
  });

  it('creates a blog article and returns absolute path', () => {
    const result = createArticle({
      type: 'blog',
      name: 'jest-test-blog',
      cwd,
    });
    expect(path.isAbsolute(result)).toBe(true);
    expect(result).toContain('articles');
    expect(result).toMatch(/jest-test-blog.*\.md$/);
    expect(fs.existsSync(result)).toBe(true);
    const content = fs.readFileSync(result, 'utf-8');
    expect(content).toContain('---');
    expect(content).toContain('title:');
    expect(content).toContain('date:');
    expect(content).toContain('---');
  });

  it('creates a project article with correct template body', () => {
    const result = createArticle({
      type: 'project',
      name: 'jest-test-project',
      cwd,
    });
    expect(fs.existsSync(result)).toBe(true);
    const content = fs.readFileSync(result, 'utf-8');
    expect(content).toContain('## Overview');
  });

  it('applies frontmatterOverrides', () => {
    const result = createArticle({
      type: 'blog',
      name: 'jest-test-overrides',
      cwd,
      frontmatterOverrides: {
        title: 'Custom Title From Test',
        excerpt: 'Custom excerpt',
      },
    });
    const content = fs.readFileSync(result, 'utf-8');
    expect(content).toContain('Custom Title From Test');
    expect(content).toContain('Custom excerpt');
  });

  it('throws on invalid type', () => {
    expect(() =>
      createArticle({ type: 'invalid' as 'blog', name: 'x', cwd })
    ).toThrow(/Invalid type/);
  });

  it('throws on empty name after sanitization', () => {
    expect(() =>
      createArticle({ type: 'blog', name: '', cwd })
    ).toThrow(/Filename cannot be empty/);
  });

  it('sanitizes filename', () => {
    const result = createArticle({
      type: 'blog',
      name: 'jest-test<>:"/\\|?*',
      cwd,
    });
    expect(result).not.toContain('<>');
    expect(result).toMatch(/jest-test-.*\.md$/);
  });

  it('uses cwd for articles directory', () => {
    const result = createArticle({
      type: 'blog',
      name: 'jest-test-cwd',
      cwd,
    });
    expect(result).toContain(articlesDir);
  });

  it('created file can be copied to another directory (copy logic)', () => {
    const result = createArticle({
      type: 'blog',
      name: 'jest-test-copy',
      cwd,
    });
    const copyToDir = path.join(cwd, 'jest-test-copy-out');
    fs.mkdirSync(copyToDir, { recursive: true });
    const destPath = path.join(copyToDir, path.basename(result));
    fs.copyFileSync(result, destPath);
    expect(fs.existsSync(destPath)).toBe(true);
    const destContent = fs.readFileSync(destPath, 'utf-8');
    expect(destContent).toContain('---');
    fs.unlinkSync(destPath);
    fs.rmdirSync(copyToDir);
  });
});
