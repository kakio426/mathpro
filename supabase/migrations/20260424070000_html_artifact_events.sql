alter table public.session_events
drop constraint if exists session_events_event_type_check;

alter table public.session_events
add constraint session_events_event_type_check
check (
  event_type in (
    'ready',
    'interaction',
    'select',
    'drag-end',
    'drop',
    'submit',
    'hint-open',
    'retry',
    'free-text-submit',
    'complete'
  )
);
