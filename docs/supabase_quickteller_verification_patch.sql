-- ChowTrek verified Quickteller settlement patch.
-- This function is called only by the server-side verifier after Interswitch
-- confirms ResponseCode = 00 and the paid amount matches the original amount.

create or replace function public.confirm_verified_quickteller_payment(
  payment_reference text,
  provider_payment_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  request_role text := coalesce(auth.jwt() ->> 'role', '');
  transaction_record public.transactions%rowtype;
  order_record public.orders%rowtype;
  top_up_record public.wallet_top_up_requests%rowtype;
  wallet_record public.wallets%rowtype;
  merchant_owner_id uuid;
  merchant_wallet_id uuid;
  platform_fee integer;
  merchant_settlement integer;
begin
  if request_role <> 'service_role' then
    raise exception 'Only the server verifier can confirm card payments.';
  end if;

  select *
  into transaction_record
  from public.transactions
  where provider = 'quickteller'
    and provider_reference = payment_reference
  for update;

  if found then
    select *
    into order_record
    from public.orders
    where id = transaction_record.order_id
    for update;

    if not found then
      raise exception 'Order for transaction reference % was not found.', payment_reference;
    end if;

    if transaction_record.status = 'paid' and order_record.payment_status = 'paid' then
      return jsonb_build_object('ok', true, 'kind', 'order', 'status', 'already_paid', 'order_id', order_record.id);
    end if;

    platform_fee := greatest(0, round(order_record.total_naira * 0.08)::integer);
    merchant_settlement := greatest(0, order_record.total_naira - platform_fee);

    update public.transactions
    set status = 'paid',
        platform_fee_naira = platform_fee,
        merchant_settlement_naira = merchant_settlement
    where id = transaction_record.id;

    update public.orders
    set payment_status = 'paid'
    where id = order_record.id;

    select owner_id
    into merchant_owner_id
    from public.merchant_profiles
    where id = order_record.merchant_id;

    if merchant_owner_id is not null then
      insert into public.wallets (user_id, role)
      values (merchant_owner_id, 'merchant')
      on conflict (user_id, role) do nothing;

      select id
      into merchant_wallet_id
      from public.wallets
      where user_id = merchant_owner_id
        and role = 'merchant'
      for update;

      update public.wallets
      set pending_balance_naira = pending_balance_naira + merchant_settlement,
          total_earned_naira = total_earned_naira + merchant_settlement,
          updated_at = now()
      where id = merchant_wallet_id;

      insert into public.wallet_ledger_entries (
        wallet_id,
        user_id,
        order_id,
        direction,
        entry_type,
        amount_naira,
        status,
        note
      )
      values (
        merchant_wallet_id,
        merchant_owner_id,
        order_record.id,
        'credit',
        'merchant_earning',
        merchant_settlement,
        'pending',
        'Verified card payment settlement'
      );
    end if;

    return jsonb_build_object(
      'ok', true,
      'kind', 'order',
      'status', 'paid',
      'order_id', order_record.id,
      'platform_fee_naira', platform_fee,
      'merchant_settlement_naira', merchant_settlement,
      'provider_payment_reference', provider_payment_reference
    );
  end if;

  select *
  into top_up_record
  from public.wallet_top_up_requests
  where provider = 'quickteller'
    and provider_reference = payment_reference
  for update;

  if found then
    select *
    into wallet_record
    from public.wallets
    where id = top_up_record.wallet_id
    for update;

    if not found then
      raise exception 'Wallet for top-up reference % was not found.', payment_reference;
    end if;

    if top_up_record.status = 'paid' then
      return jsonb_build_object('ok', true, 'kind', 'wallet_top_up', 'status', 'already_paid', 'wallet_id', wallet_record.id);
    end if;

    update public.wallet_top_up_requests
    set status = 'paid',
        updated_at = now()
    where id = top_up_record.id;

    update public.wallets
    set available_balance_naira = available_balance_naira + top_up_record.amount_naira,
        updated_at = now()
    where id = wallet_record.id;

    insert into public.wallet_ledger_entries (
      wallet_id,
      user_id,
      direction,
      entry_type,
      amount_naira,
      status,
      note
    )
    values (
      wallet_record.id,
      top_up_record.user_id,
      'credit',
      'top_up',
      top_up_record.amount_naira,
      'available',
      'Verified card wallet top-up'
    );

    return jsonb_build_object(
      'ok', true,
      'kind', 'wallet_top_up',
      'status', 'paid',
      'wallet_id', wallet_record.id,
      'amount_naira', top_up_record.amount_naira,
      'provider_payment_reference', provider_payment_reference
    );
  end if;

  raise exception 'No pending Quickteller order or wallet top-up found for reference %.', payment_reference;
end;
$$;

revoke all on function public.confirm_verified_quickteller_payment(text, text) from public;
revoke execute on function public.confirm_verified_quickteller_payment(text, text) from anon;
revoke execute on function public.confirm_verified_quickteller_payment(text, text) from authenticated;
grant execute on function public.confirm_verified_quickteller_payment(text, text) to service_role;
