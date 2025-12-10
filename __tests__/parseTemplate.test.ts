import * as fs from 'fs';
import * as path from 'path';
import { parseTemplate } from '../create-article';

describe('parseTemplate', () => {
  const testTemplateDir = path.join(__dirname, 'fixtures');
  const testTemplatePath = path.join(testTemplateDir, 'test-template.md');

  beforeAll(() => {
    // Create test fixtures directory
    if (!fs.existsSync(testTemplateDir)) {
      fs.mkdirSync(testTemplateDir, { recursive: true });
    }

    // Create a test template file
    const templateContent = `---
# [BLOG] Required fields:
title: "Test Article"
date: 2025-01-01
author: Test Author

# [BLOG] Optional fields:
excerpt: "Test excerpt"
---

# Test Article

Body content here.
`;
    fs.writeFileSync(testTemplatePath, templateContent, 'utf-8');
  });

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(testTemplatePath)) {
      fs.unlinkSync(testTemplatePath);
    }
  });

  it('should parse template file correctly', () => {
    const result = parseTemplate(testTemplatePath);
    
    expect(result).toHaveProperty('frontmatter');
    expect(result).toHaveProperty('body');
    expect(result).toHaveProperty('fields');
    expect(result).toHaveProperty('defaults');
    
    expect(result.body.trim()).toBe('# Test Article\n\nBody content here.');
    expect(result.fields.length).toBeGreaterThan(0);
  });

  it('should extract frontmatter correctly', () => {
    const result = parseTemplate(testTemplatePath);
    expect(result.frontmatter).toContain('title: "Test Article"');
    expect(result.frontmatter).toContain('date: 2025-01-01');
  });

  it('should parse field definitions', () => {
    const result = parseTemplate(testTemplatePath);
    const titleField = result.fields.find(f => f.name === 'title');
    expect(titleField).toBeDefined();
    expect(titleField?.required).toBe(true);
  });

  it('should extract defaults from YAML', () => {
    const result = parseTemplate(testTemplatePath);
    expect(result.defaults).toHaveProperty('title');
    expect(result.defaults.title).toBe('Test Article');
  });

  it('should throw error when file does not exist', () => {
    expect(() => parseTemplate('/nonexistent/file.md')).toThrow(
      'Template file not found: /nonexistent/file.md'
    );
  });

  it('should handle template with no defaults', () => {
    const noDefaultsPath = path.join(testTemplateDir, 'no-defaults.md');
    const templateContent = `---
# [BLOG] Required fields:
title: <TITLE>
date: <DATE>
---

Body
`;
    fs.writeFileSync(noDefaultsPath, templateContent, 'utf-8');
    
    try {
      const result = parseTemplate(noDefaultsPath);
      expect(result.defaults).toEqual({});
    } finally {
      if (fs.existsSync(noDefaultsPath)) {
        fs.unlinkSync(noDefaultsPath);
      }
    }
  });
});
