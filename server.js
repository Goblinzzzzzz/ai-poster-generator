import { createReadStream, existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { createServer } from "node:http";

const port = Number(process.env.PORT || 3000);
const distDir = resolve("dist");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const sendFile = (response, filePath) => {
  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
};

createServer((request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const path = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const filePath = join(distDir, path);

  if (existsSync(filePath) && !filePath.endsWith("/")) {
    sendFile(response, filePath);
    return;
  }

  if (extname(path)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("File not found.");
    return;
  }

  const indexPath = join(distDir, "index.html");
  if (existsSync(indexPath)) {
    sendFile(response, indexPath);
    return;
  }

  response.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Build output is missing. Run `npm run build` first.");
}).listen(port, "0.0.0.0", () => {
  console.log(`AI Poster Generator running on port ${port}`);
});
