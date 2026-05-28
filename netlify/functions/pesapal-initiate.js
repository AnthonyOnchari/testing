// netlify/functions/pesapal-initiate.js
exports.handler = async (event, context) => {
    // Handle OPTIONS preflight request for CORS
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

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Method not allowed. Use POST.' })
        };
    }

    try {
        console.log("📱 PesaPal Initiate Function Called");
        console.log("Request body:", event.body);
        
        const { amount, email, phone, reference, customerName } = JSON.parse(event.body);
        
        console.log(`Processing payment: ${amount} KES for ${customerName} (${reference})`);
        
        // Format phone number
        let formattedPhone = phone.replace(/\s/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.substring(1);
        } else if (formattedPhone.startsWith('+')) {
            formattedPhone = formattedPhone.substring(1);
        }

        // Your PesaPal credentials
        const CONSUMER_KEY = "WXzl1T/tz7NL0nILHBpm4pbHmudQN/eW";
        const CONSUMER_SECRET = "PJ6cyCt8zr9SeA435v+Py2wXnYo=";
        
        // Use Sandbox for testing first
        const PESAPAL_ENDPOINT = "https://cybqa.pesapal.com/pesapalv3";
        // For production, change to: "https://pay.pesapal.com/v3"
        
        // Get the site URL from environment or use the hardcoded one
        let siteUrl = process.env.URL || 'https://loquacious-kitten-73b278.netlify.app';
        if (!siteUrl.startsWith('http')) {
            siteUrl = 'https://' + siteUrl;
        }
        siteUrl = siteUrl.replace(/\/$/, '');
        
        console.log(`Site URL: ${siteUrl}`);
        
        // Step 1: Get Access Token
        console.log("Getting access token...");
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
            console.error("Token error:", tokenData);
            throw new Error('Failed to get access token');
        }

        const accessToken = tokenData.token;
        console.log("✅ Access token obtained");

        // Step 2: Register IPN URL (optional but recommended)
        const ipnUrl = `${siteUrl}/.netlify/functions/pesapal-ipn`;
        
        let ipnId = null;
        try {
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

            if (ipnResponse.ok) {
                const ipnData = await ipnResponse.json();
                ipnId = ipnData.ipn_id;
                console.log("✅ IPN registered with ID:", ipnId);
            }
        } catch (ipnError) {
            console.log("IPN registration skipped:", ipnError.message);
        }

        // Step 3: Submit Order Request
        const callbackUrl = `${siteUrl}/.netlify/functions/pesapal-callback`;
        
        const orderData = {
            id: reference,
            currency: "KES",
            amount: amount,
            description: `Get Fans Kenya - ${customerName}`,
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

        console.log("Submitting order to PesaPal...");
        
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
        console.log("PesaPal Response:", submitData);

        if (submitData.order_tracking_id) {
            // For Sandbox, the redirect_url might be different
            let redirectUrl = submitData.redirect_url;
            if (!redirectUrl) {
                redirectUrl = `${PESAPAL_ENDPOINT}/api/Transactions/Redirect?order_tracking_id=${submitData.order_tracking_id}`;
            }
            
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    success: true,
                    redirect_url: redirectUrl,
                    order_tracking_id: submitData.order_tracking_id,
                    message: "STK Push initiated successfully"
                })
            };
        } else {
            throw new Error(submitData.error?.message || JSON.stringify(submitData));
        }

    } catch (error) {
        console.error('❌ PesaPal error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                error: error.message || 'Payment initialization failed'
            })
        };
    }
};