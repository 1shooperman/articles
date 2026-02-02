import { createServer, createStdioTransport } from './server.js';

async function main() {
  const server = createServer();
  const transport = createStdioTransport();
  await server.connect(transport);
  process.stderr.write('Articles MCP Server running on stdio\n');
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
