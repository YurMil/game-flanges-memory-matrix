# Microfrontend Integration

## Recommended deployment model

Build and deploy the game as an independently versioned static web application. Integrate it into `cadautoscript.com` through a dedicated route and, where stronger isolation is useful, a sandboxed iframe.

For this game, **iframe integration is the recommended first release** because it provides:

- CSS and JavaScript isolation;
- independent dependency versions;
- independent deployment and rollback;
- predictable canvas sizing;
- a clear security boundary;
- low coupling to the host React application.

A route-mounted JavaScript module can be considered later if shared navigation, authentication, or UI integration requires it. Module Federation is not required for version 1 and would add operational complexity without a clear benefit.

## Hosting options

### Preferred

- Game origin: `https://games.cadautoscript.com/flanges-memory-matrix/<version>/`
- Host route: `https://cadautoscript.com/mini-games/flanges-memory-matrix`
- Host page renders the title, metadata, share controls, and iframe.

### Acceptable alternative

Serve immutable game assets below the main origin:

`/games/flanges-memory-matrix/assets/...`

The release must still use hashed assets and an independently replaceable entry document.

## Embed example

```html
<iframe
  id="flanges-memory-matrix"
  src="https://games.cadautoscript.com/flanges-memory-matrix/current/?embedded=1&locale=en"
  title="Flanges Memory Matrix"
  allow="autoplay"
  sandbox="allow-scripts allow-same-origin"
  referrerpolicy="strict-origin-when-cross-origin"
></iframe>
```

Only add sandbox permissions that are actually required.

## Message contract

All messages use a namespaced envelope:

```ts
interface GameMessage<TType extends string, TPayload> {
  namespace: 'cadautoscript.game';
  gameId: 'flanges-memory-matrix';
  protocolVersion: 1;
  type: TType;
  payload: TPayload;
  timestamp: string;
}
```

### Game to host events

- `game:ready`
- `game:started`
- `game:paused`
- `game:resumed`
- `game:level-completed`
- `game:score-changed`
- `game:game-over`
- `game:resize-request`
- `game:navigate`
- `game:error`

Example:

```ts
{
  namespace: 'cadautoscript.game',
  gameId: 'flanges-memory-matrix',
  protocolVersion: 1,
  type: 'game:game-over',
  payload: {
    sessionId: 'uuid',
    score: 12450,
    highestLevel: 9,
    accuracy: 0.92,
    durationMs: 183000
  },
  timestamp: '2026-07-21T17:00:00.000Z'
}
```

### Host to game commands

- `host:init`
- `host:pause`
- `host:resume`
- `host:set-locale`
- `host:set-theme`
- `host:set-sound`
- `host:restart`
- `host:visibility-changed`

## Origin validation

The game must reject messages unless:

1. the envelope and protocol version are valid;
2. the sender origin matches an allowlisted host origin;
3. the command payload passes runtime validation.

The host must similarly validate the iframe origin, namespace, game ID, and message shape.

Never use `postMessage(..., '*')` in production after the target origin is known.

## Initialization handshake

1. Game loads and installs its message listener.
2. Game sends `game:ready` with supported protocol versions and build version.
3. Host sends `host:init` with locale, theme, consent/telemetry state, user display preferences, and optional anonymous host session ID.
4. Game acknowledges by entering menu or resuming an allowed saved state.
5. If no host responds within a short timeout, the game continues in standalone mode.

## Sizing

The host owns iframe width. The game reports a preferred height when its aspect or UI changes:

```ts
{ type: 'game:resize-request', payload: { minHeight: 640, aspectRatio: 0.75 } }
```

For fullscreen game pages, use viewport height and safe-area handling instead. Avoid nested scrolling inside the iframe.

## Navigation

The game does not directly manipulate the parent URL. It emits `game:navigate` with a known destination key such as `home`, `games`, or `about`. The host decides whether and where to navigate.

## Authentication and scores

Version 1 stores best scores locally. If platform accounts or leaderboards are introduced:

- the host retains authentication tokens;
- the iframe receives no reusable access token;
- score submission should use a short-lived signed challenge or a host-mediated API call;
- client-submitted scores must be treated as untrusted.

## Versioning

- Version the message protocol independently from the game release.
- Keep backward compatibility for at least one protocol version where feasible.
- Include `buildVersion` and `commitSha` in `game:ready`.
- Host configuration may pin a release URL for rollback.

## Local development

Run host and game on separate local ports to preserve cross-origin behavior:

- host: `http://localhost:5173`
- game: `http://localhost:4173`

Configure both origins explicitly. End-to-end tests should exercise the actual iframe handshake, not only standalone mode.

## Host adapter API

Create a small adapter in the host repository rather than spreading message code across components:

```ts
interface EmbeddedGameController {
  pause(): void;
  resume(): void;
  restart(): void;
  setLocale(locale: string): void;
  subscribe(handler: (event: GameEvent) => void): () => void;
  destroy(): void;
}
```

This contract can later be reused by other mini-games.