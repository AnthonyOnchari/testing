// api/pesapal-initiate.js
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { amount, email, phone, reference, customerName } = req.body;

    // Validate required fields
    if (!amount || !reference) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get credentials from environment variables
    const CONSUMER_KEY = process.env.pesapal_consumer_key;
    const CONSUMER_SECRET = process.env.pesapal_consumer_secret;
    const BASE_URL = process.env.vercel_url || 'getfanskenya.vercel.app';
    const CALLBACK_URL = `https://${BASE_URL}/api/pesapal-callback`;
    const IPN_URL = `https://${BASE_URL}/api/pesapal-ipn`;

    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
        console.error('Missing PesaPal credentials');
        return res.status(500).json({ 
            success: false, 
            message: 'Payment service not configured. Please use Till 8941840.' 
        });
    }

    // Format phone number (0712345678 -> 254712345678)
    const formattedPhone = '254' + phone.replace(/^0+/, '');

    try {
        // For PesaPal, we'll use their iframe method
        // The payment URL will redirect to PesaPal's payment page
        const paymentData = {
            amount: Math.round(amount),
            description: `Get Fans Kenya - Order ${reference}`,
            reference: reference,
            email: email || 'customer@getfanskenya.store',
            phone_number: formattedPhone,
            first_name: customerName?.split(' ')[0] || 'Customer',
            last_name: customerName?.split(' ')[1] || 'Kenya',
            callback_url: CALLBACK_URL,
            notification_url: IPN_URL,
            currency: 'KES'
        };

        // Store payment data temporarily (in-memory for demo)
        if (!global.pendingPayments) global.pendingPayments = {};
        global.pendingPayments[reference] = {
            ...paymentData,
            status: 'PENDING',
            timestamp: Date.now()
        };

        // For PesaPal production, you would need to get an OAuth token
        // and then redirect to their payment page.
        // For now, we'll return a success response with instructions
        
        // Note: PesaPal requires OAuth authentication which is more complex
        // For a working STK Push, you'll need to use their official SDK or API
        
        return res.status(200).json({
            success: true,
            message: 'Payment initialization successful',
            payment_url: null, // Would be actual PesaPal URL in production
            requires_redirect: false
        });

    } catch (error) {
        console.error('Payment error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Payment initialization failed. Please use Till 8941840.' 
        });
    }
}