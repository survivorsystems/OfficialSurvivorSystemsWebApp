drop policy if exists "Entitled users can read subscriber library files"
  on storage.objects;

create policy "Entitled users can read subscriber library files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'How-To Guides'
    and public.has_library_access()
  );

comment on policy "Entitled users can read subscriber library files" on storage.objects is
  'Allows short-lived signed URLs only for authenticated owners and active subscribers.';
