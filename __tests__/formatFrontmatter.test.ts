import { formatFrontmatter } from '../create-article';

describe('formatFrontmatter', () => {
  it('should format simple data as YAML', () => {
    const data = { title: 'Test Article', author: 'John Doe' };
    const result = formatFrontmatter(data);
    
    expect(result).toContain('title:');
    expect(result).toContain('author:');
  });

  it('should auto-generate date if not present', () => {
    const data = { title: 'Test Article' };
    const result = formatFrontmatter(data);
    
    expect(result).toMatch(/date: \d{4}-\d{2}-\d{2}/);
  });

  it('should use provided date if present', () => {
    const data = { title: 'Test Article', date: '2025-01-15' };
    const result = formatFrontmatter(data);
    
    expect(result).toContain('date: "2025-01-15"');
  });

  it('should format array fields', () => {
    const data = { 
      title: 'Test',
      tags: ['react', 'typescript']
    };
    const result = formatFrontmatter(data);
    
    expect(result).toContain('tags:');
  });

  it('should format object fields', () => {
    const data = {
      title: 'Test',
      links: [
        { text: 'GitHub', url: 'https://github.com' }
      ]
    };
    const result = formatFrontmatter(data);
    
    expect(result).toContain('links:');
  });

  it('should not mutate original data', () => {
    const data = { title: 'Test Article' };
    const originalDate = data.date;
    formatFrontmatter(data);
    
    expect(data.date).toBe(originalDate);
  });

  it('should handle empty data object', () => {
    const data = {};
    const result = formatFrontmatter(data);
    
    expect(result).toMatch(/date: \d{4}-\d{2}-\d{2}/);
  });

  it('should format multiline strings correctly', () => {
    const data = {
      title: 'Test Article',
      excerpt: 'A long excerpt that might span multiple lines in the output'
    };
    const result = formatFrontmatter(data);
    
    expect(result).toContain('excerpt:');
  });
});
