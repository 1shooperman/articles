# Articles

A command-line tool for creating structured markdown articles from templates. This repository manages a corpus of articles with support for blog posts and project documentation.

## Features

- **Template-based article creation** - Create articles from predefined templates (blog or project)
- **Interactive prompts** - Guided workflow for filling in article metadata
- **Default values** - Templates can include default values that are automatically used
- **YAML frontmatter** - Articles include structured metadata in YAML format
- **Automatic date generation** - Dates are automatically generated if not provided
- **Filename collision detection** - Automatically handles filename conflicts

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

## Usage

### Interactive Mode

Run the script without arguments for an interactive experience:

```bash
npm run create
```

Or directly:

```bash
tsx create-article.ts
```

The script will:
1. Prompt you to select a template type (blog or project)
2. Ask for a filename
3. Guide you through required fields
4. Prompt for optional fields
5. Create the article in the `articles/` directory

### Command Line Arguments

You can also provide arguments to skip some prompts:

```bash
# Specify template type
npm run create -- --type blog
npm run create -- --type project

# Specify template type and filename
npm run create -- --type blog --name my-article
npm run create -- -T project -N my-project
```

**Arguments:**
- `--type` or `-T`: Template type (`blog` or `project`)
- `--name` or `-N`: Filename (without `.md` extension)

## Template Types

### Blog Template

The blog template includes:
- **Required fields:**
  - `title`: Blog post title
  - `date`: Publication date (auto-generated if not provided)
  - `excerpt`: Brief summary
  - `author`: Author name (defaults to "Brandon Shoop")

- **Optional fields:**
  - `dateModified`: Last modified date

### Project Template

The project template includes:
- **Required fields:**
  - `title`: Project title
  - `date`: Publication date
  - `description`: Brief project description

- **Optional fields:**
  - `features`: Array of feature descriptions
  - `technologies`: Array of technologies used
  - `links`: Array of links (e.g., App Store, GitHub) with text and URL
  - `applicationCategory`: Type of application
  - `operatingSystem`: Target operating system(s)

## Default Values

Templates can include default values in their frontmatter. When you press Enter without providing a value:

- **Required fields:** The default value will be used automatically
- **Optional fields:** The default value will be used if available, otherwise the field is skipped

Default values are displayed in prompts like: `title (required) [default: Your Default Title]:`

## Project Structure

```
articles/
├── articles/          # Generated articles are stored here
├── BLOG.md           # Blog post template
├── PROJECT.md        # Project documentation template
├── create-article.ts # Main script
└── package.json      # Dependencies and scripts
```

## Template Format

Templates use markdown with YAML frontmatter. The frontmatter includes:

- Section headers: `# [TYPE] Required fields:` and `# [TYPE] Optional fields:`
- Field definitions with example values
- Default values that can be used automatically

Example template structure:

```yaml
---
# [BLOG] Required fields:
title: "Your Blog Post Title"
date: <DATE>
excerpt: "A brief summary"
author: <AUTHOR>

# [BLOG] Optional fields:
# dateModified: "2025-01-02"
---
```

## Output

Articles are saved in the `articles/` directory with:
- Filename based on your input (sanitized for filesystem compatibility)
- YAML frontmatter with all provided metadata
- Template body content
- Automatic date generation in `YYYY-MM-DD` format

If a file with the same name already exists, a timestamp suffix is added to prevent overwriting.

## Author

Brandon Shoop

## License

MIT
