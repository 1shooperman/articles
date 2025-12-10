import { parseFieldDefinitions } from '../create-article';

describe('parseFieldDefinitions', () => {
  it('should parse required fields', () => {
    const lines = [
      '# [BLOG] Required fields:',
      'title: "My Article"',
      'date: 2025-01-01',
      'author: John Doe'
    ];
    const result = parseFieldDefinitions(lines);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ name: 'title', required: true, type: 'string' });
    expect(result[1]).toEqual({ name: 'date', required: true, type: 'string' });
    expect(result[2]).toEqual({ name: 'author', required: true, type: 'string' });
  });

  it('should parse optional fields', () => {
    const lines = [
      '# [BLOG] Optional fields:',
      'excerpt: "Summary"',
      'dateModified: 2025-01-02'
    ];
    const result = parseFieldDefinitions(lines);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: 'excerpt', required: false, type: 'string' });
    expect(result[1]).toEqual({ name: 'dateModified', required: false, type: 'string' });
  });

  it('should parse both required and optional fields', () => {
    const lines = [
      '# [BLOG] Required fields:',
      'title: "My Article"',
      'date: 2025-01-01',
      '',
      '# [BLOG] Optional fields:',
      'excerpt: "Summary"'
    ];
    const result = parseFieldDefinitions(lines);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ name: 'title', required: true, type: 'string' });
    expect(result[1]).toEqual({ name: 'date', required: true, type: 'string' });
    expect(result[2]).toEqual({ name: 'excerpt', required: false, type: 'string' });
  });

  it('should parse array fields', () => {
    const lines = [
      '# [PROJECT] Optional fields:',
      'technologies:',
      '  - React',
      '  - TypeScript'
    ];
    const result = parseFieldDefinitions(lines);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: 'technologies', required: false, type: 'array' });
  });

  it('should parse object fields (links)', () => {
    const lines = [
      '# [PROJECT] Optional fields:',
      'links:',
      '  - text: GitHub',
      '    url: https://github.com'
    ];
    const result = parseFieldDefinitions(lines);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: 'links', required: false, type: 'object' });
  });

  it('should skip comment lines', () => {
    const lines = [
      '# [BLOG] Required fields:',
      '# This is a comment',
      'title: "My Article"',
      '# Another comment',
      'date: 2025-01-01'
    ];
    const result = parseFieldDefinitions(lines);
    expect(result).toHaveLength(2);
  });

  it('should skip empty lines', () => {
    const lines = [
      '# [BLOG] Required fields:',
      '',
      'title: "My Article"',
      '',
      'date: 2025-01-01',
      ''
    ];
    const result = parseFieldDefinitions(lines);
    expect(result).toHaveLength(2);
  });

  it('should return empty array when no fields found', () => {
    const lines = ['# [BLOG] Required fields:', '# Just comments'];
    const result = parseFieldDefinitions(lines);
    expect(result).toHaveLength(0);
  });

  it('should ignore fields outside sections', () => {
    const lines = [
      'title: "My Article"',
      '# [BLOG] Required fields:',
      'date: 2025-01-01'
    ];
    const result = parseFieldDefinitions(lines);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('date');
  });
});
