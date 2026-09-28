# 7TV for Safari

This project packages the official 7TV extension as a Safari Web Extension.
The Safari build keeps the upstream site implementations and statically
supports the same three sites:

-   site access: Twitch, Kick and YouTube
-   extension permission: local extension storage
-   no Chrome extension-management permission
-   no runtime registration; all three content-script matches are declared once
-   no remote worker override
-   no automatic download of build tools

The wrapper app and extension use the App Sandbox and hardened runtime. The
wrapper has no file-selection or outgoing-network entitlement. Extension pages
use a restrictive content security policy.

Build the locally signed macOS application with:

```sh
./script/build-safari-local.sh
```

The script checks the reviewed lockfile, audits runtime dependencies, compiles
the Safari variant, signs it with an existing Apple Development identity,
verifies the nested signature, and checks the final permissions. It does not
install or replace the application automatically, and it does not register its
temporary Xcode build with Launch Services.

The result is a locally signed development build. A downloadable public release
would additionally require a distribution certificate, notarization, an update
design, and a separate release review. Local development signing does not
require publishing through the Mac App Store.

See `SECURITY-SAFARI.md` for the security model and remaining trust boundaries.
See `SAFARI-TESTING.md` for the real-Safari, stress, release-package and A/B
resource test protocol.

Run the repeatable Safari regression gate with:

```sh
npx --no-install yarn@1.22.22 verify:safari
```

It verifies the compiled manifest, Safari compatibility regressions, worker and
HTML boundaries, and native entitlements. When `SEVENTV_INSTALLED_APP` is set,
it also verifies the installed signature, registration, and byte equality of
critical resources. A release still needs one real-Safari smoke test:
reload Twitch twice and verify that a known 7TV emote changes from text to an
image after each reload.
