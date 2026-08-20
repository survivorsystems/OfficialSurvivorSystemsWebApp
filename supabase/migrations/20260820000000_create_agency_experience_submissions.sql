create table if not exists public.agency_experience_submissions (
  id bigint generated always as identity primary key,
  state text not null check (char_length(state) between 1 and 80),
  agency_name text not null check (char_length(agency_name) between 1 and 200),
  branch_location text check (branch_location is null or char_length(branch_location) <= 200),
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  publication_permission text check (publication_permission is null or char_length(publication_permission) <= 80),
  follow_up_allowed boolean not null default false,
  follow_up_contact text check (follow_up_contact is null or char_length(follow_up_contact) <= 250),
  questionnaire_version smallint not null default 1,
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'reviewed', 'flagged', 'archived')),
  created_at timestamptz not null default now()
);

comment on table public.agency_experience_submissions is
  'Private survivor feedback. Never expose raw submissions or follow-up contact details publicly.';

alter table public.agency_experience_submissions enable row level security;

revoke all on table public.agency_experience_submissions from anon, authenticated;
revoke all on sequence public.agency_experience_submissions_id_seq from anon, authenticated;
grant select, insert, update, delete on table public.agency_experience_submissions to service_role;
grant usage, select on sequence public.agency_experience_submissions_id_seq to service_role;

create index if not exists agency_experience_submissions_state_created_idx
  on public.agency_experience_submissions (state, created_at desc);

create index if not exists agency_experience_submissions_moderation_idx
  on public.agency_experience_submissions (moderation_status, created_at desc);
