# SevenTV
It's like another third party thing

### Features

* Hundreds of emote slots
* Support for wide and animated emotes
* Self-hosted emote servers 
* No more emote censorship PagMan

### Yeah but this is a third party thing and idk

The main extensions people use for third party emotes have a tendency to remove emotes when users of Reddit and Twitter dislike them. These judgements tend to be out of touch with reality, and there is no reason for an extension to police what fun people are allowed to have.

This project aims to give back full freedom over third party emotes, free of tyranny from deranged social media users with too much time on their hands.
It's made up of 3 parts:

1. An API/Server to deliver service
1. A browser extension to view emotes
1. A web app to manage emotes

A default server is available out of the box, currently at [7tv.anatole.dev](https://7tv.anatole.dev).

### Installation (Browser Extension)

The browser extension currently isn't available on any stores and must be installed manually

### How to host your own server / change your channel's server

You can configure your twitch channel to use a different emote server instead of the default one by adding this tag somewhere in the Twitch description:

`7tv_emote_server_url=<url to your server>`

If this is correct and the server is online, the extension will automatically connect to it. Otherwise it'll connect to the default server instead.

#### Hosting your own server

###### Pre-requisites

* A linux machine with port 80 opened to the internet and [Node.JS installed](https://nodejs.org/en/)
* (Optional) A Amazon S3 bucket (or from a different service which supports AWS S3 API, such as DigitalOcean Spaces)
* (Optional) A Redis Instance (for scaling and data consistency purposes)

Start by cloning this project, then navigate to the server folder 

```sh
git clone git@github.com:AnatoleAM/SevenTV.git && cd ./SevenTV/server
```

Install the packages
```sh
npm install
```

Change the configuration (config.json) to suit your needs

| Key					| Type						| Description						|
| ----------------------|:-------------------------:|:---------------------------------:|
| Name                  | String                    | The name of the server            |
| Description           | String                    | The server description            |


Then use `npm start` to start the server. 

In order to use the web app with a self-hosted server, you can use a direct link with the `server` query param, like `7tv.anatole.dev/?server=<custom server url>`.

### Contributing

Contributions to this project are welcome

#### Browser Extension

#### API

#### Web App