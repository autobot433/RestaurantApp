-- =============================================================================
-- Freshly — reward points RPC
-- =============================================================================
-- Awarding points is a privileged operation: a client must never be able to
-- inflate its own balance. This SECURITY DEFINER function performs the write
-- atomically and is intended to be called from trusted server code using the
-- service_role key (RLS grants clients read-only access to rewards).
--
-- Points model: 1 point per whole dollar spent. Tier is derived from lifetime
-- points thresholds.
-- =============================================================================

create or replace function public.award_reward_points(p_user_id uuid, p_total_cents int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  earned int := greatest(0, floor(p_total_cents / 100.0))::int;
  new_points int;
begin
  insert into public.rewards (user_id, points)
  values (p_user_id, earned)
  on conflict (user_id)
    do update set points = public.rewards.points + earned,
                  updated_at = now()
  returning points into new_points;

  update public.rewards
    set tier = case
                 when new_points >= 2000 then 'platinum'
                 when new_points >= 1000 then 'gold'
                 when new_points >= 400  then 'silver'
                 else 'bronze'
               end
    where user_id = p_user_id;
end;
$$;

-- Only trusted server roles may execute it.
revoke all on function public.award_reward_points(uuid, int) from public, anon, authenticated;
grant execute on function public.award_reward_points(uuid, int) to service_role;
