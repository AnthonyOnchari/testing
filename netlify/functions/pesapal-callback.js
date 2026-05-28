// netlify/functions/pesapal-callback.js
exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };
    
    const params = event.queryStringParameters || {};
    const orderMerchantReference = params.OrderMerchantReference || params.reference;
    
    console.log("Callback received:", params);
    
    const siteUrl = 'https://loquacious-kitten-73b278.netlify.app';
    const redirectUrl = `${siteUrl}?payment_status=COMPLETED&reference=${orderMerchantReference}`;
    
    return {
        statusCode: 302,
        headers: {
            'Location': redirectUrl,
            'Cache-Control': 'no-cache'
        },
        body: ''
    };
};