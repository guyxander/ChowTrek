-- ChowTrek Quickteller/Interswitch payment patch.
-- Run this after the wallet/profile completion patches if your Supabase project
-- was created before ChowTrek switched from Flutterwave to Quickteller.

alter type public.payment_mode add value if not exists 'quickteller';

alter table public.wallet_top_up_requests
  drop constraint if exists wallet_top_up_requests_provider_check;

alter table public.wallet_top_up_requests
  alter column provider set default 'quickteller',
  add constraint wallet_top_up_requests_provider_check
  check (provider in ('quickteller', 'flutterwave'));

alter table public.transactions
  drop constraint if exists transactions_provider_check;

alter table public.transactions
  alter column provider set default 'quickteller',
  add constraint transactions_provider_check
  check (provider in ('quickteller', 'wallet', 'pay_on_delivery', 'flutterwave'));
