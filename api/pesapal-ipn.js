// api/pesapal-ipn.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const ipnData = req.body;
    
    console.log('PesaPal IPN Webhook received:', JSON.stringify(ipnData, null, 2));
    
    const { pesapal_notification_type, pesapal_merchant_reference, pesapal_transaction_tracking_id } = ipnData;
    
    if (pesapal_notification_type === 'CHANGE' && pesapal_merchant_reference) {
        // Payment status changed
        // You can update your Google Sheet here via webhook
        
        if (global.pendingPayments) {
            global.pendingPayments[pesapal_merchant_reference] = {
                ...global.pendingPayments[pesapal_merchant_reference],
                status: 'COMPLETED',
                transaction_id: pesapal_transaction_tracking_id,
                paid_at: Date.now()
            };
        }
        
        console.log(`Payment completed for order: ${pesapal_merchant_reference}`);
    }
    
    // Always respond with 200 OK to acknowledge receipt
    return res.status(200).send('OK');
}