// netlify/functions/pesapal-ipn.js
exports.handler = async (event, context) => {
    const params = event.queryStringParameters || {};
    
    console.log("=== PESAPAL IPN RECEIVED ===");
    console.log("Full params:", JSON.stringify(params));
    
    const orderTrackingId = params.OrderTrackingId;
    const orderMerchantReference = params.OrderMerchantReference;
    const paymentStatus = params.PaymentStatus;
    
    console.log(`Order: ${orderMerchantReference}`);
    console.log(`Status: ${paymentStatus}`);
    console.log(`Tracking ID: ${orderTrackingId}`);
    
    // You can add code here to update your Google Sheet
    // For now, just log the payment
    
    if (paymentStatus === 'COMPLETED') {
        console.log(`✅ Payment COMPLETED for order ${orderMerchantReference}`);
        // TODO: Update Google Sheets
    }
    
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            status: 'OK', 
            received: true,
            order: orderMerchantReference,
            payment_status: paymentStatus
        })
    };
};