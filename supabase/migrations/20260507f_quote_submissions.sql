-- Quote widget: submission table + 64 curated starter quotes
-- Date: 2026-05-07
-- Phase 1: schema + seed. Phases 2-4 add server actions, magic-link routes, email, UI.

create table if not exists public.quote_submissions (
  id                  uuid primary key default gen_random_uuid(),
  quote               text not null,
  attribution         text not null,
  submitted_by_user_id uuid references auth.users(id) on delete set null,
  status              text not null default 'pending'
                        check (status in ('pending', 'approved', 'rejected')),
  approve_token       text unique,
  reject_token        text unique,
  token_expires_at    timestamptz,
  submitted_at        timestamptz not null default timezone('utc', now()),
  reviewed_at         timestamptz
);

create index if not exists idx_quote_submissions_status
  on public.quote_submissions(status);
create index if not exists idx_quote_submissions_approve_token
  on public.quote_submissions(approve_token);
create index if not exists idx_quote_submissions_reject_token
  on public.quote_submissions(reject_token);

alter table public.quote_submissions enable row level security;
-- No public policies. All reads/writes go through admin-client server actions.

comment on table public.quote_submissions is
  'Curated and user-submitted quotes for the dashboard quote widget. Pending submissions hold approve/reject magic-link tokens; approved/rejected rows have null tokens.';

-- ─── Seed: 64 curated starter quotes, pre-approved ────────────────────────────

insert into public.quote_submissions (quote, attribution, status) values
  ('Every solo you hear started as someone else''s echo.', 'John Taddeo', 'approved'),
  ('No skyline rises without the shadows of the buildings that came before it.', 'John Taddeo', 'approved'),
  ('You don''t invent fire—you catch a spark and decide how big it burns.', 'John Taddeo', 'approved'),
  ('Every signature move is just a borrowed motion perfected.', 'John Taddeo', 'approved'),
  ('The loudest voices were once quiet enough to listen.', 'John Taddeo', 'approved'),
  ('Before you become the headline, you''re reading someone else''s story.', 'John Taddeo', 'approved'),
  ('No one stands on stage without first standing in someone else''s crowd.', 'John Taddeo', 'approved'),
  ('Greatness doesn''t appear—it continues.', 'John Taddeo', 'approved'),
  ('Every original thought has fingerprints on it.', 'John Taddeo', 'approved'),
  ('You''re not the beginning of the line—you''re the next link that didn''t break.', 'John Taddeo', 'approved'),
  ('There would be no Eddie Van Halen if there were no Jimi Hendrix.', 'John Taddeo', 'approved'),
  ('Every legend is a remix you didn''t recognize at first.', 'John Taddeo', 'approved'),
  ('You don''t find your voice—you inherit the courage to use it.', 'John Taddeo', 'approved'),
  ('Before anyone leads, they''ve already been shown where to walk.', 'John Taddeo', 'approved'),
  ('No masterpiece starts from silence—it starts from something heard before.', 'John Taddeo', 'approved'),
  ('The edge you think is yours was sharpened long before you held it.', 'John Taddeo', 'approved'),
  ('No person is self-made. They are all well-built.', 'John Taddeo', 'approved'),
  ('Every breakthrough is someone else''s ceiling, shattered again.', 'John Taddeo', 'approved'),
  ('You don''t rise alone—you continue momentum.', 'John Taddeo', 'approved'),
  ('The path you blaze was cleared just enough for you to see it.', 'John Taddeo', 'approved'),
  ('What looks like instinct is usually memory wearing confidence.', 'John Taddeo', 'approved'),
  ('You don''t need to be remembered to be part of the story.', 'John Taddeo', 'approved'),
  ('Names fade. Impact remains.', 'John Taddeo', 'approved'),
  ('You can change a life and never hear about it.', 'John Taddeo', 'approved'),
  ('The greatest reward for changing a life is the satisfaction that you did so.', 'John Taddeo', 'approved'),
  ('…and when my work is done, I leave as if I was never there.', 'John Taddeo', 'approved'),
  ('Not every imprint comes with a signature.', 'John Taddeo', 'approved'),
  ('The quietest influences travel the farthest.', 'John Taddeo', 'approved'),
  ('Being forgotten doesn''t mean you didn''t matter.', 'John Taddeo', 'approved'),
  ('Some of the biggest shifts come from invisible hands.', 'John Taddeo', 'approved'),
  ('They may not remember the moment—but they''re living it.', 'John Taddeo', 'approved'),
  ('Impact doesn''t need recognition to be real.', 'John Taddeo', 'approved'),
  ('You don''t have to stay in the memory to stay in the outcome.', 'John Taddeo', 'approved'),
  ('You can be the turning point and never know where the turn led.', 'John Taddeo', 'approved'),
  ('Some lives change quietly, without ever saying thank you.', 'John Taddeo', 'approved'),
  ('The seed doesn''t get applause - it just grows.', 'John Taddeo', 'approved'),
  ('You might be the reason someone became who they are—and never hear your name.', 'John Taddeo', 'approved'),
  ('Not all impact circles back.', 'John Taddeo', 'approved'),
  ('The light you pass on doesn''t need to remember the flame.', 'John Taddeo', 'approved'),
  ('Some doors open, and no one looks back to see who unlocked them.', 'John Taddeo', 'approved'),
  ('You can rewrite a future without being written into it.', 'John Taddeo', 'approved'),
  ('The echo carries forward, even when the voice is gone.', 'John Taddeo', 'approved'),
  ('Being unseen doesn''t make the difference any smaller.', 'John Taddeo', 'approved'),
  ('I hear your voice every time I get it right.', 'John Taddeo', 'approved'),
  ('You didn''t just show me the answer, you showed me how to find it.', 'John Taddeo', 'approved'),
  ('Because of you, I don''t stop when it gets hard.', 'John Taddeo', 'approved'),
  ('You saw something in me before I knew how to see it myself.', 'John Taddeo', 'approved'),
  ('I carry what you gave me into every room I walk into.', 'John Taddeo', 'approved'),
  ('You didn''t just change my path—you changed how I walk it.', 'John Taddeo', 'approved'),
  ('The confidence I have today has your fingerprints on it.', 'John Taddeo', 'approved'),
  ('You didn''t just teach—you stayed with me long after the lesson ended.', 'John Taddeo', 'approved'),
  ('I measure my growth by the standard you set.', 'John Taddeo', 'approved'),
  ('What you gave me keeps paying dividends in ways I''m still discovering.', 'John Taddeo', 'approved'),
  ('I still hear you when I need direction most.', 'John Taddeo', 'approved'),
  ('You didn''t just teach me—you changed how I think.', 'John Taddeo', 'approved'),
  ('What I''ve become has your influence built into it.', 'John Taddeo', 'approved'),
  ('You gave me tools I didn''t even know I''d need.', 'John Taddeo', 'approved'),
  ('I didn''t realize it then, but you were shaping everything.', 'John Taddeo', 'approved'),
  ('You made me believe I was capable before I had proof.', 'John Taddeo', 'approved'),
  ('The way I approach problems still traces back to you.', 'John Taddeo', 'approved'),
  ('You didn''t just prepare me—you made me ready.', 'John Taddeo', 'approved'),
  ('Every time I push further, I''m building on what you started.', 'John Taddeo', 'approved'),
  ('I''m better at this because you took the time to care.', 'John Taddeo', 'approved'),
  ('I am better because of you.', 'John Taddeo', 'approved');
