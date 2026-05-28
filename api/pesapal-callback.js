// api/pesapal-callback.js
export default async function handler(req, res) {
    // Handle both GET and POST from PesaPal
    if (req.method === 'GET') {
        const { reference, status, pesapal_transaction_tracking_id } = req.query;
        
        console.log('PesaPal callback received:', { reference, status, pesapal_transaction_tracking_id });
        
        if (reference && global.pendingPayments) {
            if (status === 'COMPLETED') {
                global.pendingPayments[reference] = {
                    ...global.pendingPayments[reference],
                    status: 'COMPLETED',
                    transaction_id: pesapal_transaction_tracking_id,
                    paid_at: Date.now()
                };
            } else {
                global.pendingPayments[reference] = {
                    ...global.pendingPayments[reference],
                    status: 'FAILED',
                    paid_at: Date.now()
                };
            }
        }
        
        // Redirect back to your site with payment status
        return res.redirect(`/?payment_status=${status || 'PENDING'}&reference=${reference}`);
    }
    
    if (req.method === 'POST') {
        // Handle POST callback from PesaPal (IPN)
        const callbackData = req.body;
        console.log('PesaPal IPN received:', callbackData);
        
        // Process IPN data here
        // Update order status in your Google Sheet
        
        return res.status(200).send('OK');
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}