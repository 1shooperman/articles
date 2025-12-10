import { sanitizeFilename } from '../create-article';

describe('sanitizeFilename', () => {
  it('should return filename unchanged when no invalid characters', () => {
    expect(sanitizeFilename('my-article')).toBe('my-article');
    expect(sanitizeFilename('article_name')).toBe('article_name');
    expect(sanitizeFilename('article123')).toBe('article123');
  });

  it('should replace invalid characters with dash', () => {
    expect(sanitizeFilename('my<article>')).toBe('my-article-');
    expect(sanitizeFilename('article:name')).toBe('article-name');
    expect(sanitizeFilename('article/name')).toBe('article-name');
    expect(sanitizeFilename('article\\name')).toBe('article-name');
    expect(sanitizeFilename('article|name')).toBe('article-name');
    expect(sanitizeFilename('article?name')).toBe('article-name');
    expect(sanitizeFilename('article*name')).toBe('article-name');
    expect(sanitizeFilename('article"name')).toBe('article-name');
  });

  it('should handle multiple invalid characters', () => {
    expect(sanitizeFilename('my<article>:name')).toBe('my-article-name');
    expect(sanitizeFilename('article/name\\test')).toBe('article-name-test');
  });

  it('should handle edge cases', () => {
    expect(sanitizeFilename('')).toBe('');
    expect(sanitizeFilename('<>:"/\\|?*')).toBe('-');
  });
});
