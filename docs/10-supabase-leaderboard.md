# Compact Supabase Leaderboard

## Purpose

Add a small shared leaderboard for authenticated `cadautoscript.com` users without turning the game into a data-heavy service.

The start screen displays the ten best players for the selected game mode. Each row contains only:

- rank;
- site nickname;
- best score;
- highest level.

Guests can still play, but the leaderboard is not queried or displayed until the host site confirms an authenticated user session.

## Design constraints

- Use the existing Supabase project and site authentication.
- Keep only one best-result row per user, game, and mode.
- Do not store individual game sessions or score history.
- Do not use Supabase Realtime.
- Do not add an Edge Function for the first release.
- Do not expose email addresses or other profile fields.
- Do not pass a reusable Supabase access token into the game iframe.
- Treat the leaderboard as a casual feature; browser-generated scores are not cheat-proof.

## Recommended ownership

The host site owns the Supabase client and authenticated session. The embedded game communicates only through the existing typed host bridge.

```text
Supabase Auth + Database
          ^
          |
Host leaderboard service
          ^
          | typed postMessage events
          v
Flanges Memory Matrix iframe
```

This keeps authentication and database access outside the independently deployed game bundle.

## Minimal data model

Use one compact table. The primary key guarantees one row per player for each game mode.

```sql
create table public.game_leaderboard (
  game_id text not null,
  mode text not null
    check (mode in ('standard', 'relaxed', 'expert')),
  user_id uuid not null
    references auth.users(id) on delete cascade,
  nickname text not null
    check (char_length(nickname) between 1 and 32),
  best_score integer not null
    check (best_score between 0 and 100000000),
  highest_level smallint not null default 1
    check (highest_level between 1 and 999),
  updated_at timestamptz not null default now(),
  primary key (game_id, mode, user_id)
);

create index game_leaderboard_top_idx
  on public.game_leaderboard
  (game_id, mode, best_score desc, highest_level desc);
```

The table intentionally omits session IDs, duration, accuracy history, device data, email, avatars, and telemetry.

## Preserve only the best result

A small non-privileged trigger prevents a normal upsert from replacing a better stored result with a lower result.

```sql
create or replace function public.preserve_best_game_score()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.best_score := greatest(old.best_score, new.best_score);
  new.highest_level := greatest(old.highest_level, new.highest_level);
  new.updated_at := now();
  return new;
end;
$$;

create trigger preserve_best_game_score_before_update
before update on public.game_leaderboard
for each row
execute function public.preserve_best_game_score();
```

The function is not `security definer`; normal RLS rules continue to control the update.

## Row Level Security

Only authenticated users may read the leaderboard. A user may insert or update only their own row.

```sql
alter table public.game_leaderboard enable row level security;

revoke all on public.game_leaderboard from anon;
grant select, insert, update on public.game_leaderboard to authenticated;

create policy "Authenticated users can read the leaderboard"
on public.game_leaderboard
for select
to authenticated
using (true);

create policy "Users can insert their own leaderboard row"
on public.game_leaderboard
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own leaderboard row"
on public.game_leaderboard
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
```

No delete policy is required for the game client. Account deletion removes the related row through `on delete cascade`.

## Top-10 query

The host runs one small query when the authenticated start screen opens.

```ts
const { data, error } = await supabase
  .from('game_leaderboard')
  .select('nickname,best_score,highest_level')
  .eq('game_id', 'flanges-memory-matrix')
  .eq('mode', mode)
  .order('best_score', { ascending: false })
  .order('highest_level', { ascending: false })
  .limit(10);
```

Do not use `select('*')`. The response contains only the fields rendered by the leaderboard.

## Score submission

After `game:game-over`, the game sends a score candidate to the host. The host adds the current authenticated user ID and nickname from the site profile, validates numeric limits, and performs one upsert.

```ts
const { error } = await supabase
  .from('game_leaderboard')
  .upsert(
    {
      game_id: 'flanges-memory-matrix',
      mode,
      user_id: user.id,
      nickname: profile.nickname,
      best_score: score,
      highest_level: highestLevel,
    },
    { onConflict: 'game_id,mode,user_id' },
  );
```

The host must never accept `user_id` from the iframe payload. The authenticated session is the only source of the database user ID.

## Microfrontend messages

Add three compact messages to protocol version 1.

### Game to host

```ts
type ScoreSubmitRequest = {
  type: 'game:score-submit-request';
  payload: {
    mode: 'standard' | 'relaxed' | 'expert';
    score: number;
    highestLevel: number;
  };
};
```

### Host to game

```ts
type LeaderboardData = {
  type: 'host:leaderboard-data';
  payload: {
    mode: 'standard' | 'relaxed' | 'expert';
    entries: Array<{
      nickname: string;
      bestScore: number;
      highestLevel: number;
    }>;
  };
};

type ScoreSubmitResult = {
  type: 'host:score-submit-result';
  payload: {
    accepted: boolean;
    leaderboardChanged: boolean;
  };
};
```

The host may include the first leaderboard payload in `host:init` to avoid an extra message during startup.

## Start-screen behavior

For an authenticated user:

1. Show a compact `TOP 10` panel below or beside the Play button.
2. Render a loading skeleton while the host performs the query.
3. Show rank, nickname, score, and level only.
4. Highlight the current user's nickname when present.
5. Refresh after score submission only when `leaderboardChanged` is true.

For a guest:

- do not query Supabase;
- hide the ranking rows;
- optionally show one short host-controlled sign-in action.

A leaderboard failure must never block starting the game.

## Cost and traffic controls

- One database row per user and mode.
- One indexed query returning at most ten rows.
- One upsert after game over for authenticated users.
- No polling and no Realtime subscription.
- Keep the latest result in host memory for approximately 60 seconds.
- Refresh on mode change, explicit retry, or accepted score update.
- Do not submit intermediate score changes.

## Validation and abuse limits

Before upsert, the host validates:

- supported game ID and mode;
- integer score and level;
- documented upper bounds;
- authenticated user ID from the session;
- nickname from the existing site profile, normalized to 1–32 characters.

This design prevents users from modifying another user's row, but it does not prove that a score was earned legitimately. Strong anti-cheat validation is deliberately outside the first release.

## Acceptance criteria

- Logged-in users see a Top-10 list on the game start screen.
- Logged-out users do not trigger a leaderboard database request.
- Only nickname, score, and level are returned to the UI.
- Each user has at most one row per game mode.
- A lower later score does not replace a higher stored score.
- The iframe never receives a Supabase access token or service-role key.
- A Supabase error does not prevent local gameplay.
- The leaderboard uses no session-history table, Realtime channel, or scheduled job.
