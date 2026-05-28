// netlify/functions/pesapal-initiate.js
exports.handler = async (event, context) => {
    // Always return JSON, never HTML
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Content-Type': 'application/json'
    };

    // Handle GET request for testing
    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: 'ok', 
                message: 'Function is working. Send POST request to initiate payment.',
                method: 'GET'
            })
        };
    }

    // Handle OPTIONS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Handle POST request
    if (event.httpMethod === 'POST') {
        try {
            console.log("=== PESAPAL INITIATE FUNCTION CALLED ===");
            console.log("Body:", event.body);
            
            let bodyData;
            try {
                bodyData = JSON.parse(event.body);
            } catch (e) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ success: false, error: 'Invalid JSON body' })
                };
            }
            
            const { amount, email, phone, reference, customerName } = bodyData;
            
            console.log(`Amount: ${amount}, Email: ${email}, Phone: ${phone}, Reference: ${reference}`);
            
            // For now, return a simulation response
            // This will at least confirm the function is working
            const siteUrl = 'https://loquacious-kitten-73b278.netlify.app';
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    simulation: true,
                    message: "SIMULATION MODE: Payment flow working. To enable real PesaPal, check your credentials.",
                    redirect_url: `${siteUrl}?payment_status=COMPLETED&reference=${reference}`,
                    order_tracking_id: `SIM_${Date.now()}`,
                    merchant_reference: reference
                })
            };
            
        } catch (error) {
            console.error("Error:", error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: error.message,
                    stack: error.stack 
                })
            };
        }
    }

    // Any other method
    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed. Use POST.' })
    };
};