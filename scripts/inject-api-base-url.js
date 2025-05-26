import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const apiBaseUrl = process.env.API_BASE_URL;
if (!apiBaseUrl) {
  process.exit(0);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(__dirname, '..', 'dist', 'public', 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error(`index.html not found at ${indexPath}`);
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');
const snippet = '<script>window.API_BASE_URL = "<%= process.env.API_BASE_URL %>";</script>';

let output;
if (html.includes('</head>')) {
  output = html.replace('</head>', `  ${snippet}\n</head>`);
} else {
  output = `${snippet}\n${html}`;
}

fs.writeFileSync(indexPath, output);
console.log('Appended API_BASE_URL placeholder snippet into index.html');
