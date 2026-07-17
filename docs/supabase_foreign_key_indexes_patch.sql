-- Adds covering indexes for foreign keys flagged by Supabase advisors.
-- Run after the base schema and incremental feature patches.

create index if not exists addresses_user_id_idx on public.addresses(user_id);
create index if not exists comments_author_id_idx on public.comments(author_id);
create index if not exists comments_post_id_idx on public.comments(post_id);
create index if not exists community_posts_author_id_idx on public.community_posts(author_id);
create index if not exists community_posts_merchant_id_idx on public.community_posts(merchant_id);
create index if not exists deliveries_agent_id_idx on public.deliveries(agent_id);
create index if not exists deliveries_order_id_idx on public.deliveries(order_id);
create index if not exists delivery_agent_profiles_user_id_idx on public.delivery_agent_profiles(user_id);
create index if not exists merchant_profiles_owner_id_idx on public.merchant_profiles(owner_id);
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists order_items_product_id_idx on public.order_items(product_id);
create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists orders_merchant_id_idx on public.orders(merchant_id);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_merchant_id_idx on public.products(merchant_id);
create index if not exists ratings_agent_id_idx on public.ratings(agent_id);
create index if not exists ratings_customer_id_idx on public.ratings(customer_id);
create index if not exists ratings_merchant_id_idx on public.ratings(merchant_id);
create index if not exists ratings_order_id_idx on public.ratings(order_id);
create index if not exists transactions_order_id_idx on public.transactions(order_id);
create index if not exists vendor_followers_merchant_id_idx on public.vendor_followers(merchant_id);
create index if not exists vendor_timeline_events_merchant_id_idx on public.vendor_timeline_events(merchant_id);
create index if not exists vendor_timeline_events_product_id_idx on public.vendor_timeline_events(product_id);
create index if not exists wallet_ledger_entries_order_id_idx on public.wallet_ledger_entries(order_id);
create index if not exists wallet_ledger_entries_user_id_idx on public.wallet_ledger_entries(user_id);
create index if not exists wallet_ledger_entries_wallet_id_idx on public.wallet_ledger_entries(wallet_id);
create index if not exists wallet_withdrawal_requests_reviewed_by_idx on public.wallet_withdrawal_requests(reviewed_by);
create index if not exists wallet_withdrawal_requests_user_id_idx on public.wallet_withdrawal_requests(user_id);
create index if not exists wallet_withdrawal_requests_wallet_id_idx on public.wallet_withdrawal_requests(wallet_id);
