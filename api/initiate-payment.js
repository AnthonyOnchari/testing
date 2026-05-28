// This handles the STK Push request from your website
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { amount, phone, reference, customerName } = req.body;

    // Validate required fields
    if (!amount || !phone || !reference) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Your PayHero credentials (from Vercel Environment Variables)
    const CHANNEL_ID = process.env.PAYHERO_CHANNEL_ID;
    const API_KEY = process.env.PAYHERO_API_KEY;
    const BASE_URL = process.env.VERCEL_URL || 'https://getfanskenya.vercel.app';
    const CALLBACK_URL = `https://${BASE_URL}/api/payment-callback`;

    if (!CHANNEL_ID || !API_KEY) {
        console.error('Missing PayHero credentials');
        return res.status(500).json({ error: 'Payment service not configured' });
    }

    // Format phone number (0712345678 → 254712345678)
    const formattedPhone = '254' + phone.replace(/^0+/, '');

    try {
        const response = await fetch('https://api.payhero.co.ke/api/v1/stkpush/initiate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: Math.round(amount),
                phone: formattedPhone,
                channel_id: CHANNEL_ID,
                external_reference: reference,
                customer_name: customerName || 'Get Fans Customer',
                callback_url: CALLBACK_URL
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Store payment status (in-memory for demo - use Vercel KV for production)
            if (!global.paymentStatuses) global.paymentStatuses = {};
            global.paymentStatuses[reference] = { 
                status: 'PENDING', 
                timestamp: Date.now(),
                amount: amount,
                phone: formattedPhone
            };
            
            return res.status(200).json({ 
                success: true, 
                message: 'STK Push sent. Check your phone.',
                data: data 
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                message: data.message || 'Payment initiation failed. Please try again.' 
            });
        }
    } catch (error) {
        console.error('Payment error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again or use Till 8941840.' 
        });
    }
}