import { mkdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const here = new URL('./', import.meta.url);
const output = new URL('./site/', here);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const files = ['index.html', 'site_logic.mjs', 'neb_core.mjs', 'naming_profiles.mjs', 'profile_settings.mjs',
  'desktop_bridge.mjs', 'conventions.html', 'pathmaker.html', 'pathmaker_logic.mjs', 'neb_pathmaker_core.mjs'];
for (const file of files) await copyFile(new URL(`../${file}`, here), new URL(file, output));
let index = await readFile(new URL('index.html', output), 'utf8');
index = index.replace('Browser Edition', 'Desktop Edition V2.0')
  .replace(/href="downloads\/[^"\n]+"/g, 'href="https://github.com/MichaelBrandonFalk/NameEverythingBetter/releases"');
await writeFile(new URL('index.html', output), index);
console.log(`Desktop site prepared at ${fileURLToPath(output)}`);
