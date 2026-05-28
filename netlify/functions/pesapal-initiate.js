// netlify/functions/pesapal-initiate.js
exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const { amount, email, phone, reference, customerName } = JSON.parse(event.body);

    if (!amount || !reference) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing required fields' })
        };
    }

    const CONSUMER_KEY = process.env.pesapal_consumer_key;
    const CONSUMER_SECRET = process.env.pesapal_consumer_secret;
    const BASE_URL = process环境变量.vercel_url || 'loquacious-kitten-73b278.netlify.app';

    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
        console.error('Missing PesaPal credentials');
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: false, 
                message: 'Payment service not configured. Please use Till 8941840.' 
            })
        };
    }

    const formattedPhone = '254' + phone.replace(/^0+/, '');

    try {
        // Store payment status
        if (!global.pendingPayments) global.pendingPayments = {};
        global.pendingPayments[reference] = {
            status: 'PENDING',
            timestamp: Date.now(),
            amount: amount,
            phone: formattedPhone
        };

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                message: 'STK Push would be sent here. For demo, use Till 8941840.',
                test_mode: true
            })
        };
    } catch (error) {
        console.error('Payment error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false, 
                message: 'Payment failed. Please use Till 8941840.' 
            })
        };
    }
};