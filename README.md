# SevenTV

A third-party emote extension for Twitch

### Features

-   Hundreds of emote slots
-   Support for wide and animated emotes
-   Support for self-hosted emote servers
-   No more emote censorship PagMan

### Yeah but this is a third party thing and idk

The main extensions people use for third party emotes have a tendency to remove emotes when users of Reddit and Twitter dislike them. This typically ignores context or intent and wrongly accuses completely inoffensive emotes of being offensive, so this project was started to offer a less opinionated alternative with decentralization capabilities, meaning the owners of the master branch won't easily be able to purge emotes out of existence.

Currently this project is made up of 3 components

1. An API/Server to deliver service
1. A browser extension to view emotes
1. A [web app](https://7tv.app/) to manage emotes

A default server is available out of the box, currently at [7tv.anatole.dev](https://7tv.anatole.dev).

### Installation (Browser Extension)

The browser extension currently isn't available on any stores and must be installed manually

#### Chromium / Google Chrome

1. Download the latest build from the [releases page](https://github.com/SevenTV/SevenTV/releases)
1. Unzip the archive
1. Go into the browser's [extensions page](brave://extensions/)
1. Enable "Developer mode" (top right)
1. Click "Load unpacked" and select the "7tv-extension" folder
1. The extension should now be enabled

#### Firefox

The firefox extension is a work in progress

#### Chatterino

Chatterino support for 7TV is coming soon. Follow our [fork of chatterino](https://github.com/SevenTV/chatterino7) for updates

### How to host your own server / change your channel's server

To automatically import emotes from a custom server, add this tag into your [Twitch Profile Bio](https://dashboard.twitch.tv/u/anatoleam/settings/channel#profile-settings):

`EmoteServer=<url to your server>`

If this is correct and the server is online, the extension will automatically connect to it. Otherwise it'll connect to the default server instead.

#### Hosting your own server

This guide outlines how to set up a simple single-node emote server

###### Pre-requisites

-   A linux machine with port 80 opened to the internet and [Node.JS installed](https://nodejs.org/en/)
-   (Optional) A Amazon S3 bucket (or from a different service which supports AWS S3 API, such as DigitalOcean Spaces)
-   (Optional) A Redis Instance (for scaling and data consistency purposes)

Start by cloning the [Server Repo](https://github.com/SevenTV/Server)

```sh
git clone git@github.com:AnatoleAM/SevenTV.git
```

Then install the packages

```sh
npm install
```

Copy the sample configuration file (config.example.json) and modify it as you see fit

| Key         |  Type   |           Description           |
| ----------- | :-----: | :-----------------------------: |
| name        | String  |     The name of the server      |
| description | String  |     The server description      |
| hostname    | String  |     \*¹ The server hostname     |
| tls         | Boolean | \*² Whether the server is HTTPS |
| app_url     | String  | \*³ URL to the web application  |

The undocumented fields are optional because this service is delegated back to the default server, however if you are an advanced user you may set up these optional components in order to fully decouple your implementation.

_\*¹ This must be a TLD or IP pointing directly to the machine, including the port if it is other than 80. Example: https://anatole.dev:3000_
_\*² This must be set to true in production, or the extension will refuse to connect_
_\*³ Leave this to default, the web app at https://7tv.app is universal and is capable of connecting to your server_

Then use `npm start` to start the server.

In order to use the web app with a self-hosted server, you can use a direct link with the `server` query param, like `7tv.app/?server=<custom server url>`.

### Contributing

Contributions to this project are welcome

#### Browser Extension

#### API

#### Web App
