import { parseArgs } from '../create-article';

describe('parseArgs', () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
  });

  it('should return empty object when no arguments provided', () => {
    process.argv = ['node', 'script'];
    expect(parseArgs()).toEqual({});
  });

  it('should parse --type argument', () => {
    process.argv = ['node', 'script', '--type', 'blog'];
    expect(parseArgs()).toEqual({ type: 'blog' });
  });

  it('should parse -T argument', () => {
    process.argv = ['node', 'script', '-T', 'project'];
    expect(parseArgs()).toEqual({ type: 'project' });
  });

  it('should parse --name argument', () => {
    process.argv = ['node', 'script', '--name', 'my-article'];
    expect(parseArgs()).toEqual({ name: 'my-article' });
  });

  it('should parse -N argument', () => {
    process.argv = ['node', 'script', '-N', 'my-article'];
    expect(parseArgs()).toEqual({ name: 'my-article' });
  });

  it('should parse both type and name', () => {
    process.argv = ['node', 'script', '--type', 'blog', '--name', 'my-article'];
    expect(parseArgs()).toEqual({ type: 'blog', name: 'my-article' });
  });

  it('should throw error when --type has no value', () => {
    process.argv = ['node', 'script', '--type'];
    expect(() => parseArgs()).toThrow('Missing value for --type');
  });

  it('should throw error when -T has no value', () => {
    process.argv = ['node', 'script', '-T'];
    expect(() => parseArgs()).toThrow('Missing value for -T');
  });

  it('should throw error when --name has no value', () => {
    process.argv = ['node', 'script', '--name'];
    expect(() => parseArgs()).toThrow('Missing value for --name');
  });

  it('should throw error when -N has no value', () => {
    process.argv = ['node', 'script', '-N'];
    expect(() => parseArgs()).toThrow('Missing value for -N');
  });

  it('should ignore unknown arguments', () => {
    process.argv = ['node', 'script', '--unknown', 'value', '--type', 'blog'];
    expect(parseArgs()).toEqual({ type: 'blog' });
  });

  it('should parse --headless argument', () => {
    process.argv = ['node', 'script', '--headless'];
    expect(parseArgs()).toEqual({ headless: true });
  });

  it('should parse -H argument', () => {
    process.argv = ['node', 'script', '-H'];
    expect(parseArgs()).toEqual({ headless: true });
  });

  it('should parse headless with other arguments', () => {
    process.argv = ['node', 'script', '--headless', '--type', 'blog', '--name', 'my-article'];
    expect(parseArgs()).toEqual({ headless: true, type: 'blog', name: 'my-article' });
  });

  it('should parse -H with other arguments', () => {
    process.argv = ['node', 'script', '-H', '-T', 'project', '-N', 'test'];
    expect(parseArgs()).toEqual({ headless: true, type: 'project', name: 'test' });
  });
});
