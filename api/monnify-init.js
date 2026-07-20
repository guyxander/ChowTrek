const MONNIFY_MODE = process.env.MONNIFY_MODE || process.env.EXPO_PUBLIC_MONNIFY_MODE || 'TEST';
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY || process.env.EXPO_PUBLIC_MONNIFY_API_KEY;
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY;
const MONNIFY_CONTRACT_CODE =
  process.env.MONNIFY_CONTRACT_CODE || process.env.EXPO_PUBLIC_MONNIFY_CONTRACT_CODE;
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://uirbiaursigeohaarrua.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (!MONNIFY_API_KEY || !MONNIFY_SECRET_KEY || !MONNIFY_CONTRACT_CODE || !SUPABASE_SERVICE_ROLE_KEY) {
    response.status(503).send(renderMessage('Card payment is not configured on the server.'));
    return;
  }

  try {
    const payload = readPayload(request);
    const missing = [
      'paymentReference',
      'amount',
      'customerEmail',
      'paymentDescription'
    ].filter((field) => !payload[field]);

    if (missing.length) {
      response.status(400).send(renderMessage('Missing Monnify checkout details. Return to ChowTrek and try again.'));
      return;
    }

    const amount = Number(payload.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      response.status(400).send(renderMessage('Invalid checkout amount. Return to ChowTrek and try again.'));
      return;
    }

    const localPayment = await findLocalPayment(payload.paymentReference);

    if (!localPayment || localPayment.amountNaira !== amount) {
      response.status(404).send(renderMessage('No matching pending ChowTrek payment was found. Return to the app and place the cart again.'));
      return;
    }

    const checkoutUrl = await initializeMonnifyTransaction({
      amount,
      customerEmail: payload.customerEmail,
      customerName: payload.customerName || 'ChowTrek Customer',
      paymentReference: payload.paymentReference,
      paymentDescription: payload.paymentDescription,
      currencyCode: payload.currencyCode || 'NGN',
      purpose: payload.purpose || 'order',
      orderId: payload.orderId || null
    });

    response.writeHead(302, { Location: checkoutUrl });
    response.end();
  } catch (error) {
    response.status(502).send(renderMessage(error instanceof Error ? error.message : 'Unable to start Monnify checkout.'));
  }
};

function readPayload(request) {
  const url = new URL(request.url || '/', 'https://chowtrek-landing.vercel.app');
  return Object.fromEntries(url.searchParams.entries());
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

async function initializeMonnifyTransaction(payload) {
  const token = await getMonnifyAccessToken();
  const baseUrl = getMonnifyBaseUrl();
  const redirectUrl = new URL('/payment-return/', 'https://chowtrek-landing.vercel.app');
  redirectUrl.searchParams.set('provider', 'monnify');
  redirectUrl.searchParams.set('paymentReference', payload.paymentReference);

  const initResponse = await fetch(`${baseUrl}/api/v1/merchant/transactions/init-transaction`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      amount: payload.amount,
      customerEmail: payload.customerEmail,
      customerName: payload.customerName,
      paymentReference: payload.paymentReference,
      paymentDescription: payload.paymentDescription,
      currencyCode: payload.currencyCode,
      contractCode: MONNIFY_CONTRACT_CODE,
      redirectUrl: redirectUrl.toString(),
      paymentMethods: ['CARD', 'ACCOUNT_TRANSFER', 'USSD'],
      metadata: {
        source: 'chowtrek',
        purpose: payload.purpose,
        orderId: payload.orderId
      }
    })
  });
  const result = await readJson(initResponse);

  if (!initResponse.ok || result.requestSuccessful === false) {
    throw new Error(
      result.responseMessage ||
        result.message ||
        `Monnify checkout failed with HTTP ${initResponse.status}.`
    );
  }

  const checkoutUrl = result.responseBody?.checkoutUrl;

  if (!checkoutUrl) {
    throw new Error('Monnify did not return a checkout URL.');
  }

  return checkoutUrl;
}

function supabaseHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };
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

function getMonnifyBaseUrl() {
  return String(MONNIFY_MODE).toUpperCase() === 'LIVE'
    ? 'https://api.monnify.com'
    : 'https://sandbox.monnify.com';
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

function renderMessage(message) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Pay with card - ChowTrek</title></head><body><main style="font-family: sans-serif; padding: 24px;"><h1>Pay with card</h1><p>${escapeHtml(message)}</p></main></body></html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getSupabaseError(payload, fallback) {
  return payload.message || payload.error_description || payload.error || fallback;
}
