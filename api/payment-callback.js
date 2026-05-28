// PayHero sends payment confirmation here
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const callbackData = req.body;

    console.log('📞 Payment callback received:', JSON.stringify(callbackData, null, 2));

    const { external_reference, status, transaction_id, amount } = callbackData;

    if (external_reference && status) {
        // Update payment status
        if (!global.paymentStatuses) global.paymentStatuses = {};
        
        global.paymentStatuses[external_reference] = {
            status: status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
            transaction_id: transaction_id,
            amount: amount,
            timestamp: Date.now()
        };

        console.log(`✅ Payment ${status} for order: ${external_reference}`);

        // You can also send a webhook to your Google Apps Script here
        // to update the order status in your Google Sheet automatically
        
        return res.status(200).send('OK');
    }

    console.log('⚠️ Invalid callback data received');
    return res.status(400).send('Bad Request');
}