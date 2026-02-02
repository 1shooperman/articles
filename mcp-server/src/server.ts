import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { executeCreateArticle } from './tools/createArticle.js';

const createArticleInputSchema = z.object({
  type: z.enum(['blog', 'project']).describe('Template type: blog or project'),
  name: z.string().min(1).describe('Filename without .md (will be sanitized)'),
  frontmatterOverrides: z
    .record(
      z.union([
        z.string(),
        z.array(z.string()),
        z.array(z.object({ text: z.string(), url: z.string() })),
      ])
    )
    .optional()
    .describe(
      'Optional frontmatter overrides. Keys: title, excerpt, author, date, dateModified (blog); title, date, description, features, technologies, links, applicationCategory, operatingSystem (project).'
    ),
});

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'articles',
    version: '1.0.0',
  });

  server.registerTool(
    'createArticle',
    {
      description:
        'Create a new article from a blog or project template. Equivalent to npm run create with headless inputs. If ARTICLES_COPY_TO is set, copies the generated file to that directory.',
      inputSchema: createArticleInputSchema,
    },
    async (args) => {
      const parsed = createArticleInputSchema.safeParse(args);
      if (!parsed.success) {
        return {
          content: [{ type: 'text', text: `Invalid arguments: ${parsed.error.message}` }],
          isError: true,
        };
      }
      try {
        const result = executeCreateArticle({
          type: parsed.data.type,
          name: parsed.data.name,
          frontmatterOverrides: parsed.data.frontmatterOverrides,
        });
        let text = `Article created: ${result.createdPath}`;
        if (result.copiedTo) {
          text += `\nCopied to: ${result.copiedTo}`;
        }
        if (result.error) {
          text += `\nWarning: ${result.error}`;
        }
        return {
          content: [{ type: 'text', text }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: message }],
          isError: true,
        };
      }
    }
  );

  return server;
}

export function createStdioTransport(): StdioServerTransport {
  return new StdioServerTransport();
}
