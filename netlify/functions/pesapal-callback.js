// netlify/functions/pesapal-callback.js
exports.handler = async (event, context) => {
    const params = event.queryStringParameters || {};
    const orderTrackingId = params.OrderTrackingId || params.order_tracking_id;
    const orderMerchantReference = params.OrderMerchantReference;
    
    console.log("=== PESAPAL CALLBACK RECEIVED ===");
    console.log("Order Tracking ID:", orderTrackingId);
    console.log("Merchant Reference:", orderMerchantReference);
    console.log("All params:", params);
    
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