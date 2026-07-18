const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://uirbiaursigeohaarrua.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const QUICKTELLER_MODE =
  process.env.QUICKTELLER_MODE ||
  process.env.EXPO_PUBLIC_QUICKTELLER_MODE ||
  'TEST';
const QUICKTELLER_MERCHANT_CODE =
  process.env.QUICKTELLER_MERCHANT_CODE ||
  process.env.EXPO_PUBLIC_QUICKTELLER_MERCHANT_CODE;

module.exports = async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Cache-Control', 'no-store');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  if (!SUPABASE_SERVICE_ROLE_KEY || !QUICKTELLER_MERCHANT_CODE) {
    response.status(503).json({
      ok: false,
      message: 'Card payment verification is not configured on the server.'
    });
    return;
  }

  try {
    const payload = await readPayload(request);
    const reference = normalizeReference(payload);

    if (!reference) {
      response.status(400).json({ ok: false, message: 'Missing transaction reference.' });
      return;
    }

    const localPayment = await findLocalPayment(reference);

    if (!localPayment) {
      response.status(404).json({
        ok: false,
        message: 'No pending ChowTrek card payment was found for this reference.'
      });
      return;
    }

    const amountKobo = localPayment.amountNaira * 100;
    const verification = await verifyWithInterswitch(reference, amountKobo);
    const verifiedAmount = Number(verification.Amount ?? verification.amount ?? 0);
    const responseCode = String(verification.ResponseCode ?? verification.responseCode ?? '');

    if (responseCode !== '00' || verifiedAmount !== amountKobo) {
      response.status(402).json({
        ok: false,
        message: verification.ResponseDescription || 'Card payment was not approved or amount did not match.',
        responseCode,
        expectedAmount: amountKobo,
        verifiedAmount
      });
      return;
    }

    const settlement = await callSettlementRpc(
      reference,
      verification.PaymentReference || verification.paymentReference || payload.payRef || payload.payref || null
    );

    response.status(200).json({
      ok: true,
      message: 'Payment verified.',
      reference,
      settlement
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Payment verification failed.'
    });
  }
};

async function readPayload(request) {
  const url = new URL(request.url || '/', 'https://chowtrek-landing.vercel.app');
  const payload = Object.fromEntries(url.searchParams.entries());

  if (request.method === 'POST') {
    const body = await readBody(request);

    if (body) {
      try {
        Object.assign(payload, JSON.parse(body));
      } catch (error) {
        Object.assign(payload, Object.fromEntries(new URLSearchParams(body).entries()));
      }
    }
  }

  return payload;
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function normalizeReference(payload) {
  return (
    payload.txn_ref ||
    payload.txnref ||
    payload.txnRef ||
    payload.transactionreference ||
    payload.transactionReference ||
    payload.MerchantReference ||
    payload.merchantReference ||
    ''
  );
}

async function findLocalPayment(reference) {
  const headers = supabaseHeaders();
  const transactionUrl = new URL(`${SUPABASE_URL}/rest/v1/transactions`);
  transactionUrl.searchParams.set('provider', 'eq.quickteller');
  transactionUrl.searchParams.set('provider_reference', `eq.${reference}`);
  transactionUrl.searchParams.set('select', 'amount_naira,status');
  transactionUrl.searchParams.set('limit', '1');

  const transactionResponse = await fetch(transactionUrl, { headers });
  const transactions = await readJson(transactionResponse);

  if (!transactionResponse.ok) {
    throw new Error(getSupabaseError(transactions, 'Unable to read payment transaction.'));
  }

  if (transactions[0]) {
    return {
      kind: 'order',
      amountNaira: Number(transactions[0].amount_naira)
    };
  }

  const topUpUrl = new URL(`${SUPABASE_URL}/rest/v1/wallet_top_up_requests`);
  topUpUrl.searchParams.set('provider', 'eq.quickteller');
  topUpUrl.searchParams.set('provider_reference', `eq.${reference}`);
  topUpUrl.searchParams.set('select', 'amount_naira,status');
  topUpUrl.searchParams.set('limit', '1');

  const topUpResponse = await fetch(topUpUrl, { headers });
  const topUps = await readJson(topUpResponse);

  if (!topUpResponse.ok) {
    throw new Error(getSupabaseError(topUps, 'Unable to read wallet top-up request.'));
  }

  if (topUps[0]) {
    return {
      kind: 'wallet_top_up',
      amountNaira: Number(topUps[0].amount_naira)
    };
  }

  return null;
}

async function verifyWithInterswitch(reference, amountKobo) {
  const baseUrl =
    String(QUICKTELLER_MODE).toUpperCase() === 'LIVE'
      ? 'https://webpay.interswitchng.com'
      : 'https://qa.interswitchng.com';
  const url = new URL('/collections/api/v1/gettransaction.json', baseUrl);
  url.searchParams.set('merchantcode', QUICKTELLER_MERCHANT_CODE);
  url.searchParams.set('transactionreference', reference);
  url.searchParams.set('amount', String(amountKobo));

  const verificationResponse = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });
  const verification = await readJson(verificationResponse);

  if (!verificationResponse.ok) {
    throw new Error(
      verification.ResponseDescription ||
        verification.message ||
        `Interswitch verification failed with HTTP ${verificationResponse.status}.`
    );
  }

  return verification;
}

async function callSettlementRpc(reference, providerPaymentReference) {
  const rpcResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/confirm_verified_quickteller_payment`, {
    method: 'POST',
    headers: supabaseHeaders(),
    body: JSON.stringify({
      payment_reference: reference,
      provider_payment_reference: providerPaymentReference
    })
  });
  const settlement = await readJson(rpcResponse);

  if (!rpcResponse.ok) {
    throw new Error(getSupabaseError(settlement, 'Unable to settle verified payment.'));
  }

  return settlement;
}

function supabaseHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };
}

async function readJson(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: text };
  }
}

function getSupabaseError(payload, fallback) {
  return payload.message || payload.error_description || payload.error || fallback;
}
