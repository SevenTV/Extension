# 7TV Web Extension v3

This is a complete rewrite of the [Web Extension](https://github.com/seventv/seventv) for 7TV.

### Building

Before you can start building the extension, you'll need to make sure you have some necessary tools installed on your system. You'll need Node.js, which you can download from the [official website](https://nodejs.org/en/), and you'll also need the Yarn package manager, which you can install globally by running `npm install --global yarn`.

- On Linux, run `make deps` to install dependencies, then `make production` to build the extension.
- On Windows, run `yarn` to install dependencies, then `yarn build:prod` to build the extension.

For a development/nightly (non-stable) build, set `BRANCH=nightly` in your environment variables.

After the build process is complete, the compiled extension will be located in the `dist/` directory. You can load this directory as an unpacked extension through your browser's extension settings to test it out.
 
### Contributing

This extension is configured to work with HMR (Hot Module Replacement), which makes development significantly faster and more enjoyable than the traditional methods for making web extensions. This allows the developer to see changes reflect in real-time, even while on a remote website.

#### Working Locally

We use [Vite](https://vitejs.dev/) as a primary tool for development and bundling.

Getting the extension to work locally is fast and easy, follow these steps:

##### Linux

- Clone the repo: `git clone git@github.com:SevenTV/Extension.git`
- Install dependencies: run `make deps`.
- Run `yarn start` to start the development server.

##### Windows

- Clone the repo: `git clone git@github.com:SevenTV/Extension.git`
- Install dependencies: run `yarn`. You may also need to install the node package `win-node-env` globally with `npm install -g win-node-env`.
- Run `yarn start` to start the development server. 
You may also need to allow PowerShell scripts to run by setting the execution policy to unrestricted with the command `Set-ExecutionPolicy Unrestricted`.

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

### License

This project is released under the [Commons Clause](https://commonsclause.com/) License Condition v1.0, which restricts the sale of the software, but allows for free use, modification, and distribution.

Please review the [LICENSE.md](LICENSE.md) file for more information.