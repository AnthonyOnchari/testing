export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { amount, email, phone, reference, customerName } = req.body;

    if (!amount || !reference) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const CONSUMER_KEY = process.env.pesapal_consumer_key;
    const CONSUMER_SECRET = process.env.pesapal_consumer_secret;
    const BASE_URL = process.env.vercel_url || 'loquacious-kitten-73b278.netlify.app';
    const CALLBACK_URL = `https://${BASE_URL}/.netlify/functions/pesapal-callback`;
    const IPN_URL = `https://${BASE_URL}/.netlify/functions/pesapal-ipn`;

    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
        console.error('Missing PesaPal credentials');
        return res.status(500).json({ 
            success: false, 
            message: 'Payment service not configured. Please use Till 8941840.' 
        });
    }

    const formattedPhone = '254' + phone.replace(/^0+/, '');

    try {
        if (!global.pendingPayments) global.pendingPayments = {};
        global.pendingPayments[reference] = {
            status: 'PENDING',
            timestamp: Date.now(),
            amount: amount,
            phone: formattedPhone
        };

        return res.status(200).json({ 
            success: true, 
            message: 'STK Push would be sent here. For demo, use Till 8941840.',
            test_mode: true
        });
    } catch (error) {
        console.error('Payment error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Payment failed. Please use Till 8941840.' 
        });
    }
}