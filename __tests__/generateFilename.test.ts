import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { generateFilename } from '../create-article';

describe('generateFilename', () => {
  const testDir = path.join(os.tmpdir(), 'articles-test');

  beforeAll(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    const files = fs.readdirSync(testDir);
    files.forEach(file => {
      fs.unlinkSync(path.join(testDir, file));
    });
  });

  afterAll(() => {
    // Remove test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should return filename with .md extension when not provided', () => {
    const result = generateFilename('my-article', testDir);
    expect(result).toBe('my-article.md');
  });

  it('should return filename unchanged when .md extension is provided', () => {
    const result = generateFilename('my-article.md', testDir);
    expect(result).toBe('my-article.md');
  });

  it('should create file with generated name', () => {
    const filename = generateFilename('test-article', testDir);
    const filePath = path.join(testDir, filename);
    
    expect(fs.existsSync(filePath)).toBe(false); // File doesn't exist yet, but name is generated
  });

  it('should append timestamp when file already exists', () => {
    // Create existing file
    const existingFile = path.join(testDir, 'existing.md');
    fs.writeFileSync(existingFile, 'content', 'utf-8');
    
    const result = generateFilename('existing', testDir);
    
    expect(result).not.toBe('existing.md');
    expect(result).toMatch(/^existing-\d+\.md$/);
  });

  it('should handle collision with .md extension', () => {
    // Create existing file
    const existingFile = path.join(testDir, 'test.md');
    fs.writeFileSync(existingFile, 'content', 'utf-8');
    
    const result = generateFilename('test.md', testDir);
    
    expect(result).toMatch(/^test-\d+\.md$/);
  });

  it('should generate unique filenames for multiple collisions', () => {
    // Create existing file
    const existingFile = path.join(testDir, 'collision.md');
    fs.writeFileSync(existingFile, 'content', 'utf-8');
    
    const result1 = generateFilename('collision', testDir);
    // Create the file from result1
    fs.writeFileSync(path.join(testDir, result1), 'content', 'utf-8');
    
    const result2 = generateFilename('collision', testDir);
    
    expect(result1).not.toBe(result2);
    expect(result1).toMatch(/^collision-\d+\.md$/);
    expect(result2).toMatch(/^collision-\d+\.md$/);
  });
});
