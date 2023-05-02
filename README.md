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

### Building

-   make deps
-   make production

For a development/nightly (non-stable) build, set `BRANCH=nightly` in your environment variables.

Build output located in `dist/`.

### Contributing

This extension is configured to work with HMR (Hot Module Replacement), which makes development significantly faster and more enjoyable than the traditional methods for making web extensions. This allows the developer to see changes reflect in real-time, even while on a remote website.

#### Working Locally

We use [Vite](https://vitejs.dev/) as a primary tool for development and bundling.

Getting the extension to work locally is fast and easy, follow these steps:

-   Clone the repo: `git clone git@github.com:SevenTV/Extension.git`
-   Install dependencies: `make deps`
-   Run `yarn start`

The extension will now be compiled into its initial bundle, which may take up to twenty seconds. In dev mode, it is configured to connect to the vite server, which will start right after the bundle is complete.

The build files will be located in the `dist/` folder: add this folder as an unpacked extension via the chrome extensions page.

#### Extension Loader

This repository is adapted as a BrowserExtension. It uses a `manifest.json` and the [Extension API](https://developer.chrome.com/docs/extensions/reference/) to run inside a browser.

The site-specific content and logic, however, runs as a Site Script, sectioned off by origin under `src/sites`. The Extension Content Script (`src/content/content.ts`) acts as a Loader for the site script, which is where the actual logic for modifying websites is located.

We do not use Isolated Worlds as we must access internal values from the website, which is not possible under an Extension Isolated World (content script).

#### Extension Background / Service Worker

The background script sets up some extension API-specific listeners for matters such as permissions. It also takes care of cross-site settings synchronization, by maintaining a copy of IndexedDB inside the Extension Context and re-distributing the updated config nodes to sites.

#### Site Script

Most of the logic inside the Extension runs under the Site Script, located under `src/sites`. Each folder there corresponds to an origin, such as `twitch.tv` or `youtube.com`. A module system exists to neatly section off features into their own space.

The site script works with HMR (Hot Module Replacement) and any changes to components within will hot-update accordingly, making UI building very efficient.
