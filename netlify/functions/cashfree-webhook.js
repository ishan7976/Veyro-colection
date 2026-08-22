// netlify/functions/cashfree-webhook.js
// Cashfree Webhook Handler Netlify Function
// Verifies signature if configured and updates order status

const crypto = require('crypto');
const https = require('https');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-webhook-signature, x-webhook-timestamp',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const rawBody = event.body || '{}';
    const signature = event.headers['x-webhook-signature'] || event.headers['X-Webhook-Signature'];
    const timestamp = event.headers['x-webhook-timestamp'] || event.headers['X-Webhook-Timestamp'];
    const secretKey = process.env.CASHFREE_SECRET_KEY || process.env.CASHFREE_CLIENT_SECRET || '';

    // Verify signature if secret and signature headers are provided
    if (secretKey && signature && timestamp) {
      try {
        const signaturePayload = `${timestamp}${rawBody}`;
        const expectedSignature = crypto
          .createHmac('sha256', secretKey)
          .update(signaturePayload)
          .digest('base64');

        if (expectedSignature !== signature) {
          console.warn('[Cashfree Webhook] Invalid signature mismatch');
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid webhook signature' })
          };
        }
      } catch (sigErr) {
        console.warn('[Cashfree Webhook] Error calculating signature:', sigErr.message);
      }
    }

    const payload = JSON.parse(rawBody);
    console.log('[Cashfree Webhook Received]:', payload.type || payload.event, payload.data?.order?.order_id || payload.orderId);

    const orderId = payload.data?.order?.order_id || payload.orderId;
    const paymentStatus = payload.data?.payment?.payment_status || payload.txStatus;
    const paymentId = payload.data?.payment?.cf_payment_id || payload.referenceId;

    // Optional Supabase Direct Update if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY exist
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseServiceKey && orderId) {
      try {
        const isSuccess = paymentStatus === 'SUCCESS';
        const updateBody = JSON.stringify({
          payment_status: isSuccess ? 'Paid' : 'Failed',
          status: isSuccess ? 'Confirmed' : 'Processing',
          cashfree_payment_id: paymentId ? String(paymentId) : undefined,
          paid_at: isSuccess ? new Date().toISOString() : undefined
        });

        const urlObj = new URL(`${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`);

        await new Promise((resolve) => {
          const req = https.request({
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Prefer': 'return=representation'
            }
          }, (res) => {
            res.on('data', () => {});
            res.on('end', () => resolve(true));
          });
          req.on('error', () => resolve(false));
          req.write(updateBody);
          req.end();
        });
      } catch (supaErr) {
        console.warn('[Cashfree Webhook] Supabase webhook direct update notice:', supaErr.message);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'OK',
        message: 'Cashfree webhook received and processed',
        orderId
      })
    };
  } catch (error) {
    console.error('[Cashfree Webhook Error]:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Webhook processing failed' })
    };
  }
};
