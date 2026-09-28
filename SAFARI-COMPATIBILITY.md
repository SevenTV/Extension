# Safari compatibility inventory

The Safari package now injects the unmodified upstream site implementation on
all three officially supported origins using static manifest entries. This
keeps the Safari delta small and makes upstream rebases reviewable.

## Included upstream surfaces

The entries below describe the upstream modules packaged by the Safari build;
they are not all separate claims of completed live Safari validation.

### Twitch

-   7TV, FFZ and BTTV chat emotes
-   chat input and autocomplete
-   emote menu
-   settings
-   cosmetics, paints, badges and avatars
-   VOD chat
-   mod logs and moderation UI
-   custom commands
-   player controls and stream statistics
-   sidebar previews and hidden-element settings
-   automatic channel-point claims

### Kick

-   7TV chat emotes
-   chat input and autocomplete
-   emote menu, including native Kick sets
-   settings
-   cosmetics supported by upstream

### YouTube

-   7TV, FFZ and BTTV emotes in live chat
-   chat autocomplete

## Intentional Safari differences

-   Extension-management compatibility scanning remains unavailable. Safari does
    not expose Chromium's `management` permission, so 7TV cannot enumerate or
    disable other extensions.
-   Platform access is static. Safari enables Twitch, Kick and YouTube in the
    signed manifest instead of asking for optional hosts at runtime.
-   Extension self-update checks are advisory only. A local build is updated
    by rebuilding and replacing the signed app.
-   Kick authentication is not counted as a Safari gap: its module is disabled in
    the upstream source itself.
-   Commands that require third-party credentials, such as AudD `/song`, still
    require their upstream configuration and are not enabled implicitly.

## Validation status

| Surface                                                               | Current evidence                                                                                |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Twitch core chat and 7TV emotes                                       | Manually validated in Safari, including repeated page reloads                                   |
| Kick core chat and 7TV emotes                                         | Manually validated in Safari during development                                                 |
| YouTube live chat                                                     | Packaged and covered by manifest regression tests; live Safari validation is still pending      |
| Settings, autocomplete, emote menu, cosmetics and moderation features | Upstream modules are packaged; exhaustive Safari feature-by-feature validation is still pending |

Automated tests cover the Safari manifest, registration behavior, message
boundaries, worker loading, HTML sanitization, native entitlements and build
artifacts. They do not replace live tests against each supported website.

## Update rule

For each upstream update, compare `origin/master`, resolve the small Safari
build/permission delta, rebuild, run `verify:safari`, then run the live latency
test once on Twitch and once on Kick. Do not copy features into a separate
implementation when the upstream site module can be loaded unchanged.
