// netlify/functions/pesapal-callback.js
exports.handler = async (event, context) => {
    if (event.httpMethod === 'GET') {
        const { reference, status } = event.queryStringParameters || {};
        
        if (reference && global.pendingPayments) {
            if (status === 'COMPLETED') {
                global.pendingPayments[reference] = {
                    ...global.pendingPayments[reference],
                    status: 'COMPLETED',
                    paid_at: Date.now()
                };
            }
        }
        
        return {
            statusCode: 302,
            headers: {
                Location: `/?payment_status=${status || 'PENDING'}&reference=${reference}`
            },
            body: ''
        };
    }
    
    return {
        statusCode: 200,
        body: 'OK'
    };
};