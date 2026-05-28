// netlify/functions/pesapal-initiate.js
const crypto = require('crypto');

// YOUR PESAPAL CREDENTIALS
const CONSUMER_KEY = "WXzl1T/tz7NL0nILHBpm4pbHmudQN/eW";
const CONSUMER_SECRET = "PJ6cyCt8zr9SeA435v+Py2wXnYo=";
const PESAPAL_ENDPOINT = "https://pay.pesapal.com/v3"; // Live endpoint

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { amount, email, phone, reference, customerName } = JSON.parse(event.body);
        
        // Format phone number
        let formattedPhone = phone.replace(/\s/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.substring(1);
        } else if (formattedPhone.startsWith('+')) {
            formattedPhone = formattedPhone.substring(1);
        }

        // Get site URL from environment or use default
        const siteUrl = process.env.URL || 'https://your-site.netlify.app';
        
        // Step 1: Get Access Token
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
        
        if (!tokenData.token) {
            throw new Error('Failed to get access token');
        }

        const accessToken = tokenData.token;

        // Step 2: Register IPN URL
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
        }

        // Step 3: Submit Order Request
        const callbackUrl = `${siteUrl}/.netlify/functions/pesapal-callback`;
        
        const orderData = {
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

        const submitResponse = await fetch(`${PESAPAL_ENDPOINT}/api/Transactions/SubmitOrderRequest`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(orderData)
        });

        const submitData = await submitResponse.json();

        if (submitData.order_tracking_id) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    redirect_url: submitData.redirect_url,
                    order_tracking_id: submitData.order_tracking_id,
                    message: "STK Push initiated successfully"
                })
            };
        } else {
            throw new Error(submitData.error?.message || 'Failed to initiate payment');
        }

    } catch (error) {
        console.error('PesaPal error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message || 'Payment initialization failed'
            })
        };
    }
};