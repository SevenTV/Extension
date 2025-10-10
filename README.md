<p align="center">
  <a href="https://7tv.app">
    <picture>
      <img src="public/icon/icon-128.png" height="128">
    </picture>
    <h1 align="center">7TV Web Extension</h1>
  </a>
</p>

<p align="center">
  <a aria-label="Chrome web store stable" href="https://chrome.google.com/webstore/detail/7tv/ammjkodgmmoknidbanneddgankgfejfh">
    <img src="https://img.shields.io/chrome-web-store/v/ammjkodgmmoknidbanneddgankgfejfh?label=Chrome%20Web%20Store%20Stable&style=for-the-badge">
  </a>
  <a aria-label="Rating" href="https://chrome.google.com/webstore/detail/7tv/ammjkodgmmoknidbanneddgankgfejfh/reviews">
    <img src="https://img.shields.io/chrome-web-store/rating/ammjkodgmmoknidbanneddgankgfejfh?style=for-the-badge">
  </a>
  <a aria-label="Users" href="https://chrome.google.com/webstore/detail/7tv/ammjkodgmmoknidbanneddgankgfejfh">
    <img src="https://img.shields.io/chrome-web-store/users/ammjkodgmmoknidbanneddgankgfejfh?style=for-the-badge">
  </a>
</p>

<p align="center">
  <a aria-label="Chrome web store nightly" href="https://chrome.google.com/webstore/detail/7tv/fphegifdehlodcepfkgofelcenelpedj">
    <img src="https://img.shields.io/chrome-web-store/v/fphegifdehlodcepfkgofelcenelpedj?label=Chrome%20Web%20Store%20Nightly&style=for-the-badge">
  </a>
  <a aria-label="Rating" href="https://chrome.google.com/webstore/detail/7tv/fphegifdehlodcepfkgofelcenelpedj/reviews">
    <img src="https://img.shields.io/chrome-web-store/rating/fphegifdehlodcepfkgofelcenelpedj?style=for-the-badge">
  </a>
  <a aria-label="Users" href="https://chrome.google.com/webstore/detail/7tv/fphegifdehlodcepfkgofelcenelpedj">
    <img src="https://img.shields.io/chrome-web-store/users/fphegifdehlodcepfkgofelcenelpedj?style=for-the-badge">
  </a>
</p>

<p align="center">
  <a aria-label="GitHub release" href="https://github.com/SevenTV/Extension/releases">
    <img src="https://img.shields.io/github/v/release/SevenTV/Extension?style=for-the-badge">
  </a>
  <a aria-label="GitHub contributors" href="https://github.com/SevenTV/Extension/graphs/contributors">
    <img src="https://img.shields.io/github/contributors/SevenTV/Extension?style=for-the-badge">
  </a>
  <a aria-label="GitHub issues" href="https://github.com/SevenTV/Extension/issues">
    <img src="https://img.shields.io/github/issues/SevenTV/Extension?style=for-the-badge">
  </a>
  <a aria-label="GitHub pull requests" href="https://github.com/SevenTV/Extension/pulls">
    <img src="https://img.shields.io/github/issues-pr/SevenTV/Extension?style=for-the-badge">
  </a>
</p>

## Development

# Building

* `make deps`  
* `make production`  

For a development/nightly (non-stable) build, set `BRANCH=nightly` in your environment variables.

Build output is located in `dist/`.

# Contributing

This extension is configured to work with **HMR (Hot Module Replacement)**, which makes development significantly faster and more enjoyable than traditional methods for building web extensions.  
This allows developers to see changes in real-time, even while testing on a remote website.

# Working Locally

We use **Vite** as the primary tool for development and bundling.

Getting the extension to work locally is fast and easy. Follow these steps:

## 1. Clone the repository
```
git clone git@github.com:SevenTV/Extension.git
```

## 2. Install dependencies
```
make deps
```

## 3. Run the development server
```
yarn start
```

The extension will now be compiled into its initial bundle, which may take up to twenty seconds.  
In dev mode, it connects to the Vite server automatically after the bundle is complete.

To run in dev mode:
```
yarn dev
```

The build files will be located in the `dist/` folder.  
Load this folder as an **unpacked extension** via the Chrome extensions page.

## Build for production
```
yarn build:prod
```

## To build nightly
```
export BRANCH=nightly
yarn build:prod
```

# Building for Chrome Extension Store

To build for the Chrome Extension Store:

```
yarn install
yarn build:prod
```

Zip the `/dist` folder and upload it to the Chrome Extension Store for the appropriate version (either **stable** or **nightly**).

# Building for Mozilla Add-Ons Store

To build for the Mozilla Add-Ons Store:

```
yarn install
```

## Stable Branch (Windows)
```
set MOZILLA_ID="moz-addon@7tv.app" && set MV2=1 && yarn build:prod
```

## Stable Branch (Linux/Other OS)
```
export MOZILLA_ID="moz-addon@7tv.app" && export MV2=1 && yarn build:prod
```

## Nightly Branch (Windows)
```
set BRANCH=nightly && set MOZILLA_ID="moz-addon@7tv.app" && set MV2=1 && yarn build:prod
```

## Nightly Branch (Linux/Other OS)
```
export BRANCH=nightly && export MOZILLA_ID="moz-addon@7tv.app" && export MV2=1 && yarn build:prod
```

Then, submit the contents of the `/dist` folder as a `.zip` or `.xpi` to the Mozilla Add-Ons Store.

# Extension Loader

This repository is a **Browser Extension** using a `manifest.json` and the **Extension API** to run inside browsers.

The site-specific content and logic run as a **Site Script**, organized under `src/sites` by origin.  
The **Extension Content Script** (`src/content/content.ts`) acts as a Loader for the site script — where most logic for modifying websites resides.

We do **not** use Isolated Worlds since we need access to internal values from websites, which is not possible under a content script’s isolated environment.

# Extension Background / Service Worker

The background script sets up extension API listeners for permissions and other browser-specific operations.  
It also manages cross-site settings synchronization by maintaining a copy of **IndexedDB** inside the extension context and redistributing updated configuration nodes to sites.

# Site Script

Most of the logic inside the Extension runs under the **Site Script**, located in `src/sites`.  
Each folder corresponds to an origin (e.g. `twitch.tv`, `youtube.com`).

A modular system organizes features neatly into separate files.  
The Site Script supports **HMR (Hot Module Replacement)** — allowing UI components and logic to update instantly while developing.

