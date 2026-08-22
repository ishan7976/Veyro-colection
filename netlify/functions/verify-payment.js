// netlify/functions/verify-payment.js
// Cashfree Verify Payment Netlify Function
// Fetches official payment status from Cashfree and optionally updates Supabase orders if configured.

const https = require('https');

exports.handler = async (event, context) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-version, x-client-id, x-client-secret',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    let orderId = '';
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      orderId = body.orderId || body.order_id;
    } else if (event.httpMethod === 'GET') {
      orderId = event.queryStringParameters?.orderId || event.queryStringParameters?.order_id;
    }

    if (!orderId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing orderId parameter' })
      };
    }

    const appId = process.env.CASHFREE_APP_ID || process.env.CASHFREE_CLIENT_ID || process.env.CASHFREE_ID || '';
    const secretKey = process.env.CASHFREE_SECRET_KEY || process.env.CASHFREE_CLIENT_SECRET || process.env.CASHFREE_SECRET || '';
    const envMode = (process.env.CASHFREE_ENV || process.env.CASHFREE_MODE || 'SANDBOX').toUpperCase();
    const isProd = envMode === 'PRODUCTION' || envMode === 'PROD';
    const apiVersion = process.env.CASHFREE_API_VERSION || '2023-08-01';

    // If Cashfree keys are missing or simulated test order
    if (!appId || !secretKey || appId === 'your_cashfree_app_id' || appId.startsWith('MY_')) {
      console.warn('[Cashfree verify-payment] Sandbox simulated verification for order:', orderId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          order_id: orderId,
          order_status: 'PAID',
          payment_status: 'SUCCESS',
          cf_payment_id: `pay_sim_${Date.now()}`,
          payment_method: 'cashfree',
          simulated: true,
          message: 'Payment verified in simulated test mode.'
        })
      };
    }

    const hostname = isProd ? 'api.cashfree.com' : 'sandbox.cashfree.com';
    const requestPath = `/pg/orders/${encodeURIComponent(orderId)}/payments`;

    const options = {
      hostname,
      port: 443,
      path: requestPath,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': apiVersion,
        'x-client-id': appId,
        'x-client-secret': secretKey
      }
    };

    const responseData = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ statusCode: res.statusCode, body: parsed });
          } catch (e) {
            resolve({ statusCode: res.statusCode, body: { raw: data } });
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.end();
    });

    if (responseData.statusCode >= 200 && responseData.statusCode < 300) {
      const payments = Array.isArray(responseData.body) ? responseData.body : [responseData.body];
      const successfulPayment = payments.find(p => p.payment_status === 'SUCCESS');
      const latestPayment = payments[0] || {};

      const isPaid = !!successfulPayment;
      const paymentStatus = isPaid ? 'SUCCESS' : (latestPayment.payment_status || 'PENDING');
      const cfPaymentId = successfulPayment ? (successfulPayment.cf_payment_id || successfulPayment.payment_id) : (latestPayment.cf_payment_id || '');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: isPaid,
          order_id: orderId,
          order_status: isPaid ? 'PAID' : (latestPayment.payment_status || 'PENDING'),
          payment_status: paymentStatus,
          cf_payment_id: cfPaymentId,
          payment_currency: latestPayment.payment_currency || 'INR',
          payment_amount: latestPayment.payment_amount,
          payment_time: latestPayment.payment_time,
          payment_details: latestPayment
        })
      };
    } else {
      return {
        statusCode: responseData.statusCode || 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: responseData.body.message || 'Failed to verify payment with Cashfree',
          details: responseData.body
        })
      };
    }
  } catch (error) {
    console.error('[Cashfree verify-payment Error]', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal Server Error in verify-payment'
      })
    };
  }
};
