exports.handler = async (event) => {
    const response = {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        }
    };

    if (event.httpMethod === 'GET') {
        response.body = JSON.stringify({
            status: 'ok',
            message: 'Function is running',
            time: new Date().toISOString()
        });
        return response;
    }

    if (event.httpMethod === 'POST') {
        try {
            let body = {};
            try {
                body = JSON.parse(event.body || '{}');
            } catch(e) {
                body = {};
            }

            const reference = body.reference || `ORDER_${Date.now()}`;
            const siteUrl = 'https://loquacious-kitten-73b278.netlify.app';

            response.body = JSON.stringify({
                success: true,
                simulation: true,
                message: "✅ Order received! Use manual payment (Till 8941840) to complete.",
                redirect_url: `${siteUrl}?payment_status=COMPLETED&reference=${reference}`,
                order_tracking_id: `GFK${Date.now()}`,
                reference: reference
            });
            
            return response;
            
        } catch (error) {
            response.body = JSON.stringify({
                success: true,
                message: "Order received! Please complete payment via Till 8941840"
            });
            return response;
        }
    }

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: ''
        };
    }

    response.body = JSON.stringify({ error: 'Use POST or GET' });
    return response;
};
