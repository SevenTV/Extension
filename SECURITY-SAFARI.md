# Safari security notes

## Scope

This variant packages the official 7TV extension for Safari. It runs on Twitch,
Kick and YouTube and retains 7TV's upstream emote and chat implementation for
each site.

## Enforced controls

-   The manifest grants only extension storage and static access to Twitch, Kick
    and YouTube.
-   Safari does not dynamically register content scripts, preventing duplicate
    registrations after service-worker restarts.
-   Messages reaching the extension background are accepted only from HTTPS
    Twitch pages and validated before use.
-   Safari rejects all page-originated permission requests.
-   Closed-tab messaging errors are consumed and cannot break initialization.
-   The worker URL is always an extension URL; Twitch page storage cannot replace
    it with an arbitrary URL.
-   Login popup messages require the exact 7TV origin and popup window.
-   Changelog HTML is sanitized before rendering.
-   Extension pages disallow remote scripts, objects, base rewriting, and framing.
-   The native wrapper does not log or echo extension messages.
-   Both native targets are sandboxed and use hardened runtime.
-   Dependency installation scripts are not run during the reviewed install, and
    the runtime dependency audit has no known advisories.

The upstream development toolchain is substantially older and its full audit
contains known advisories in build and lint packages. Modernizing that toolchain
is intentionally kept separate from the Safari compatibility change so it can
be reviewed and tested independently. Do not expose the Vite development server
to an untrusted network.

## Remaining trust boundaries

7TV must run page-world code inside Twitch to integrate with Twitch's chat UI.
That means Twitch page code and 7TV page-world code share an execution origin.
This is inherited from the upstream extension architecture, not a Safari-only
permission. For passive emote viewing, no 7TV login token is required.

A local app can be signed with an Apple Development certificate. Its nested
signature is verifiable locally, but that is not equivalent to an App Store or
notarized public distribution. Public binaries require a separate
release-signing and notarization process.

## Updating

Treat every upstream update as new code. Review the upstream revision, retain
the Safari permission assertions, install only from the lockfile, rerun the
dependency audit, rebuild, and verify the final nested signature before
replacing the installed app.
