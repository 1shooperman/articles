#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as yaml from 'js-yaml';

// Constants
const TEMPLATE_TYPES = {
  BLOG: 'blog',
  PROJECT: 'project',
} as const;

const TEMPLATE_FILES = {
  BLOG: 'BLOG.md',
  PROJECT: 'PROJECT.md',
} as const;

const ARTICLES_DIR = 'articles';
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*]/g;
const YAML_LINE_WIDTH = 80;
const DEFAULT_AUTHOR = 'Brandon Shoop';

export interface FieldInfo {
  name: string;
  required: boolean;
  type: 'string' | 'array' | 'object';
}

export interface TemplateData {
  frontmatter: string;
  body: string;
  fields: FieldInfo[];
  defaults: Record<string, any>;
}

export interface CollectedData {
  [key: string]: any;
}

// Parse command line arguments
export function parseArgs(): { type?: string; name?: string } {
  const args = process.argv.slice(2);
  const result: { type?: string; name?: string } = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--type' || args[i] === '-T') {
      if (i + 1 >= args.length) {
        throw new Error(`Missing value for ${args[i]}`);
      }
      result.type = args[++i];
    } else if (args[i] === '--name' || args[i] === '-N') {
      if (i + 1 >= args.length) {
        throw new Error(`Missing value for ${args[i]}`);
      }
      result.name = args[++i];
    }
  }

  return result;
}

// Create readline interface for prompts
function createInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// Prompt user for input
function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

// Get template type (interactive menu if not provided)
async function getTemplateType(rl: readline.Interface, providedType?: string): Promise<'blog' | 'project'> {
  if (providedType) {
    const normalized = providedType.toLowerCase();
    if (normalized === TEMPLATE_TYPES.BLOG || normalized === TEMPLATE_TYPES.PROJECT) {
      return normalized as 'blog' | 'project';
    }
    throw new Error(`Invalid type: ${providedType}. Must be 'blog' or 'project'.`);
  }

  console.log('\nSelect template type:');
  console.log('1. Blog');
  console.log('2. Project');
  
  while (true) {
    const answer = await question(rl, 'Enter choice (1 or 2): ');
    if (answer === '1') {
      return TEMPLATE_TYPES.BLOG;
    } else if (answer === '2') {
      return TEMPLATE_TYPES.PROJECT;
    } else {
      console.log('Invalid choice. Please enter 1 or 2.');
    }
  }
}

// Sanitize filename to remove invalid characters
export function sanitizeFilename(filename: string): string {
  return filename.replace(INVALID_FILENAME_CHARS, '-');
}

// Get filename (prompt if not provided)
async function getFilename(rl: readline.Interface, providedName?: string): Promise<string> {
  if (providedName) {
    return sanitizeFilename(providedName);
  }

  const answer = await question(rl, 'Enter filename (without .md extension): ');
  const trimmed = answer.trim();
  if (!trimmed) {
    throw new Error('Filename cannot be empty.');
  }
  return sanitizeFilename(trimmed);
}

// Find frontmatter delimiters in template lines
export function findFrontmatterDelimiters(lines: string[]): { first: number; second: number } {
  let firstDelimiter = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      firstDelimiter = i;
      break;
    }
  }

  if (firstDelimiter === -1) {
    throw new Error('Template file does not contain frontmatter delimiters (---)');
  }

  let secondDelimiter = -1;
  for (let i = firstDelimiter + 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      secondDelimiter = i;
      break;
    }
  }

  if (secondDelimiter === -1) {
    throw new Error('Template file does not contain closing frontmatter delimiter (---)');
  }

  return { first: firstDelimiter, second: secondDelimiter };
}

// Determine field type by examining the structure
export function determineFieldType(fieldName: string, frontmatterLines: string[], startIndex: number): 'string' | 'array' | 'object' {
  // Special case: links is always an object array
  if (fieldName === 'links') {
    return 'object';
  }

  // Check if next non-empty line starts with dash (array indicator)
  for (let j = startIndex + 1; j < frontmatterLines.length; j++) {
    const nextLine = frontmatterLines[j].trim();
    if (nextLine === '') continue;
    if (nextLine.startsWith('#')) break; // Hit next section or comment
    if (nextLine.startsWith('-')) {
      // Check if it's an object array (links have text: and url:)
      if (nextLine.includes('text:') && nextLine.includes('url:')) {
        return 'object';
      } else {
        return 'array';
      }
    }
    break; // Only check the first non-empty line
  }

  return 'string';
}

