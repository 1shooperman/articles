import * as http from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';

const PORT = Number(process.env.ARTICLES_MCP_PORT) || 3000;
const HOST = '127.0.0.1';

async function main() {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });
  await server.connect(transport);

  const httpServer = http.createServer(async (req, res) => {
    await transport.handleRequest(req, res);
  });

  httpServer.listen(PORT, HOST, () => {
    process.stderr.write(`Articles MCP Server (Streamable HTTP) listening on http://${HOST}:${PORT}\n`);
  });
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
