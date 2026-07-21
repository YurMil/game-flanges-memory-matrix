# Security and Privacy

## Threat model

The game is a public client-side application and all client state is untrusted. Main risks are:

- malicious or unexpected iframe messages;
- embedding by unauthorized sites;
- dependency compromise;
- cross-site scripting through configuration or localization;
- falsified scores;
- accidental collection of personal data;
- denial of service through malformed configuration or repeated lifecycle commands.

## Message security

- Validate `event.origin` against an explicit allowlist.
- Validate namespace, game ID, protocol version, type, and payload.
- Send messages to a specific target origin.
- Ignore unknown commands safely.
- Rate-limit or coalesce commands that can cause expensive restarts/resizes.
- Never execute code or navigate to arbitrary URLs received in a message.

## Input and rendering

- Treat query parameters, stored data, host messages, and remote configuration as untrusted.
- Use runtime schemas for external data.
- Render text through safe APIs; do not inject untrusted HTML.
- Keep localization files under source control.
- Restrict navigation requests to enumerated destination keys.

## Embedding policy

Use CSP `frame-ancestors` to restrict production embedding to approved domains. The iframe sandbox should not grant forms, popups, top navigation, downloads, or storage-access permissions unless a documented feature requires them.

## Dependency security

- Commit the package lockfile.
- Use reproducible CI installs.
- Enable dependency alerts and automated update PRs.
- Review engine and build-tool major upgrades.
- Run dependency scanning in CI.
- Avoid loading scripts from public CDNs in production; bundle or self-host dependencies.

## Score integrity

Local scores are for entertainment and can be modified by the user. If global leaderboards are added, never trust the final score alone. Use server-issued session challenges, server-side validation where practical, rate limits, anomaly detection, and clear separation between local and verified scores.

## Privacy

Version 1 requires no personal data. Local storage may contain only settings and game statistics. Telemetry is optional and must be controlled by the host’s consent state.

Permitted technical events may include:

- build version;
- browser family;
- coarse viewport class;
- startup duration;
- anonymized lifecycle events;
- sanitized error code.

Do not collect:

- names or email addresses;
- precise location;
- free-form text;
- persistent cross-site identifiers;
- complete IP addresses in application analytics;
- gameplay data not needed for stated metrics.

## Error reporting

Strip URLs, query values, host identifiers, and message payload contents unless explicitly approved. Source maps may be uploaded privately to an error service while remaining unavailable publicly.

## Storage

- Namespace keys, for example `cadautoscript:flanges-memory-matrix:v1`.
- Validate and cap stored numeric values.
- Provide a reset-data action.
- Do not store authentication tokens.

## Incident response

For a security issue:

1. disable or pin the host integration if needed;
2. roll back to the last known safe immutable release;
3. revoke affected telemetry/configuration credentials outside the client bundle;
4. patch through a reviewed PR;
5. document scope and preventive action.

## Security release checklist

- No secrets in bundle or source maps.
- CSP tested without unexpected violations.
- Allowed host origins correct.
- Unknown messages ignored.
- All external payloads validated.
- No unsafe HTML injection.
- Dependency scan reviewed.
- Production build uses self-hosted dependencies.
- Rollback remains available.