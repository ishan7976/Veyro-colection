// netlify/functions/create-payment-order.js
// Cashfree Create Order Netlify Function
// IMPORTANT: Uses standard Node.js CJS, process.env only, never imports Vite or frontend code.

const https = require('https');

exports.handler = async (event, context) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-version, x-client-id, x-client-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      orderId,
      orderAmount,
      customerName,
      customerEmail,
      customerPhone,
      customerId,
      returnUrl,
      items
    } = body;

    if (!orderId || !orderAmount || !customerEmail || !customerPhone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required parameters: orderId, orderAmount, customerEmail, and customerPhone are required.'
        })
      };
    }

    const appId = process.env.CASHFREE_APP_ID || process.env.CASHFREE_CLIENT_ID || process.env.CASHFREE_ID || '';
    const secretKey = process.env.CASHFREE_SECRET_KEY || process.env.CASHFREE_CLIENT_SECRET || process.env.CASHFREE_SECRET || '';
    const envMode = (process.env.CASHFREE_ENV || process.env.CASHFREE_MODE || 'SANDBOX').toUpperCase();
    const isProd = envMode === 'PRODUCTION' || envMode === 'PROD';
    const apiVersion = process.env.CASHFREE_API_VERSION || '2023-08-01';

    // Format phone to 10 digits for Cashfree
    let sanitizedPhone = String(customerPhone).replace(/\D/g, '');
    if (sanitizedPhone.length > 10) {
      sanitizedPhone = sanitizedPhone.slice(-10);
    }
    if (sanitizedPhone.length < 10) {
      sanitizedPhone = sanitizedPhone.padStart(10, '9');
    }

    // Sanitize customer ID (alphanumeric and underscores)
    const sanitizedCustomerId = String(customerId || customerEmail.split('@')[0] || 'cust_' + Date.now())
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 45);

    // Format amount to 2 decimal places
    const formattedAmount = Number(orderAmount).toFixed(2);

    // Safe return URL: use passed returnUrl or placeholder
    const defaultReturnUrl = returnUrl || `https://veyro.netlify.app/checkout?order_id={order_id}&cf_token={order_token}`;

    const cashfreePayload = {
      order_id: String(orderId),
      order_amount: parseFloat(formattedAmount),
      order_currency: 'INR',
      customer_details: {
        customer_id: sanitizedCustomerId,
        customer_name: customerName || 'Customer',
        customer_email: customerEmail,
        customer_phone: sanitizedPhone
      },
      order_meta: {
        return_url: defaultReturnUrl,
        notify_url: process.env.CASHFREE_WEBHOOK_URL || undefined,
        payment_methods: 'cc,dc,upi,netbanking,paylater'
      },
      order_note: `VEYRO Streetwear Order #${orderId}`
    };

    // If Cashfree keys are not configured yet, provide a graceful test response
    if (!appId || !secretKey || appId === 'your_cashfree_app_id' || appId.startsWith('MY_')) {
      console.warn('[Cashfree create-payment-order] Cashfree credentials not configured. Generating simulated test session.');
      const simulatedSessionId = `session_sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          simulated: true,
          order_id: orderId,
          payment_session_id: simulatedSessionId,
          order_status: 'ACTIVE',
          environment: 'SANDBOX',
          message: 'Cashfree test mode order created. Configure CASHFREE_APP_ID and CASHFREE_SECRET_KEY in environment variables for live gateway.'
        })
      };
    }

    const hostname = isProd ? 'api.cashfree.com' : 'sandbox.cashfree.com';
    const requestPath = '/pg/orders';

    const postData = JSON.stringify(cashfreePayload);

    const options = {
      hostname,
      port: 443,
      path: requestPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': apiVersion,
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'Content-Length': Buffer.byteLength(postData)
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
      req.write(postData);
      req.end();
    });

    if (responseData.statusCode >= 200 && responseData.statusCode < 300) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          order_id: responseData.body.order_id || orderId,
          payment_session_id: responseData.body.payment_session_id,
          order_status: responseData.body.order_status,
          cf_order_id: responseData.body.cf_order_id,
          environment: isProd ? 'PRODUCTION' : 'SANDBOX'
        })
      };
    } else {
      console.error('[Cashfree API Error Response]', responseData.statusCode, responseData.body);
      return {
        statusCode: responseData.statusCode || 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: responseData.body.message || responseData.body.error || 'Failed to create Cashfree order',
          details: responseData.body
        })
      };
    }
  } catch (error) {
    console.error('[Cashfree create-payment-order Error]', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal Server Error in create-payment-order'
      })
    };
  }
};
