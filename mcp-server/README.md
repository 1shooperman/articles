# Articles MCP Server

MCP server that exposes a single tool, **createArticle**, equivalent to `npm run create` with headless inputs. Supports **stdio** and **Streamable HTTP** transports.

## Tool: createArticle

- **Parameters**
  - `type` (required): `"blog"` or `"project"`
  - `name` (required): filename without `.md` (sanitized automatically)
  - `frontmatterOverrides` (optional): object of frontmatter field overrides (e.g. `title`, `excerpt`, `author` for blog; `description`, `features`, `technologies`, `links` for project)
- **Behavior**: Creates an article in the articles repo’s `articles/` directory. If `ARTICLES_COPY_TO` is set, copies the file to that directory.

## Environment variables

| Variable | Description |
|--------|-------------|
| `ARTICLES_REPO_ROOT` | Absolute path to the articles repo (templates and `articles/` dir). If unset, the server looks for `BLOG.md` / `PROJECT.md` in `cwd`, `cwd/..`, or `cwd/../..`. |
| `ARTICLES_COPY_TO` | Optional. Absolute path to a directory; each created article is copied here (same filename). Use in Cursor’s MCP server `env` to copy into “the local project I’m working from.” |
| `ARTICLES_MCP_PORT` | Port for the Streamable HTTP server (default: 3000). |

## Build

From the **repo root** (articles):

```bash
npm run build:mcp
```

This runs `npm run build` (emits `dist/create-article.js`) and then builds `mcp-server` into `mcp-server/dist/`.

## Run

From the **repo root** so that templates and `articles/` resolve:

```bash
# Stdio (for Cursor / Claude Desktop)
node mcp-server/dist/stdio.js

# Streamable HTTP (bind 127.0.0.1)
ARTICLES_MCP_PORT=3000 node mcp-server/dist/sse.js
```

## Cursor setup

1. **Settings > Features > MCP > Add server**
2. Choose **stdio**
3. **Command:** `node`
4. **Args:** `["/absolute/path/to/articles/mcp-server/dist/stdio.js"]`
5. (Optional) **Env:**  
   - `ARTICLES_REPO_ROOT=/absolute/path/to/articles` if the server is not run from that directory  
   - `ARTICLES_COPY_TO=/absolute/path/to/your/project/content/posts` to copy each created article there

Use an absolute path for the server so it works regardless of the current workspace.
