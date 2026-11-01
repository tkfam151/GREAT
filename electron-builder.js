// electron-builder configuration for the Mac DMG and the Windows installer.
//
// macOS signing:
//   - With an Apple "Developer ID Application" certificate (CSC_LINK + CSC_KEY_PASSWORD) and notarization
//     credentials (APPLE_ID + APPLE_APP_SPECIFIC_PASSWORD + APPLE_TEAM_ID), the app is properly signed and
//     notarized, so it opens on any Mac without warnings.
//   - Without them, the app is ad-hoc signed. It runs fine, but macOS quarantines it after download; the DMG
//     includes "How to open Blockhaven.txt" explaining the one-time step.
const hasDeveloperId = !!process.env.CSC_LINK;

module.exports = {
  appId: 'com.blockhaven.game',
  productName: 'Blockhaven',
  copyright: 'Copyright © 2026 Blockhaven',
  directories: { buildResources: 'build', output: 'dist' },
  files: ['electron/**', 'app/**', 'package.json'],

  mac: {
    category: 'public.app-category.games',
    icon: 'build/icon.png',
    target: [{ target: 'dmg', arch: ['universal'] }],
    // Notarization requires the hardened runtime; ad-hoc builds run without it.
    hardenedRuntime: hasDeveloperId,
    ...(hasDeveloperId ? {} : { identity: '-' }),
  },
  dmg: {
    title: 'Blockhaven ${version}',
    artifactName: 'Blockhaven-${version}-mac.dmg',
    window: { width: 560, height: 420 },
    contents: [
      { x: 140, y: 170, type: 'file' },
      { x: 420, y: 170, type: 'link', path: '/Applications' },
      ...(hasDeveloperId ? [] : [{ x: 280, y: 320, type: 'file', path: 'build/How to open Blockhaven.txt' }]),
    ],
  },

  win: {
    icon: 'build/icon.png',
    target: [{ target: 'nsis', arch: ['x64'] }],
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Blockhaven',
    artifactName: 'Blockhaven-Setup-${version}.exe',
  },

  linux: { icon: 'build/icon.png', target: ['AppImage'], category: 'Game' },
};
