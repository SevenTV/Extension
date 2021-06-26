# SevenTV
A third-party emote extension for Twitch

### Features

* 200 free emote slots per channel
* Support for wide emotes, animated emotes and animated wide emotes
* Greater creative support for emote artists
* WEBP Compression (Super-light file sizes!)
* Less opinionated, free and open-source
* Adding or removing emotes in chat updates instantly for everyone
* Integrates and supports other popular emote extensions

### Yeah but this is a third party thing and idk

7TV is a less opinionated emote extension for Twitch, offering more creative freedom for emote artists and many extra features. This project was originally started as a personal work experience project, as a reaction to the unfair removal of certain emotes by the developers of other extensions but has since become a fully maintained service.

Currently this project is made up of 3 components

1. An API/Server to deliver service
1. A browser extension to view emotes
1. A [web app](https://7tv.app/) to manage emotes

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

1. Download the latest build from the [releases page]()
1. Unzip the archive into a new folder
1. Go to the URL [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox) in the browser
1. Click the button "Load Temporary Add-on..."
1. In the folder previously created from the archive, select the manifest.json file
1. The extension should now be enabled

#### Chatterino

Download the [Chatterino7 fork](https://github.com/SevenTV/chatterino7). 7TV is not a part of the official Chatterino2 release at this time.

### Building

Pre-requisites:
- NPM / Node.JS installed

1. Clone this repo with submodule: `git clone git@github.com:SevenTV/SevenTV.git --recursive`
1. Run `npm install`
1. Build the project using `npm run build` or `npm run build-production`
1. Built files will be in the `dist/` folder

### Future plans

* Self-hosted servers
* More features beyond just chat emotes
* Support other streaming platforms such as a YouTube
