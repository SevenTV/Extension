# Safari test protocol

This protocol separates deterministic gates from tests that require a real
Safari installation. Test artifacts are written under `test-results/` and are
ignored by Git.

## 1. Deterministic regression gate

```sh
npx --no-install yarn@1.22.22 verify:safari
```

This compiles the Safari variant, runs the source/package/native regression
tests, validates the installed app when present, and audits dependencies.

## 2. Real Safari smoke test

First, check prerequisites without opening an automation session:

```sh
npx --no-install yarn@1.22.22 test:safari:live:check
```

Safari WebDriver is disabled by default. Enable it explicitly in Safari under
Develop > Developer Settings > Allow remote automation. Then run:

```sh
npx --no-install yarn@1.22.22 test:safari:live -- \
  --url https://www.twitch.tv/illojuan \
  --reloads 2 \
  --timeout 45
```

The test only permits HTTPS Twitch or Kick URLs. It waits for the extension marker,
the single injected 7TV root, and the 7TV menu button. It opens the 7TV emote
menu and requires at least one fully loaded image from a `*.7tv.app` host. It
repeats those assertions after every reload and saves screenshots plus JSON.
It also records navigation-to-injection, menu readiness, first real 7TV image,
and p50/p95 timings for observed 7TV resources. It does not log in, send a chat
message, or modify site data.

The JSON also includes `pipelineMarks` for worker startup, channel lookup, the
7TV/FFZ/BTTV set arrivals, and the moment all provider requests settle. This is
enough to distinguish an API/set delay from an image-CDN delay before changing
the cache or request ordering.

Stress the reload lifecycle with:

```sh
npx --no-install yarn@1.22.22 test:safari:stress
```

## 3. A/B resource benchmark

Use the same channel, video quality, window size, brightness, power source and
duration for both runs. Close unrelated Safari windows. A 30-minute run is a
useful first measurement; a two-hour run is better for memory growth.

With 7TV disabled in Safari:

```sh
npx --no-install yarn@1.22.22 benchmark:safari -- sample \
  --label disabled \
  --duration 1800 \
  --interval 5 \
  --video-quality 1080p60 \
  --brightness 50 \
  --output test-results/safari-benchmark/disabled.json
```

Repeat with 7TV enabled and otherwise identical conditions:

```sh
npx --no-install yarn@1.22.22 benchmark:safari -- sample \
  --label enabled \
  --duration 1800 \
  --interval 5 \
  --video-quality 1080p60 \
  --brightness 50 \
  --output test-results/safari-benchmark/enabled.json
```

Compare the runs:

```sh
npx --no-install yarn@1.22.22 benchmark:safari -- compare \
  --disabled test-results/safari-benchmark/disabled.json \
  --enabled test-results/safari-benchmark/enabled.json
```

The comparison is informational until evidence-based limits are supplied. A
gate can be introduced later with `--max-cpu-mean-delta`,
`--max-rss-mean-delta`, and `--max-rss-slope-delta`. Do not invent thresholds
before collecting a baseline on the target Mac.

The sampler counts the Safari app and WebKit content/network processes that can
be attributed to Safari's data container. Shared GPU services cannot be
reliably assigned without privileged instrumentation, but their impact remains
visible in the whole-machine battery result. This test does not attribute every
sample to one JavaScript function. Use Instruments Time Profiler,
Allocations/Leaks and Energy Log after a regression is detected.

## 4. Clean install and release artifact

Verify any built or downloaded app without installing it:

```sh
./script/verify-safari-release.sh "/absolute/path/7TV for Safari.app" development
```

For a public artifact, use `distribution`; that additionally requires
Gatekeeper acceptance and a stapled notarization ticket. Run the distributed
ZIP or DMG on a separate Mac or clean macOS user, not from Xcode's build
directory.

On a clean profile, record these scenarios:

1. Fresh install and first Twitch load.
2. Upgrade over a configured older build; settings must remain.
3. Browser restart and Mac restart.
4. Sleep/wake and network loss/recovery.
5. Rollback to the prior compatible build.
6. Uninstall; no active plug-in registration may remain.

Use `tests/safari/compatibility-matrix.json` to record which Safari/macOS
combinations passed. Public release requires every entry under `required`.
