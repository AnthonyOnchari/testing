// Your frontend calls this to check if payment is complete
export default async function handler(req, res) {
    // Allow GET requests only
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { ref } = req.query;

    if (!ref) {
        return res.status(400).json({ error: 'Missing reference' });
    }

    // Get payment status from memory
    const statusData = global.paymentStatuses?.[ref];
    
    if (!statusData) {
        return res.status(200).json({ status: 'PENDING' });
    }

    return res.status(200).json({ 
        status: statusData.status,
        transaction_id: statusData.transaction_id || null
    });
}