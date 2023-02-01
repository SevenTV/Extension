# 7TV Web Extension v3

This is a complete rewrite of the [Web Extension](https://github.com/seventv/seventv) for 7TV.

### Building

-   make deps
-   make production

For a beta build, set `BRANCH=beta` in your environment variables.

Build output located in `dist/`.

### Contributing

To get the extension working locally, simply clone the repo, then run `make deps` to install all dependencies.

Now you may run `yarn setup` to generate a build of the extension conditioned to work with HMR. The extensions's files will be located in `dist/`. Add the folder as an unpacked extension via the chrome extensions page.

Finally, run `yarn dev` to start the vite server.
