import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolsPath = path.resolve(__dirname, '../src/lib/tools.ts');

// Read tools.ts and extract the tools array (simple regex, works for your file)
const content = fs.readFileSync(toolsPath, 'utf8');
const match = content.match(/export const tools: Tool\[\] = (\[[\s\S]*\]);/);
if (!match) throw new Error('Could not find tools array');
const tools = eval(match[1]);

const result = {};
for (const tool of tools) {
  result[tool.slug] = {
    title: tool.name,
    metaTitle: tool.metaTitle,
    metaDescription: tool.metaDescription,
    icon: tool.icon,
    howTo: tool.howTo,
    faq: tool.faq,
    relatedTools: tool.relatedTools,
  };
}

const outPath = path.resolve(__dirname, '../public/locales/en/tools.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
console.log('✅ tools.json generated successfully!');