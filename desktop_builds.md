# Name Everything Better V2 Desktop Apps

The V2 desktop apps package the same Movies and Captions, Art and profile editor as the website. Naming works offline. Windows, Linux and macOS share the JavaScript naming engine. Previous V1 Mac downloads remain available.

## Downloads

Installers are published on the [V2 release page](https://github.com/MichaelBrandonFalk/NameEverythingBetter/releases/tag/desktop-v2.2.0).

- Windows 10/11, 64-bit: download the setup.exe installer. It installs Microsoft WebView2 if needed; this first-time runtime installation may require an internet connection.
- Linux Mint 21/22, 64-bit: download the .deb package and open it with the package installer. Alternatively, run `sudo apt install ./Name.Everything.Better.V2_2_2.2.0_amd64.deb` from the folder containing the download. This installs the required GTK/WebKit packages.
- Linux portable option: download the .AppImage, allow executing it in Properties > Permissions, and launch it. Mint may need libfuse2 and libwebkit2gtk-4.1-0 installed. If the AppImage will not launch, use the DEB package.
- macOS: download the .dmg. The V2 app has a separate versioned name from the older Mac app.

These packages are not code-signed or notarized. Windows and macOS may show their normal publisher checks. Installation should follow your organization's policy. Build verification does not replace a hands-on test on your own Windows or Mint system.

## Profiles

Use Advanced Settings to make an editable profile, add types, change recipes and save. Export and import profiles to move them between platforms. See [naming_profiles.md](naming_profiles.md).

Copy actions use the native clipboard. CSV and profile exports open the system Save dialog. Profile imports open the system file picker. No file processing or naming service is required.

## Build from source

The native wrapper uses [Tauri v2](https://v2.tauri.app/start/prerequisites/). Install its platform prerequisites, Rust and Node.js, then:

```bash
cd desktop
npm ci
npm run build
```

The prepare-site step copies a small, explicit list of frontend files into desktop/site. It does not package the workspace or old app downloads. Installers are written into desktop/src-tauri/target/release/bundle.

GitHub Actions builds each platform natively through .github/workflows/desktop.yml. A manual workflow run creates draft release assets for verification. Published versions should get a new release tag and version rather than replacing old assets.

The app stores profiles under Tauri's local webview storage for com.nameeverythingbetter.desktop. The stable application identifier preserves profiles across V2 updates.

## V2.1 episode workflows

V2.1 adds Vertical Episodes in both Movies and Captions and PathMaker. Episode Selection supports manual ranges/lists with an explicitly entered house number per episode, or Excel/CSV upload using a task-specific template. Batch outputs download as real Excel workbooks. PathMaker includes the full S3 destination for every horizontal and vertical file. Earlier desktop releases remain available under their original release tags.

## V2.2 profile rules export

V2.2 adds Export This Profile's Rules As Text Document in Advanced Settings. It creates a readable .txt guide for the selected saved standard or custom profile. Native apps use the system Save dialog. JSON profile export/import remains available separately.
