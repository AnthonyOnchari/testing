// netlify/functions/pesapal-callback.js
exports.handler = async (event, context) => {
    const params = event.queryStringParameters;
    const orderTrackingId = params.OrderTrackingId || params.order_tracking_id;
    const orderMerchantReference = params.OrderMerchantReference;
    
    // Get the site URL from environment
    const siteUrl = process.env.URL || 'https://your-site.netlify.app';
    
    // Redirect back to your site with payment status
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