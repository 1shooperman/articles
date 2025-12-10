#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as yaml from 'js-yaml';

interface FieldInfo {
  name: string;
  required: boolean;
  type: 'string' | 'array' | 'object';
}

interface TemplateData {
  frontmatter: string;
  body: string;
  fields: FieldInfo[];
}

interface CollectedData {
  [key: string]: any;
}

// Parse command line arguments
function parseArgs(): { type?: string; name?: string } {
  const args = process.argv.slice(2);
  const result: { type?: string; name?: string } = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--type' || args[i] === '-T') {
      result.type = args[++i];
    } else if (args[i] === '--name' || args[i] === '-N') {
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
    if (normalized === 'blog' || normalized === 'project') {
      return normalized as 'blog' | 'project';
    }
    console.error(`Invalid type: ${providedType}. Must be 'blog' or 'project'.`);
    process.exit(1);
  }

  console.log('\nSelect template type:');
  console.log('1. Blog');
  console.log('2. Project');
  
  while (true) {
    const answer = await question(rl, 'Enter choice (1 or 2): ');
    if (answer === '1') {
      return 'blog';
    } else if (answer === '2') {
      return 'project';
    } else {
      console.log('Invalid choice. Please enter 1 or 2.');
    }
  }
}

// Get filename (prompt if not provided)
async function getFilename(rl: readline.Interface, providedName?: string): Promise<string> {
  if (providedName) {
    return providedName;
  }

  const answer = await question(rl, 'Enter filename (without .md extension): ');
  if (!answer.trim()) {
    console.error('Filename cannot be empty.');
    process.exit(1);
  }
  return answer.trim();
}

// Read and parse template file
function parseTemplate(templatePath: string): TemplateData {
  if (!fs.existsSync(templatePath)) {
    console.error(`Template file not found: ${templatePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(templatePath, 'utf-8');
  const lines = content.split('\n');
  
  // Find the first --- delimiter
  let firstDelimiter = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      firstDelimiter = i;
      break;
    }
  }

  if (firstDelimiter === -1) {
    console.error('Template file does not contain frontmatter delimiters (---)');
    process.exit(1);
  }

  // Find the second --- delimiter
  let secondDelimiter = -1;
  for (let i = firstDelimiter + 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      secondDelimiter = i;
      break;
    }
  }

  if (secondDelimiter === -1) {
    console.error('Template file does not contain closing frontmatter delimiter (---)');
    process.exit(1);
  }

  // Extract frontmatter and body
  const frontmatterLines = lines.slice(firstDelimiter + 1, secondDelimiter);
  const frontmatter = frontmatterLines.join('\n');
  const body = lines.slice(secondDelimiter + 1).join('\n');

  // Parse fields from frontmatter comments
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
      
      // Determine field type by looking at the structure
      let fieldType: 'string' | 'array' | 'object' = 'string';
      
      // Check if next non-empty line starts with dash (array indicator)
      for (let j = i + 1; j < frontmatterLines.length; j++) {
        const nextLine = frontmatterLines[j].trim();
        if (nextLine === '') continue;
        if (nextLine.startsWith('#')) break; // Hit next section or comment
        if (nextLine.startsWith('-')) {
          // Check if it's an object array (links have text: and url:)
          if (nextLine.includes('text:') && nextLine.includes('url:')) {
            fieldType = 'object';
          } else {
            fieldType = 'array';
          }
        }
        break; // Only check the first non-empty line
      }

      // Special case: links is always an object array
      if (fieldName === 'links') {
        fieldType = 'object';
      }

      fields.push({
        name: fieldName,
        required: isRequired,
        type: fieldType,
      });
    }
  }

  return { frontmatter, body, fields };
}

// Prompt for a field value
async function promptForField(
  rl: readline.Interface,
  field: FieldInfo,
  collectedData: CollectedData
): Promise<void> {
  let promptText = `${field.name}${field.required ? ' (required)' : ' (optional, press Enter to skip)'}: `;
  
  if (field.type === 'array') {
    promptText = `${field.name}${field.required ? ' (required)' : ' (optional, press Enter to skip)'} - comma-separated values: `;
  } else if (field.type === 'object' && field.name === 'links') {
    promptText = `${field.name}${field.required ? ' (required)' : ' (optional, press Enter to skip)'} - format: "text:url,text:url": `;
  }

  const answer = await question(rl, promptText);
  const trimmed = answer.trim();

  if (!trimmed) {
    if (field.required) {
      console.log('This field is required. Please provide a value.');
      return promptForField(rl, field, collectedData);
    }
    return; // Skip optional fields
  }

  if (field.type === 'array') {
    collectedData[field.name] = trimmed.split(',').map(item => item.trim()).filter(item => item);
  } else if (field.type === 'object' && field.name === 'links') {
    // Parse links format: "text:url,text:url"
    const pairs = trimmed.split(',').map(pair => pair.trim());
    collectedData[field.name] = pairs.map(pair => {
      const [text, url] = pair.split(':').map(s => s.trim());
      return { text, url };
    }).filter(link => link.text && link.url);
  } else {
    collectedData[field.name] = trimmed;
  }
}

// Format collected data as YAML frontmatter
function formatFrontmatter(data: CollectedData): string {
  // Auto-generate date if not present
  if (!data.date) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    data.date = `${year}-${month}-${day}`;
  }

  return yaml.dump(data, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  }).trim();
}

// Generate filename with collision detection
function generateFilename(baseName: string, articlesDir: string): string {
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
  const args = parseArgs();
  const rl = createInterface();

  try {
    // Get template type
    const templateType = await getTemplateType(rl, args.type);
    const templateFile = templateType === 'blog' ? 'BLOG.md' : 'PROJECT.md';
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
      await promptForField(rl, field, collectedData);
    }
    
    // Ensure date is set (will be auto-generated in formatFrontmatter if missing)

    // Prompt for optional fields
    const optionalFields = template.fields.filter(f => !f.required);
    for (const field of optionalFields) {
      await promptForField(rl, field, collectedData);
    }

    // Format frontmatter
    const frontmatter = formatFrontmatter(collectedData);

    // Write file
    const articlesDir = path.join(process.cwd(), 'articles');
    writeArticle(articlesDir, filename, frontmatter, template.body);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run main
main();

