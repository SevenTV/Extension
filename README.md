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

### Safari

Safari can run this extension as a [Safari Web Extension](https://developer.apple.com/documentation/safariservices/safari_web_extensions).
Safari extensions ship inside a native host app, so one extra step wraps the built web
extension into an Xcode project.

Requirements: macOS with Xcode installed (provides `safari-web-extension-converter`).

-   Build the Safari bundle and generate the Xcode project: `make safari`
    (equivalently `yarn build:safari` then `yarn convert:safari`).
    The web extension is built into `dist/safari/`, and the Xcode project is created in `safari/`.
-   Open `safari/SevenTV/SevenTV.xcodeproj` in Xcode, select the **My Mac** destination and the
    **SevenTV** scheme, then **Run** it (⌘R). This builds, signs and registers the host app with
    Safari; you can quit the app once it has run.
    -   Use **Run**, not **Product → Archive**. Archiving registers the extension from a temporary
        build location that Xcode later cleans up, which leaves Safari pointing at a bundle that no
        longer exists.
    -   If Xcode won't run the app, open **Signing & Capabilities** for both targets and pick a
        **Team** (recommended), or enable **Safari → Develop → Allow Unsigned Extensions** to run it
        unsigned. That setting is cleared every time Safari quits.
-   Enable the extension under **Safari → Settings → Extensions → 7TV** and grant it website access.

While developing, enable **Develop → Allow Unsigned Extensions** in Safari to load the
locally built (unsigned) extension. This setting is cleared every time Safari restarts. For a
persisted build, select your signing team in Xcode's _Signing & Capabilities_ tab first.

The generated app can be customised through environment variables, for example:

```sh
SAFARI_APP_NAME="SevenTV Dev" SAFARI_BUNDLE_ID="app.7tv.SevenTV.dev" yarn convert:safari
```

The app name must be valid in a bundle identifier (so it cannot begin with a digit, hence
`SevenTV` rather than `7TV`), and the last component of the bundle id must match it.

A few features are unavailable on Safari because the underlying extension APIs are not
implemented there:

-   The compatibility checker (which inspects other installed extensions) is disabled, as
    Safari does not implement the `management` API.
-   In-extension update checks are skipped, as Safari does not implement
    `runtime.requestUpdateCheck` / `runtime.onUpdateAvailable`.

#### Signing and installing

A build produced by Xcode's **Run** action is signed ad-hoc ("Sign to Run Locally"). Safari only
loads such a build while **Develop → Allow Unsigned Extensions** is enabled, and Safari clears that
setting every time it quits — which is why an ad-hoc build has to be relaunched after each restart.

To make the extension permanent, sign it with your Apple Developer team and install the host app
somewhere stable:

1.  Sign it with your team. Either regenerate the project with the team baked in:

    ```sh
    SAFARI_DEVELOPMENT_TEAM=XXXXXXXXXX yarn convert:safari
    ```

    (find your team id with `security find-identity -v -p codesigning`, or in your Apple Developer
    account) — or set the **Team** for both targets in Xcode's _Signing & Capabilities_.

2.  Build and install the host app outside of Xcode's DerivedData (Xcode can clean that directory,
    and cleaning it breaks the extension):

    ```sh
    xcodebuild -project safari/SevenTV/SevenTV.xcodeproj -scheme SevenTV -configuration Release \
        -derivedDataPath build/safari CODE_SIGN_STYLE=Automatic -allowProvisioningUpdates build

    cp -R build/safari/Build/Products/Release/SevenTV.app /Applications/
    open /Applications/SevenTV.app   # run once so macOS registers the extension
    ```

3.  Enable **7TV** in **Safari → Settings → Extensions**. Signed with a real certificate, it now
    stays enabled across Safari restarts and no longer needs _Allow Unsigned Extensions_.

#### Troubleshooting

-   **“Unable to find `icon/…` in the extension’s resources. It is an invalid path.”**
    Safari loaded an extension bundle that does not contain the referenced icon files. Rebuild
    (`yarn build:safari && yarn convert:safari`), then in Xcode run **Product → Clean Build
    Folder** (⇧⌘K) and Run again.
-   **The error keeps coming back after rebuilding.** macOS is usually still pointing at an old or
    deleted build of the extension (most often the temporary one left behind by **Product →
    Archive**). List what is registered with
    `pluginkit -m -v -D -p com.apple.Safari.web-extension`, remove stale entries with
    `pluginkit -r "<path>"`, then **Run** the app again from Xcode (rather than archiving it).
-   **Do not use _Product → Archive_ for local testing.** It registers the extension from a
    temporary location that gets cleaned up, leaving Safari pointing at a build that no longer
    exists. Use **Run** (⌘R) instead.

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
