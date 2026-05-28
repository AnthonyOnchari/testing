exports.handler = async (event) => {
    const response = {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        }
    };

    if (event.httpMethod === 'GET') {
        response.body = JSON.stringify({
            status: 'ok',
            message: 'Function is running',
            time: new Date().toISOString()
        });
        return response;
    }

    if (event.httpMethod === 'POST') {
        try {
            let body = JSON.parse(event.body || '{}');
            const { amount, email, phone, reference, customerName } = body;
            
            const CONSUMER_KEY = "WXzl1T/tz7NL0nILHBpm4pbHmudQN/eW";
            const CONSUMER_SECRET = "PJ6cyCt8zr9SeA435v+Py2wXnYo=";
            const PESAPAL_ENDPOINT = "https://pay.pesapal.com/v3";
            const siteUrl = 'https://loquacious-kitten-73b278.netlify.app';
            
            console.log("Processing payment:", { amount, reference, customerName });
            
            // Format phone number
            let formattedPhone = phone.replace(/\s/g, '');
            if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
            if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.substring(1);
            
            // Get access token
            const authString = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
            
            const tokenRes = await fetch(`${PESAPAL_ENDPOINT}/api/Auth/RequestToken`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${authString}`
                },
                body: JSON.stringify({})
            });
            
            const tokenData = await tokenRes.json();
            console.log("Token response status:", tokenRes.status);
            
            if (!tokenData.token) {
                console.error("Token error:", tokenData);
                throw new Error('Authentication failed: ' + JSON.stringify(tokenData));
            }
            
            console.log("✅ Token obtained:", tokenData.token.substring(0, 20) + "...");
            
            // Submit order
            const orderRes = await fetch(`${PESAPAL_ENDPOINT}/api/Transactions/SubmitOrderRequest`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenData.token}`
                },
                body: JSON.stringify({
                    id: reference,
                    currency: "KES",
                    amount: parseFloat(amount),
                    description: `Get Fans Kenya - ${customerName}`,
                    callback_url: `${siteUrl}/.netlify/functions/pesapal-callback`,
                    notification_id: null,
                    branch_name: "Get Fans Kenya",
                    billing_address: {
                        email_address: email,
                        phone_number: formattedPhone,
                        country_code: "KE",
                        first_name: customerName.split(' ')[0] || "Customer",
                        last_name: customerName.split(' ')[1] || "Kenya",
                        line_1: "Nairobi, Kenya"
                    }
                })
            });
            
            const orderData = await orderRes.json();
            console.log("Order response:", orderData);
            
            if (orderData.order_tracking_id) {
                response.body = JSON.stringify({
                    success: true,
                    redirect_url: orderData.redirect_url,
                    order_tracking_id: orderData.order_tracking_id,
                    message: "✅ STK Push sent! Check your M-Pesa phone for the prompt."
                });
            } else {
                throw new Error(orderData.error?.message || 'Order submission failed');
            }
            
        } catch (error) {
            console.error("❌ Error:", error.message);
            response.body = JSON.stringify({
                success: false,
                error: error.message,
                message: "❌ Payment failed. Please use Manual M-Pesa (Till 8941840) instead."
            });
        }
        return response;
    }

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: ''
        };
    }

    response.body = JSON.stringify({ error: 'Use POST or GET' });
    return response;
};
