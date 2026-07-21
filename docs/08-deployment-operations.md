# Deployment and Operations

## Build artifact

The game is a static application. A release contains:

```text
index.html
assets/*.js
assets/*.css
assets/*.(ogg|mp3|webm)
manifest.json
version.json
```

Assets use content hashes and long immutable cache headers. `index.html`, `manifest.json`, and `version.json` use short caching so the active release can change quickly.

## Release layout

Recommended object storage or hosting structure:

```text
/flanges-memory-matrix/
  releases/
    1.0.0/
    1.0.1/
  current/ -> releases/1.0.1/
```

If symbolic aliases are unavailable, the host platform stores the active version URL in configuration.

## CI/CD pipeline

On pull request:

1. install from lockfile;
2. format, lint, typecheck;
3. unit and integration tests;
4. production build;
5. Playwright smoke tests;
6. bundle-size check;
7. publish preview deployment.

On version tag:

1. repeat all quality gates;
2. build with version and commit metadata;
3. upload to immutable release path;
4. run standalone smoke test;
5. run embedded-host smoke test;
6. promote release alias/configuration;
7. record release notes.

## Environment separation

- Local development
- Preview per pull request
- Staging integrated with staging host
- Production

Do not put secrets in the game bundle. Public origins, telemetry switches, and build metadata are configuration, not secrets.

## Cache policy

- Hashed assets: `Cache-Control: public, max-age=31536000, immutable`
- Entry HTML and release metadata: short max age or no-cache with ETag
- Service worker: omit in v1 unless offline installation is a requirement; incorrect service-worker caching complicates independent release and rollback.

## Security headers

Apply an explicit Content Security Policy compatible with Phaser and hosted assets. Avoid `unsafe-eval`. Restrict frame ancestors to approved platform origins when the game is not intended for arbitrary embedding.

Recommended additional headers:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` disabling unused capabilities
- `Cross-Origin-Resource-Policy` selected according to hosting topology

## Monitoring

At minimum track release health through:

- successful `game:ready` rate;
- uncaught error count by build version;
- startup duration;
- game start and completion counts when consent permits;
- browser and viewport distribution;
- host handshake failures.

Avoid collecting target patterns, typed content, identifiers, or precise personal data.

## Smoke tests

After deployment verify:

- direct URL loads;
- current version metadata is correct;
- game starts and a seeded round can complete;
- reload preserves settings;
- iframe handshake succeeds from the production host;
- CSP produces no blocked required resource;
- old release URL remains available for rollback.

## Rollback

Rollback changes only the active release alias or host configuration to the previous immutable version. Do not rebuild the previous version during an incident.

Rollback triggers include:

- startup failure;
- major browser regression;
- repeated uncaught error;
- broken host protocol;
- inaccessible controls;
- unacceptable performance regression.

## Operational ownership

Document owners for:

- game source and releases;
- host integration adapter;
- DNS/hosting;
- telemetry/error reporting;
- incident rollback.

## Version metadata

Expose `/version.json`:

```json
{
  "name": "flanges-memory-matrix",
  "version": "1.0.0",
  "commitSha": "<sha>",
  "builtAt": "<iso-date>",
  "protocolVersion": 1
}
```

Also include the version in `game:ready` and the in-game About screen.