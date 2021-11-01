# SevenTV
An emote extension for Twitch and YouTube

### Features

* 200 free emote slots per channel
* Support for wide emotes, animated emotes and animated wide emotes
* Greater creative support for emote artists
* Better customization with features such as emote aliases
* WEBP Compression (Super-light file sizes!)
* Less opinionated, free and open-source
* Adding or removing emotes in chat updates instantly for everyone
* Integrates and supports other popular emote extensions

### What is 7TV?

7TV is a less opinionated emote extension for Twitch and YouTube, offering more creative freedom for emote artists and many extra features.

### Installation (Browser Extension)

The browser extension is currently available on Chromium-based browsers (Google Chrome, Brave, etc) and Mozilla Firefox

#### Chromium / Google Chrome - (Chrome Web Store)

[Download here](https://chrome.google.com/webstore/detail/7tv/ammjkodgmmoknidbanneddgankgfejfh)

#### Chromium / Google Chrome (Manual Install)
1. Download the latest build from the [releases page](https://github.com/SevenTV/SevenTV/releases)
1. Unzip the archive
1. Go into the browser's [extensions page](brave://extensions/)
1. Enable "Developer mode" (top right)
1. Click "Load unpacked" and select the "7tv-extension" folder
1. The extension should now be enabled

#### Mozilla Firefox (Firefox Add-Ons)

[Download here](https://addons.mozilla.org/en-US/firefox/addon/7tv/)

#### Mozilla Firefox (Manual Install)

1. Download the latest build from the [releases page](https://github.com/SevenTV/SevenTV/releases)
1. Unzip the archive into a new folder
1. Go to the URL [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox) in the browser
1. Click the button "Load Temporary Add-on..."
1. In the folder previously created from the archive, select the manifest.json file
1. The extension should now be enabled

#### Chatterino

Download the [Chatterino7 fork](https://github.com/SevenTV/chatterino7). 7TV is not a part of the official Chatterino2 release at this time.

### Contributing

You can contribute to this repository by cloning and making a pull request.

### Building

Pre-requisites:
- NPM / Node.JS installed

1. Clone this repo with submodule: `git clone git@github.com:SevenTV/SevenTV.git --recursive`
2. Run `yarn`
3. Build the project using `yarn build` (dev) or `yarn build-prod-chromium` / `yarn build-prod-firefox` (prod)
4. Built files will be in the `dist/` folder
