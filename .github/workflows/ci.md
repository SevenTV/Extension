# Jobs

## Build job (`ci`)

- Builds the chrome extension with `yarn build:prod` and firefox extension with `MOZILLA_ID=moz-addon-prod@7tv.app MV2=true yarn build:prod`
- Both builds get zipped
- For chrome: Create CRX from zip with action `cardinalby/webext-buildtools-chrome-crx-action@v2` and private key `secrets.WEB_EXTENSION_CRX`
- For Firefox: Create XPI from zip with action `kewisch/action-web-ext@v1`
- CRX and XPI files uploaded as artifact `installable`
- Chrome zip and Firefox zip uploaded as artifact `build`
- Both manifest jsons uploaded as artifact `manifest`

## Release job (`release`)

- Creates Github releases and tags

## Side loading deploy job (`deploy`)

- Builds with `yarn build-hosted:prod`
- Uploads to Cloudflare R2 with action `shallwefootball/s3-upload-action@master`
  - Endpoint: `secrets.R2_API_ENDPOINT`
  - Access Key: `secrets.R2_API_AK`
  - Secret Key: `secrets.R2_API_SECRET`
  - Bucket: `7tv-extension`

## Push job (`push`)

- Upload zip file (not crx) to chrome web store (cws) with npm package `chrome-webstore-upload-cli`
  - Extension id: `ammjkodgmmoknidbanneddgankgfejfh`
  - Client id, client secret, refresh token in `secrets.CWS`
- Sign XPI file with action `kewisch/action-web-ext@v1`
  - API key: `secrets.AMO_API_KEY`
  - API secret: `secrets.AMO_API_SECRET`
  - upload signed XPI as artifact `installable`
- Update Github release
