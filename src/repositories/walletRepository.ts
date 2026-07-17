import { supabase } from "../lib/supabase";
import { WalletLedgerEntry, WalletRole, WalletSummary } from "../types/domain";

type WalletRow = {
  id: string;
  role: WalletRole;
  available_balance_naira: number | null;
  pending_balance_naira: number | null;
  total_earned_naira: number | null;
  virtual_account_provider: string | null;
  virtual_account_number: string | null;
  saved_bank_name: string | null;
  saved_bank_last4: string | null;
};

type LedgerRow = {
  id: string;
  amount_naira: number;
  direction: "credit" | "debit";
  entry_type: string;
  status: "pending" | "available" | "paid" | "failed";
  note: string | null;
  created_at: string;
};

export type WalletResult = {
  ok: boolean;
  message: string;
};

const demoBalances: Record<WalletRole, number> = {
  customer: 0,
  merchant: 18400,
  agent: 6200,
  admin: 3250
};

export async function loadWalletSummary(role: WalletRole): Promise<WalletSummary> {
  if (!supabase) {
    return buildDemoWallet(role, "Supabase is not configured. Showing local wallet preview.");
  }

  const userResult = await supabase.auth.getUser();
  const user = userResult.data.user;

  if (!user) {
    return buildDemoWallet(role, "Sign in with Google to sync this wallet.");
  }

  const walletResult = await supabase
    .from("wallets")
    .select(
      "id,role,available_balance_naira,pending_balance_naira,total_earned_naira,virtual_account_provider,virtual_account_number,saved_bank_name,saved_bank_last4"
    )
    .eq("user_id", user.id)
    .eq("role", role)
    .maybeSingle();

  if (walletResult.error) {
    return buildDemoWallet(
      role,
      `Wallet schema is not live yet: ${walletResult.error.message}. Run docs/supabase_wallet_patch.sql.`
    );
  }

  let wallet = walletResult.data as WalletRow | null;

  if (!wallet) {
    const createResult = await supabase
      .from("wallets")
      .insert({ user_id: user.id, role })
      .select(
        "id,role,available_balance_naira,pending_balance_naira,total_earned_naira,virtual_account_provider,virtual_account_number,saved_bank_name,saved_bank_last4"
      )
      .single();

    if (createResult.error) {
      return buildDemoWallet(role, `Wallet creation is not allowed yet: ${createResult.error.message}`);
    }

    wallet = createResult.data as WalletRow;
  }

  const ledgerResult = await supabase
    .from("wallet_ledger_entries")
    .select("id,amount_naira,direction,entry_type,status,note,created_at")
    .eq("wallet_id", wallet.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const ledgerRows = ledgerResult.error ? [] : ((ledgerResult.data ?? []) as LedgerRow[]);

  return {
    role,
    availableBalanceNaira: wallet.available_balance_naira ?? 0,
    pendingBalanceNaira: wallet.pending_balance_naira ?? 0,
    totalEarnedNaira: wallet.total_earned_naira ?? 0,
    virtualAccount:
      wallet.virtual_account_provider && wallet.virtual_account_number
        ? `${wallet.virtual_account_provider} • ${wallet.virtual_account_number}`
        : "Wallet account pending",
    savedBank:
      wallet.saved_bank_name && wallet.saved_bank_last4
        ? `${wallet.saved_bank_name} (••••${wallet.saved_bank_last4})`
        : "No withdrawal bank saved",
    message: ledgerResult.error
      ? `Wallet loaded, but ledger is unavailable: ${ledgerResult.error.message}`
      : "Wallet synced with Supabase.",
    ledger: ledgerRows.map(mapLedger)
  };
}

export async function requestWalletWithdrawal(
  role: WalletRole,
  amountNaira: number
): Promise<WalletResult> {
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured for withdrawals." };
  }

  const userResult = await supabase.auth.getUser();
  const user = userResult.data.user;

  if (!user) {
    return { ok: false, message: "Sign in with Google before requesting a withdrawal." };
  }

  const walletResult = await supabase
    .from("wallets")
    .select("id,available_balance_naira")
    .eq("user_id", user.id)
    .eq("role", role)
    .maybeSingle();

  if (walletResult.error || !walletResult.data) {
    return {
      ok: false,
      message: walletResult.error?.message ?? "Create this wallet before withdrawal."
    };
  }

  const balance = Number(walletResult.data.available_balance_naira ?? 0);

  if (amountNaira <= 0 || amountNaira > balance) {
    return { ok: false, message: "Withdrawal amount must be within the available balance." };
  }

  const requestResult = await supabase.from("wallet_withdrawal_requests").insert({
    wallet_id: walletResult.data.id,
    user_id: user.id,
    amount_naira: amountNaira,
    status: "pending"
  });

  if (requestResult.error) {
    return { ok: false, message: `Withdrawal request failed: ${requestResult.error.message}` };
  }

  return {
    ok: true,
    message: "Withdrawal request submitted. Admin review will release funds to the saved bank."
  };
}

function mapLedger(row: LedgerRow): WalletLedgerEntry {
  return {
    id: row.id,
    label: row.note ?? row.entry_type.replace(/_/g, " "),
    amountNaira: row.amount_naira,
    direction: row.direction,
    status:
      row.status === "available"
        ? "Available"
        : row.status === "paid"
          ? "Paid"
          : row.status === "failed"
            ? "Failed"
            : "Pending",
    createdAt: row.created_at
  };
}

function buildDemoWallet(role: WalletRole, message: string): WalletSummary {
  const balance = demoBalances[role];

  return {
    role,
    availableBalanceNaira: balance,
    pendingBalanceNaira: role === "customer" ? 0 : Math.round(balance * 0.22),
    totalEarnedNaira: role === "customer" ? balance : Math.round(balance * 1.6),
    virtualAccount: role === "customer" ? "ChowTrek Wallet • Pending" : "ChowTrek Settlements • Pending",
    savedBank: "No withdrawal bank saved",
    message,
    ledger: [
      {
        id: `${role}-preview-credit`,
        label: role === "customer" ? "Wallet top up preview" : "Accrued ChowTrek earnings",
        amountNaira: Math.max(balance, 1500),
        direction: "credit",
        status: "Available",
        createdAt: new Date().toISOString()
      }
    ]
  };
}
