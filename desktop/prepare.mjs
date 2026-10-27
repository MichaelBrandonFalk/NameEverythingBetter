import { mkdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const here = new URL('./', import.meta.url);
const output = new URL('./site/', here);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const files = ['index.html', 'site_logic.mjs', 'neb_core.mjs', 'naming_profiles.mjs', 'profile_settings.mjs', 'profile_rules_text.mjs',
  'desktop_bridge.mjs', 'episode_workflow.mjs', 'spreadsheet_export.mjs', 'spreadsheet_input.mjs', 'vendor/fflate.mjs', 'vendor/fflate.LICENSE', 'conventions.html', 'pathmaker.html', 'pathmaker_logic.mjs', 'neb_pathmaker_core.mjs'];
for (const file of files) {
  await mkdir(new URL('./', new URL(file, output)), { recursive: true });
  await copyFile(new URL(`../${file}`, here), new URL(file, output));
}
for (const file of files.filter((file) => file.endsWith('.html'))) {
  let html = await readFile(new URL(file, output), 'utf8');
  html = html.replace('Browser Edition', 'Desktop Edition V2.2')
    .replaceAll('href="downloads/', 'href="https://michaelbrandonfalk.github.io/NameEverythingBetter/downloads/');
  if (file === 'conventions.html') html = html.replace('</body>', '<script type="module" src="desktop_bridge.mjs"></script></body>');
  await writeFile(new URL(file, output), html);
}
console.log(`Desktop site prepared at ${fileURLToPath(output)}`);