// Parse field definitions from frontmatter lines
export function parseFieldDefinitions(frontmatterLines: string[]): FieldInfo[] {
  const fields: FieldInfo[] = [];
  let currentSection: 'required' | 'optional' | null = null;

  for (let i = 0; i < frontmatterLines.length; i++) {
    const line = frontmatterLines[i];
    
    // Check for section headers
    if (line.includes('# [') && line.includes('] Required fields:')) {
      currentSection = 'required';
      continue;
    }
    if (line.includes('# [') && line.includes('] Optional fields:')) {
      currentSection = 'optional';
      continue;
    }

    // Skip comment lines (lines starting with #)
    if (line.trim().startsWith('#')) {
      continue;
    }

    // Skip empty lines
    if (line.trim() === '') {
      continue;
    }

    // Parse field definitions - look for field name followed by colon
    const fieldMatch = line.match(/^(\s*)(\w+):/);
    if (fieldMatch && currentSection) {
      const fieldName = fieldMatch[2];
      const isRequired = currentSection === 'required';
      const fieldType = determineFieldType(fieldName, frontmatterLines, i);

      fields.push({
        name: fieldName,
        required: isRequired,
        type: fieldType,
      });
    }
  }

  return fields;
}

// Read and parse template file
export function parseTemplate(templatePath: string): TemplateData {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file not found: ${templatePath}`);
  }

  const content = fs.readFileSync(templatePath, 'utf-8');
  const lines = content.split('\n');
  
  const { first, second } = findFrontmatterDelimiters(lines);

  // Extract frontmatter and body
  const frontmatterLines = lines.slice(first + 1, second);
  const frontmatter = frontmatterLines.join('\n');
  const body = lines.slice(second + 1).join('\n');

  // Parse fields from frontmatter comments
  const fields = parseFieldDefinitions(frontmatterLines);

  // Extract default values from template frontmatter YAML
  // Filter out comment lines and section headers to get clean YAML
  const cleanFrontmatterLines = frontmatterLines
    .filter(line => {
      const trimmed = line.trim();
      // Skip section headers
      if (trimmed.startsWith('# [')) return false;
      // Skip pure comment lines (but keep commented-out fields that might be defaults)
      if (trimmed === '' || trimmed.match(/^#\s*$/)) return false;
      // Keep everything else (including lines that might have inline comments)
      return true;
    })
    .join('\n');
  
  let defaults: Record<string, any> = {};
  try {
    defaults = yaml.load(cleanFrontmatterLines) as Record<string, any> || {};
  } catch (error) {
    // If YAML parsing fails, defaults will remain empty
    // This is okay as defaults are optional
    console.warn(`Warning: Could not parse defaults from template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { frontmatter, body, fields, defaults };
}

// Prompt for a field value
async function promptForField(
  rl: readline.Interface,
  field: FieldInfo,
  collectedData: CollectedData,
  defaults: Record<string, any>,
  authorDefault: string = DEFAULT_AUTHOR
): Promise<void> {
  // Determine default value for this field
  let defaultValue: string | undefined;
  let defaultValueRaw: any = undefined;
  
  if (field.name === 'author') {
    defaultValue = authorDefault;
    defaultValueRaw = authorDefault;
  } else if (defaults[field.name] !== undefined) {
    defaultValueRaw = defaults[field.name];
    // Handle different types appropriately for display
    if (field.type === 'array') {
      if (Array.isArray(defaultValueRaw)) {
        defaultValue = defaultValueRaw.join(', ');
      } else {
        defaultValue = String(defaultValueRaw);
      }
    } else if (field.type === 'object' && field.name === 'links') {
      if (Array.isArray(defaultValueRaw)) {
        defaultValue = defaultValueRaw.map((link: any) => `${link.text}:${link.url}`).join(', ');
      } else {
        defaultValue = String(defaultValueRaw);
      }
    } else {
      defaultValue = String(defaultValueRaw);
    }
  }

  let promptText = `${field.name}${field.required ? ' (required)' : ' (optional, press Enter to skip)'}`;
  if (defaultValue) {
    promptText += ` [default: ${defaultValue}]`;
  }
  
  if (field.type === 'array') {
    promptText += ' - comma-separated values: ';
  } else if (field.type === 'object' && field.name === 'links') {
    promptText += ' - format: "text:url,text:url": ';
  } else {
    promptText += ': ';
  }

  const answer = await question(rl, promptText);
  const trimmed = answer.trim();

  if (!trimmed) {
    if (field.required) {
      // Use default if available for required fields
      if (defaultValueRaw !== undefined) {
        if (field.type === 'array') {
          if (Array.isArray(defaultValueRaw)) {
            collectedData[field.name] = defaultValueRaw;
          } else {
            collectedData[field.name] = String(defaultValueRaw).split(',').map(item => item.trim()).filter(item => item);
          }
        } else if (field.type === 'object' && field.name === 'links') {
          if (Array.isArray(defaultValueRaw)) {
            collectedData[field.name] = defaultValueRaw;
          } else {
            // Fallback: try to parse as string if not already an array
            collectedData[field.name] = [];
          }
        } else {
          collectedData[field.name] = defaultValueRaw;
        }
        return;
      }
      console.log('This field is required. Please provide a value.');
      return promptForField(rl, field, collectedData, defaults, authorDefault);
    } else {
      // For optional fields, use default if available
      if (defaultValueRaw !== undefined) {
        if (field.type === 'array') {
          if (Array.isArray(defaultValueRaw)) {
            collectedData[field.name] = defaultValueRaw;
          } else {
            collectedData[field.name] = String(defaultValueRaw).split(',').map(item => item.trim()).filter(item => item);
          }
        } else if (field.type === 'object' && field.name === 'links') {
          if (Array.isArray(defaultValueRaw)) {
            collectedData[field.name] = defaultValueRaw;
          } else {
            collectedData[field.name] = [];
          }
        } else {
          collectedData[field.name] = defaultValueRaw;
        }
      }
      return; // Skip optional fields
    }
  }

  if (field.type === 'array') {
    collectedData[field.name] = trimmed.split(',').map(item => item.trim()).filter(item => item);
  } else if (field.type === 'object' && field.name === 'links') {
    // Parse links format: "text:url,text:url"
    // Use indexOf to handle URLs with colons (e.g., https://example.com)
    const pairs = trimmed.split(',').map(pair => pair.trim());
    collectedData[field.name] = pairs.map(pair => {
      const colonIndex = pair.indexOf(':');
      if (colonIndex === -1) {
        return null;
      }
      const text = pair.slice(0, colonIndex).trim();
      const url = pair.slice(colonIndex + 1).trim();
      return { text, url };
    }).filter((link): link is { text: string; url: string } => link !== null && link.text !== '' && link.url !== '');
  } else {
    collectedData[field.name] = trimmed;
  }
}

