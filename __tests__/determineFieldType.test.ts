import { determineFieldType } from '../create-article';

describe('determineFieldType', () => {
  it('should return object for links field', () => {
    const lines = ['links:', '  - text: GitHub', '    url: https://github.com'];
    expect(determineFieldType('links', lines, 0)).toBe('object');
  });

  it('should return array for simple array field', () => {
    const lines = ['tags:', '  - react', '  - typescript'];
    expect(determineFieldType('tags', lines, 0)).toBe('array');
  });

  it('should return string for simple field', () => {
    const lines = ['title: My Article'];
    expect(determineFieldType('title', lines, 0)).toBe('string');
  });

  it('should return object for object array with text and url', () => {
    const lines = ['links:', '  - text: App Store', '    url: https://apps.apple.com'];
    expect(determineFieldType('links', lines, 0)).toBe('object');
  });

  it('should return array when dash line contains no text/url', () => {
    const lines = ['features:', '  - Feature 1', '  - Feature 2'];
    expect(determineFieldType('features', lines, 0)).toBe('array');
  });

  it('should return string when no dash follows', () => {
    const lines = ['title: My Article', 'date: 2025-01-01'];
    expect(determineFieldType('title', lines, 0)).toBe('string');
  });

  it('should stop at comment line', () => {
    const lines = ['title: My Article', '# Comment', '  - item'];
    expect(determineFieldType('title', lines, 0)).toBe('string');
  });

  it('should handle empty lines', () => {
    const lines = ['title: My Article', '', '  - item'];
    expect(determineFieldType('title', lines, 0)).toBe('string');
  });
});
