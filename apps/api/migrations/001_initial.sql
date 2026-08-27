-- Attest evidence store, initial schema.
--
-- The load-bearing property of this file is that scan records cannot be changed
-- after they are written, and that the constraint is enforced by the database
-- rather than by the application's good intentions. "We do not update these
-- rows" is a convention. Under a subpoena, the difference between a convention
-- and a constraint is the whole question.

begin;

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- accounts --

create table accounts (
  id                bigserial primary key,
  github_id         bigint not null unique,
  github_login      text   not null,
  kind              text   not null check (kind in ('user', 'organization')),
  email             text,
  plan              text   not null default 'free' check (plan in ('free', 'solo', 'team')),
  -- Set by the merchant of record's webhook. We never hold card details.
  mor_customer_id   text,
  mor_subscription_id text,
  -- Retention is configurable downward, never upward past the legal maximum.
  retention_days    integer not null default 2557 check (retention_days between 30 and 3650),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index accounts_mor_customer_idx on accounts (mor_customer_id) where mor_customer_id is not null;

create table repositories (
  id           bigserial primary key,
  account_id   bigint not null references accounts (id) on delete cascade,
  -- 'owner/name' as GitHub reports it.
  full_name    text   not null,
  github_id    bigint,
  created_at   timestamptz not null default now(),
  unique (account_id, full_name)
);

-- ------------------------------------------------------------------- scans --

-- The evidence trail. Insert-only, enforced below.
create table scans (
  id             bigserial primary key,
  repository_id  bigint not null references repositories (id) on delete cascade,

  -- Identity of the scan itself.
  scan_uuid      uuid   not null,
  tool_version   text   not null,

  -- What was scanned. Recorded alongside the hash, deliberately not inside it,
  -- so identical code hashes identically across branches and machines.
  commit_sha     text,
  ref            text,

  -- SHA-256 over the canonical form of the findings, suppressions, metrics,
  -- coverage and rule set. See packages/core/src/engine.ts computeContentHash.
  content_hash   text   not null check (content_hash ~ '^sha256:[0-9a-f]{64}$'),

  -- The hash of the previous scan for this repository, forming a chain. Null
  -- only for the first record. Altering or removing a record in the middle
  -- breaks every link after it, which is the point.
  prev_hash      text,
  chain_hash     text   not null,

  -- The report, exactly as produced. Stored whole so it can be re-verified
  -- independently of anything we compute from it.
  report         jsonb  not null,

  -- Denormalised for querying without opening the JSON on every row.
  finding_count      integer not null default 0,
  critical_count     integer not null default 0,
  serious_count      integer not null default 0,
  moderate_count     integer not null default 0,
  minor_count        integer not null default 0,
  suppressed_count   integer not null default 0,
  layers_ran         text[]  not null default '{}',
  layers_skipped     text[]  not null default '{}',

  scanned_at     timestamptz not null,
  received_at    timestamptz not null default now()
);

create index scans_repository_received_idx on scans (repository_id, received_at desc);
create index scans_commit_idx             on scans (repository_id, commit_sha);
create unique index scans_chain_idx       on scans (repository_id, chain_hash);

-- Findings are denormalised out of the report for trend queries. They are a
-- derived index over immutable data, so they are rebuildable and carry no
-- independent authority — the report column is always the source of truth.
create table scan_findings (
  scan_id      bigint not null references scans (id) on delete cascade,
  rule_id      text   not null,
  kind         text   not null,
  severity     text   not null,
  fingerprint  text   not null,
  surface      text   not null,
  file_path    text,
  line         integer,
  primary key (scan_id, fingerprint)
);

create index scan_findings_rule_idx        on scan_findings (rule_id);
create index scan_findings_fingerprint_idx on scan_findings (fingerprint);

-- -------------------------------------------------------- append-only rule --

create or replace function reject_mutation() returns trigger
language plpgsql
as $$
begin
  raise exception
    'scans is append-only: % on scan id % was rejected. Evidence that can be edited is not evidence.',
    tg_op, coalesce(old.id, new.id)
    using errcode = 'restrict_violation';
end;
$$;

create trigger scans_no_update
  before update on scans
  for each row execute function reject_mutation();

create trigger scans_no_delete
  before delete on scans
  for each row execute function reject_mutation();

-- Deleting an account must still work, for erasure requests. The cascade from
-- repositories would hit the delete trigger, so account deletion runs as a
-- privileged operation that disables the trigger for the duration of the
-- transaction. It removes whole accounts, never individual records.
create or replace function delete_account(target_account_id bigint) returns void
language plpgsql
security definer
as $$
begin
  alter table scans disable trigger scans_no_delete;
  delete from accounts where id = target_account_id;
  alter table scans enable trigger scans_no_delete;
end;
$$;

-- ---------------------------------------------------------------- tokens ---

-- CI needs to authenticate without a browser. Tokens are stored hashed: a
-- database dump must not be a set of working credentials.
create table api_tokens (
  id          bigserial primary key,
  account_id  bigint not null references accounts (id) on delete cascade,
  name        text   not null,
  token_hash  text   not null unique,
  -- First 8 characters, shown in the UI so a token can be identified without
  -- being revealed.
  prefix      text   not null,
  last_used_at timestamptz,
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz
);

create index api_tokens_account_idx on api_tokens (account_id) where revoked_at is null;

-- Dashboard sessions, kept server-side so revocation is immediate.
create table sessions (
  id          text primary key,
  account_id  bigint not null references accounts (id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);

create index sessions_expiry_idx on sessions (expires_at);

-- ---------------------------------------------------------------- exports --

-- Signed evidence exports. Recorded so that a document circulating outside the
-- system can be traced back to the moment it was produced and the range it
-- covered.
create table exports (
  id             bigserial primary key,
  account_id     bigint not null references accounts (id) on delete cascade,
  repository_id  bigint references repositories (id) on delete cascade,
  from_scan_id   bigint references scans (id),
  to_scan_id     bigint references scans (id),
  scan_count     integer not null,
  manifest_hash  text   not null,
  signature      text   not null,
  key_id         text   not null,
  format         text   not null check (format in ('json', 'pdf')),
  created_at     timestamptz not null default now(),
  created_by     bigint references accounts (id)
);

-- -------------------------------------------------------------- policies ---

-- Organisation-wide policy: the Team tier feature that makes a threshold a
-- property of the organisation rather than of whoever edited the config file.
create table policies (
  account_id       bigint primary key references accounts (id) on delete cascade,
  fail_on          text not null default 'serious'
                     check (fail_on in ('minor','moderate','serious','critical','never')),
  fail_on_new_only boolean not null default true,
  required_rules   text[] not null default '{}',
  -- Rules the organisation has decided may not be suppressed locally.
  unsuppressable   text[] not null default '{}',
  updated_at       timestamptz not null default now()
);

-- ------------------------------------------------------------ llm budget ---

-- Token spend per account, logged from the first call. Cheap to add now and
-- impossible to reconstruct later.
create table llm_usage (
  id             bigserial primary key,
  account_id     bigint not null references accounts (id) on delete cascade,
  purpose        text   not null check (purpose in ('explain', 'patch')),
  model          text   not null,
  input_tokens   integer not null,
  output_tokens  integer not null,
  cost_micros    bigint  not null,
  created_at     timestamptz not null default now()
);

create index llm_usage_account_month_idx on llm_usage (account_id, created_at);

commit;
