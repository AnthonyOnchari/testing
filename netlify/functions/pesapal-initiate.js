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
            
            // YOUR IPN ID FROM PESAPAL - REPLACE THIS!
            const IPN_ID = "YOUR_IPN_ID_HERE";  // <-- PUT YOUR IPN ID HERE
            
            // Format phone
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
            
            if (!tokenData.token) {
                throw new Error('Token failed: ' + JSON.stringify(tokenData));
            }
            
            // Submit order with IPN
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
                    notification_id: IPN_ID,
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
            
            if (orderData.order_tracking_id) {
                response.body = JSON.stringify({
                    success: true,
                    redirect_url: orderData.redirect_url,
                    order_tracking_id: orderData.order_tracking_id,
                    message: "STK Push sent! Check your M-Pesa phone."
                });
            } else {
                throw new Error('Order failed: ' + JSON.stringify(orderData));
            }
            
        } catch (error) {
            console.error("Error:", error);
            response.body = JSON.stringify({
                success: false,
                error: error.message,
                simulation: true,
                message: "Payment failed. Please use Manual M-Pesa (Till 8941840)"
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
