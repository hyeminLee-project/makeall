-- RLS 정책 강화: with check 추가로 insert/update 시 본인 user_id만 허용
-- 기존 정책은 using만 있어서 select/delete만 보호됨

-- 기존 정책 삭제 후 재생성 (using + with check)
do $$
declare
  tbl text;
begin
  for tbl in
    select unnest(array[
      'series', 'episodes', 'drafts',
      'automation_templates', 'automation_schedules', 'automation_executions',
      'platform_connections', 'messenger_connections', 'messenger_notifications',
      'publish_history', 'scheduled_publishes'
    ])
  loop
    execute format('drop policy if exists "Users can access own data" on %I', tbl);
    execute format(
      'create policy "Users can access own data" on %I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      tbl
    );
  end loop;
end $$;
