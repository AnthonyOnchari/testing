// netlify/functions/pesapal-initiate.js
const https = require('https');

exports.handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { amount, email, phone, reference, customerName } = JSON.parse(event.body);
        
        console.log("=== PESAPAL PAYMENT INITIATION ===");
        console.log("Amount:", amount, "KES");
        console.log("Reference:", reference);
        console.log("Customer:", customerName);
        console.log("Email:", email);
        console.log("Phone:", phone);
        
        // Format phone number for PesaPal
        let formattedPhone = phone.replace(/\s/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.substring(1);
        } else if (formattedPhone.startsWith('+')) {
            formattedPhone = formattedPhone.substring(1);
        }
        
        // Use LIVE endpoint since you have live credentials
        const PESAPAL_ENDPOINT = "https://pay.pesapal.com/v3";
        const CONSUMER_KEY = "WXzl1T/tz7NL0nILHBpm4pbHmudQN/eW";
        const CONSUMER_SECRET = "PJ6cyCt8zr9SeA435v+Py2wXnYo=";
        
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
        console.log("Token Response:", JSON.stringify(tokenData));
        
        if (!tokenData.token) {
            throw new Error(`Failed to get token: ${JSON.stringify(tokenData)}`);
        }
        
        const accessToken = tokenData.token;
        console.log("✅ Access token obtained");
        
        // Step 2: Register IPN (Instant Payment Notification)
        console.log("Step 2: Registering IPN...");
        
        const ipnUrl = `${siteUrl}/.netlify/functions/pesapal-ipn`;
        
        const ipnResponse = await fetch(`${PESAPAL_ENDPOINT}/api/URLSetup/RegisterIPN`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                url: ipnUrl,
                ipn_notification_type: "GET"
            })
        });
        
        let ipnId = null;
        if (ipnResponse.ok) {
            const ipnData = await ipnResponse.json();
            ipnId = ipnData.ipn_id;
            console.log("✅ IPN Registered:", ipnId);
        } else {
            console.log("IPN registration skipped, continuing without IPN");
        }
        
        // Step 3: Submit Order
        console.log("Step 3: Submitting order...");
        
        const callbackUrl = `${siteUrl}/.netlify/functions/pesapal-callback`;
        
        const orderRequest = {
            id: reference,
            currency: "KES",
            amount: amount,
            description: `Social Media Growth - ${customerName}`,
            callback_url: callbackUrl,
            notification_id: ipnId,
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
        
        console.log("Order Request:", JSON.stringify(orderRequest));
        
        const orderResponse = await fetch(`${PESAPAL_ENDPOINT}/api/Transactions/SubmitOrderRequest`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(orderRequest)
        });
        
        const orderData = await orderResponse.json();
        console.log("Order Response:", JSON.stringify(orderData));
        
        if (orderData.order_tracking_id) {
            // Construct the redirect URL for STK Push
            const redirectUrl = orderData.redirect_url || `${PESAPAL_ENDPOINT}/api/Transactions/Redirect?order_tracking_id=${orderData.order_tracking_id}`;
            
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    success: true,
                    redirect_url: redirectUrl,
                    order_tracking_id: orderData.order_tracking_id,
                    merchant_reference: reference,
                    message: "STK Push initiated. Check your phone."
                })
            };
        } else {
            throw new Error(orderData.error?.message || 'Failed to create order');
        }
        
    } catch (error) {
        console.error("❌ Error:", error);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                error: error.message,
                details: "Check function logs for more information"
            })
        };
    }
};