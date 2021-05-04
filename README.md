# SevenTV
A third-party emote extension for Twitch

### Features

* Hundreds of emote slots
* Support for wide emotes, animated emotes and animated wide emotes
* Support for self-hosted emote servers
* No more emote censorship PagMan

### Yeah but this is a third party thing and idk

7TV is a less opinionated emote extension for Twitch, offering more creative freedom for emote artists and decentralization capabilities. This project was originally started as a reaction to the unfair removal of certain emotes by the developers of other extensions.

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

#### Mozilla Firefox (Manual Install)

1. Download the latest build from the [releases page]()
1. Unzip the archive into a new folder
1. Go to the URL [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox) in the browser
1. Click the button "Load Temporary Add-on..."
1. In the folder previously created from the archive, select the manifest.json file
1. The extension should now be enabled

#### Chatterino

Chatterino support for 7TV is coming soon. It will be available through our own [fork of chatterino](https://github.com/SevenTV/chatterino7) for updates

### How to host your own server / change your channel's server

To automatically import emotes from a custom server, add this tag into your [Twitch Profile Bio](https://dashboard.twitch.tv/u/settings/channel#profile-settings):

`EmoteServer=<url to your server>`

If this is correct and the server is online, the extension will automatically connect to it. Otherwise it'll connect to the default server instead.

#### Hosting your own server

This guide outlines how to set up a simple single-node emote server

###### Pre-requisites

* A Amazon S3 bucket (or from a different service which supports AWS S3 API, such as DigitalOcean Spaces)
* A Redis Instance (for scaling and data consistency purposes)
* A MongoDB Database

Guide is coming soon.

### Contributing

Contributions to this project are welcome

#### Browser Extension

#### API

#### Web App
