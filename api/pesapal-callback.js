export default async function handler(req, res) {
    if (req.method === 'GET') {
        const { reference, status } = req.query;
        
        if (reference && global.pendingPayments) {
            if (status === 'COMPLETED') {
                global.pendingPayments[reference] = {
                    ...global.pendingPayments[reference],
                    status: 'COMPLETED',
                    paid_at: Date.now()
                };
            }
        }
        
        return res.redirect(`/?payment_status=${status || 'PENDING'}&reference=${reference}`);
    }
    
    return res.status(200).send('OK');
}