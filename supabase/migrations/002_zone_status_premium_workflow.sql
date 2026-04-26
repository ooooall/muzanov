alter table public.zone_states alter column status drop default;

alter table public.zone_states
alter column status type text using status::text;

update public.zone_states
set status = case status
  when 'idle' then 'new'
  when 'scheduled' then 'new'
  when 'paused' then 'in_progress'
  when 'attention' then 'review'
  when 'completed' then 'done'
  when 'rework' then 'review'
  else status
end;

drop type if exists public.zone_status;

create type public.zone_status as enum ('new', 'in_progress', 'review', 'done');

alter table public.zone_states
alter column status type public.zone_status
using status::public.zone_status;

alter table public.zone_states
alter column status set default 'new';
