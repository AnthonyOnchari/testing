// netlify/functions/pesapal-ipn.js
exports.handler = async (event, context) => {
    const params = event.queryStringParameters || {};
    const orderTrackingId = params.OrderTrackingId;
    const orderMerchantReference = params.OrderMerchantReference;
    const paymentStatus = params.PaymentStatus;
    
    console.log(`📨 IPN Received - Order: ${orderMerchantReference}, Status: ${paymentStatus}, Tracking ID: ${orderTrackingId}`);
    
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'OK', received: true })
    };
};