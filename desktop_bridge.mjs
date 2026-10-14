export const isDesktop = () => Boolean(globalThis.__TAURI__?.core);
export async function copyText(text) {
  if (isDesktop()) return globalThis.__TAURI__.core.invoke('copy_text', { text });
  return navigator.clipboard.writeText(text);
}
export async function saveText(filename, text, mime = 'text/plain;charset=utf-8') {
  if (isDesktop()) return globalThis.__TAURI__.core.invoke('save_text', { filename, text });
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
export async function readProfile() {
  return globalThis.__TAURI__.core.invoke('load_profile');
}
