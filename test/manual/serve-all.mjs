import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.resolve(__dirname, '../../bin/cli.mjs');

const cases = [
    { name: 'Case A — flat folder (localesPath)', dir: 'case-a-flat', port: 4501 },
    { name: 'Case B — per-language folders (languages)', dir: 'case-b-language-folders', port: 4502 },
    { name: 'Case C — per-namespace folders (namespacesPath)', dir: 'case-c-namespace-folders', port: 4503 },
];

const children = cases.map(({ name, dir, port }) => {
    const cwd = path.join(__dirname, dir);
    const child = spawn('node', [cliPath], {
        cwd,
        env: { ...process.env, MAVIX_PORT: String(port), MAVIX_NO_OPEN: '1' },
        stdio: 'inherit',
    });
    return { name, port, child };
});

const shutdown = () => {
    for (const { child } of children) child.kill();
    landing.close();
    process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const landingPage = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Mavix — manual test cases</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 640px; margin: 60px auto; color: #1e293b; }
    h1 { font-size: 20px; }
    a { display: block; padding: 16px 20px; margin: 10px 0; border-radius: 12px; background: #f1f5f9;
        color: #4338ca; text-decoration: none; font-weight: 600; }
    a:hover { background: #e0e7ff; }
    small { color: #64748b; font-weight: 400; display: block; margin-top: 4px; }
  </style>
</head>
<body>
  <h1>Mavix — pick a manual test case</h1>
  ${cases.map(({ name, port }) => `
  <a href="http://localhost:${port}" target="_blank">
    ${name}
    <small>http://localhost:${port}</small>
  </a>`).join('')}
</body>
</html>`;

const landing = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(landingPage);
});

landing.listen(4500, () => {
    console.log('\x1b[32m✔ Landing page: http://localhost:4500\x1b[0m');
    for (const { name, port } of cases) {
        console.log(`  → ${name}: http://localhost:${port}`);
    }
    console.log('\nPress Ctrl+C to stop all servers.');
});
