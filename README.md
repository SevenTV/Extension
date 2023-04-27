# 7TV Web Extension v3

This is a complete rewrite of the [Web Extension](https://github.com/seventv/seventv) for 7TV.

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

#### Working Locally (Windows)
If you're using Windows, there are some additional steps you'll need to take before you can build and run the extension. Here's what you need to do:

Execute Powershell as administrator.

Run the following command: `wsl --install`

After restarting, open your Linux shell and run the following commands:

-   `sudo apt-get install gcc g++ make`
-   `curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -`
-   `sudo apt-get install -y nodejs`
-   `curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor | sudo tee /usr/share/keyrings/yarnkey.gpg >/dev/null`
-   `echo "deb [signed-by=/usr/share/keyrings/yarnkey.gpg] https://dl.yarnpkg.com/debian stable main" | sudo tee /etc/apt/sources.list.d/yarn.list`
-   `sudo apt-get update && sudo apt-get install yarn`

Now that you have the dependencies installed, you can get the extension to work locally by following these steps:

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