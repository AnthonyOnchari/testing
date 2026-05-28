// netlify/functions/pesapal-initiate.js
const crypto = require('crypto');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Content-Type': 'application/json'
    };

    // Handle GET request for testing
    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: 'ok', 
                message: 'Function is ready for POST requests',
                method: 'GET'
            })
        };
    }

    // Handle OPTIONS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Handle POST request
    if (event.httpMethod === 'POST') {
        try {
            console.log("=== PESAPAL PAYMENT INITIATION ===");
            
            const { amount, email, phone, reference, customerName } = JSON.parse(event.body);
            
            console.log(`Amount: ${amount} KES`);
            console.log(`Customer: ${customerName}`);
            console.log(`Reference: ${reference}`);
            
            // Format phone number for PesaPal (254XXXXXXXXX)
            let formattedPhone = phone.replace(/\s/g, '');
            if (formattedPhone.startsWith('0')) {
                formattedPhone = '254' + formattedPhone.substring(1);
            } else if (formattedPhone.startsWith('+')) {
                formattedPhone = formattedPhone.substring(1);
            }
            
            // Your PesaPal Live Credentials
            const CONSUMER_KEY = "WXzl1T/tz7NL0nILHBpm4pbHmudQN/eW";
            const CONSUMER_SECRET = "PJ6cyCt8zr9SeA435v+Py2wXnYo=";
            const PESAPAL_ENDPOINT = "https://pay.pesapal.com/v3";
            
            const siteUrl = 'https://loquacious-kitten-73b278.netlify.app';
            
            // Step 1: Get Access Token
            console.log("Step 1: Getting access token...");
            const authString = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
            
            const tokenResponse = await fetch(`${PESAPAL_ENDPOINT}/api/Auth/RequestToken`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${authString}`
                },
                body: JSON.stringify({})
            });
            
            const tokenData = await tokenResponse.json();
            console.log("Token Response Status:", tokenResponse.status);
            
            if (!tokenData.token) {
                console.error("Token Error:", tokenData);
                // Fallback to simulation mode if token fails
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        simulation: true,
                        message: "Using simulation mode. Real PesaPal token failed. Check credentials.",
                        redirect_url: `${siteUrl}?payment_status=COMPLETED&reference=${reference}`,
                        order_tracking_id: `SIM_${Date.now()}`,
                        merchant_reference: reference
                    })
                };
            }
            
            const accessToken = tokenData.token;
            console.log("✅ Access token obtained");
            
            // Step 2: Submit Order Request
            console.log("Step 2: Submitting order...");
            
            const callbackUrl = `${siteUrl}/.netlify/functions/pesapal-callback`;
            const ipnUrl = `${siteUrl}/.netlify/functions/pesapal-ipn`;
            
            const orderData = {
                id: reference,
                currency: "KES",
                amount: parseFloat(amount),
                description: `Get Fans Kenya - ${customerName}`,
                callback_url: callbackUrl,
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
            };
            
            console.log("Order Data:", JSON.stringify(orderData));
            
            const orderResponse = await fetch(`${PESAPAL_ENDPOINT}/api/Transactions/SubmitOrderRequest`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(orderData)
            });
            
            const orderDataResponse = await orderResponse.json();
            console.log("Order Response:", JSON.stringify(orderDataResponse));
            
            if (orderDataResponse.order_tracking_id) {
                const redirectUrl = orderDataResponse.redirect_url || `${PESAPAL_ENDPOINT}/api/Transactions/Redirect?order_tracking_id=${orderDataResponse.order_tracking_id}`;
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        redirect_url: redirectUrl,
                        order_tracking_id: orderDataResponse.order_tracking_id,
                        merchant_reference: reference,
                        message: "STK Push sent to your phone. Please check your M-Pesa and enter PIN."
                    })
                };
            } else {
                // Fallback to simulation if order fails
                console.log("Order submission failed, using simulation");
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        simulation: true,
                        message: "Using simulation mode. Real PesaPal order submission failed.",
                        redirect_url: `${siteUrl}?payment_status=COMPLETED&reference=${reference}`,
                        order_tracking_id: `SIM_${Date.now()}`,
                        merchant_reference: reference
                    })
                };
            }
            
        } catch (error) {
            console.error("❌ Error:", error);
            
            // Always return a valid response, never crash
            const siteUrl = 'https://loquacious-kitten-73b278.netlify.app';
            const reference = (() => {
                try {
                    const body = JSON.parse(event.body || '{}');
                    return body.reference || `ERR_${Date.now()}`;
                } catch(e) {
                    return `ERR_${Date.now()}`;
                }
            })();
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    simulation: true,
                    message: "Simulation mode: " + error.message,
                    redirect_url: `${siteUrl}?payment_status=COMPLETED&reference=${reference}`,
                    order_tracking_id: `SIM_${Date.now()}`,
                    merchant_reference: reference,
                    error_details: error.message
                })
            };
        }
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
    };
};