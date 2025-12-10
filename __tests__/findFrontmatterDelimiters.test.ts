import { findFrontmatterDelimiters } from '../create-article';

describe('findFrontmatterDelimiters', () => {
  it('should find delimiters in simple template', () => {
    const lines = ['---', 'title: Test', '---', 'Body content'];
    const result = findFrontmatterDelimiters(lines);
    expect(result).toEqual({ first: 0, second: 2 });
  });

  it('should find delimiters with whitespace', () => {
    const lines = ['  ---  ', 'title: Test', '  ---  ', 'Body'];
    const result = findFrontmatterDelimiters(lines);
    expect(result).toEqual({ first: 0, second: 2 });
  });

  it('should find delimiters with multiple lines in frontmatter', () => {
    const lines = [
      '---',
      'title: Test',
      'date: 2025-01-01',
      'author: John',
      '---',
      'Body content'
    ];
    const result = findFrontmatterDelimiters(lines);
    expect(result).toEqual({ first: 0, second: 4 });
  });

  it('should throw error when no first delimiter found', () => {
    const lines = ['title: Test', 'date: 2025-01-01', 'Body'];
    expect(() => findFrontmatterDelimiters(lines)).toThrow(
      'Template file does not contain frontmatter delimiters (---)'
    );
  });

  it('should throw error when no second delimiter found', () => {
    const lines = ['---', 'title: Test', 'date: 2025-01-01', 'Body'];
    expect(() => findFrontmatterDelimiters(lines)).toThrow(
      'Template file does not contain closing frontmatter delimiter (---)'
    );
  });

  it('should handle empty frontmatter', () => {
    const lines = ['---', '---', 'Body'];
    const result = findFrontmatterDelimiters(lines);
    expect(result).toEqual({ first: 0, second: 1 });
  });
});
