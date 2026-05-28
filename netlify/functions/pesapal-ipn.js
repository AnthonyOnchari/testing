// netlify/functions/pesapal-ipn.js
exports.handler = async (event, context) => {
    const params = event.queryStringParameters;
    const orderTrackingId = params.OrderTrackingId;
    const orderMerchantReference = params.OrderMerchantReference;
    const paymentStatus = params.PaymentStatus;
    
    console.log(`IPN Received - Order: ${orderMerchantReference}, Status: ${paymentStatus}, Tracking ID: ${orderTrackingId}`);
    
    // Here you would update your Google Sheet
    // You can make a fetch to your Google Sheets web app to update the order status
    
    if (paymentStatus === 'COMPLETED') {
        console.log(`✅ Payment COMPLETED for order ${orderMerchantReference}`);
        // TODO: Call your Google Sheets API to update order status to "Processing"
    } else if (paymentStatus === 'FAILED') {
        console.log(`❌ Payment FAILED for order ${orderMerchantReference}`);
    } else if (paymentStatus === 'PENDING') {
        console.log(`⏳ Payment PENDING for order ${orderMerchantReference}`);
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify({ status: 'OK', received: true })
    };
};