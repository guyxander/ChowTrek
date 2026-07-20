const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://uirbiaursigeohaarrua.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MONNIFY_MODE = process.env.MONNIFY_MODE || process.env.EXPO_PUBLIC_MONNIFY_MODE || 'TEST';
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY || process.env.EXPO_PUBLIC_MONNIFY_API_KEY;
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY;

module.exports = async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Cache-Control', 'no-store');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  if (!SUPABASE_SERVICE_ROLE_KEY || !MONNIFY_API_KEY || !MONNIFY_SECRET_KEY) {
    response.status(503).json({
      ok: false,
      message: 'Monnify payment verification is not configured on the server.'
    });
    return;
  }

  try {
    const payload = await readPayload(request);
    const reference = normalizeReference(payload);

    if (!reference) {
      response.status(400).json({ ok: false, message: 'Missing Monnify payment reference.' });
      return;
    }

    const localPayment = await findLocalPayment(reference);

    if (!localPayment) {
      response.status(404).json({
        ok: false,
        message: 'No pending ChowTrek Monnify payment was found for this reference.'
      });
      return;
    }

    const verification = await verifyWithMonnify(reference);
    const body = verification.responseBody ?? {};
    const paymentStatus = String(body.paymentStatus ?? '').toUpperCase();
    const amountPaid = Number(body.amountPaid ?? 0);

    if (!['PAID', 'OVERPAID'].includes(paymentStatus) || amountPaid < localPayment.amountNaira) {
      response.status(402).json({
        ok: false,
        message: `Monnify payment is ${paymentStatus || 'not paid'} or amount did not match.`,
        paymentStatus,
        expectedAmount: localPayment.amountNaira,
        amountPaid
      });
      return;
    }

    const settlement = await callSettlementRpc(reference, body.transactionReference || payload.transactionReference || null);

    response.status(200).json({
      ok: true,
      message: 'Payment verified.',
      reference,
      settlement
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Monnify payment verification failed.'
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
    payload.paymentReference ||
    payload.paymentreference ||
    payload.payment_ref ||
    payload.reference ||
    ''
  );
}

async function findLocalPayment(reference) {
  const headers = supabaseHeaders();
  const transactionUrl = new URL(`${SUPABASE_URL}/rest/v1/transactions`);
  transactionUrl.searchParams.set('provider', 'eq.monnify');
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
  topUpUrl.searchParams.set('provider', 'eq.monnify');
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

async function verifyWithMonnify(reference) {
  const token = await getMonnifyAccessToken();
  const url = new URL('/api/v2/merchant/transactions/query', getMonnifyBaseUrl());
  url.searchParams.set('paymentReference', reference);

  const verificationResponse = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });
  const verification = await readJson(verificationResponse);

  if (!verificationResponse.ok || verification.requestSuccessful === false) {
    throw new Error(
      verification.responseMessage ||
        verification.message ||
        `Monnify verification failed with HTTP ${verificationResponse.status}.`
    );
  }

  return verification;
}

async function getMonnifyAccessToken() {
  const credentials = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString('base64');
  const authResponse = await fetch(`${getMonnifyBaseUrl()}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: 'application/json'
    }
  });
  const result = await readJson(authResponse);

  if (!authResponse.ok || result.requestSuccessful === false || !result.responseBody?.accessToken) {
    throw new Error(result.responseMessage || result.message || 'Monnify authentication failed.');
  }

  return result.responseBody.accessToken;
}

async function callSettlementRpc(reference, providerPaymentReference) {
  const rpcResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/confirm_verified_monnify_payment`, {
    method: 'POST',
    headers: supabaseHeaders(),
    body: JSON.stringify({
      payment_reference: reference,
      provider_payment_reference: providerPaymentReference
    })
  });
  const settlement = await readJson(rpcResponse);

  if (!rpcResponse.ok) {
    throw new Error(getSupabaseError(settlement, 'Unable to settle verified Monnify payment.'));
  }

  return settlement;
}

function getMonnifyBaseUrl() {
  return String(MONNIFY_MODE).toUpperCase() === 'LIVE'
    ? 'https://api.monnify.com'
    : 'https://sandbox.monnify.com';
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