// Generate date string in YYYY-MM-DD format
export function generateDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format collected data as YAML frontmatter
export function formatFrontmatter(data: CollectedData): string {
  // Create a copy to avoid mutating the original
  const dataCopy = { ...data };
  
  // Auto-generate date if not present
  if (!dataCopy.date) {
    dataCopy.date = generateDateString();
  }

  return yaml.dump(dataCopy, {
    lineWidth: YAML_LINE_WIDTH,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  }).trim();
}

// Generate filename with collision detection
export function generateFilename(baseName: string, articlesDir: string): string {
  let filename = baseName.endsWith('.md') ? baseName : `${baseName}.md`;
  let fullPath = path.join(articlesDir, filename);

  if (fs.existsSync(fullPath)) {
    const epoch = Math.floor(Date.now() / 1000);
    const nameWithoutExt = baseName.replace(/\.md$/, '');
    filename = `${nameWithoutExt}-${epoch}.md`;
    fullPath = path.join(articlesDir, filename);
    console.warn(`Warning: File already exists. Using filename: ${filename}`);
  }

  return filename;
}

// Write the article file
function writeArticle(
  articlesDir: string,
  filename: string,
  frontmatter: string,
  body: string
): void {
  if (!fs.existsSync(articlesDir)) {
    fs.mkdirSync(articlesDir, { recursive: true });
  }

  const finalFilename = generateFilename(filename, articlesDir);
  const fullPath = path.join(articlesDir, finalFilename);
  const content = `---\n${frontmatter}\n---\n${body}`;

  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log(`\nArticle created: ${fullPath}`);
}

// Main function
async function main() {
  let rl: readline.Interface | null = null;

  // Handle graceful shutdown on SIGINT (Ctrl+C)
  const cleanup = () => {
    if (rl) {
      rl.close();
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  try {
    const args = parseArgs();
    rl = createInterface();

    // Get template type
    const templateType = await getTemplateType(rl, args.type);
    const templateFile = templateType === TEMPLATE_TYPES.BLOG ? TEMPLATE_FILES.BLOG : TEMPLATE_FILES.PROJECT;
    const templatePath = path.join(process.cwd(), templateFile);

    // Get filename
    const filename = await getFilename(rl, args.name);

    // Parse template
    const template = parseTemplate(templatePath);

    // Collect data
    const collectedData: CollectedData = {};

    // Prompt for required fields first (skip date as it's auto-generated)
    const requiredFields = template.fields.filter(f => f.required && f.name !== 'date');
    for (const field of requiredFields) {
      await promptForField(rl, field, collectedData, template.defaults, DEFAULT_AUTHOR);
    }
    
    // Ensure date is set (will be auto-generated in formatFrontmatter if missing)

    // Prompt for optional fields
    const optionalFields = template.fields.filter(f => !f.required);
    for (const field of optionalFields) {
      await promptForField(rl, field, collectedData, template.defaults, DEFAULT_AUTHOR);
    }

    // Format frontmatter
    const frontmatter = formatFrontmatter(collectedData);

    // Write file
    const articlesDir = path.join(process.cwd(), ARTICLES_DIR);
    writeArticle(articlesDir, filename, frontmatter, template.body);

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    if (rl) {
      rl.close();
    }
  }
}

// Run main
main();

