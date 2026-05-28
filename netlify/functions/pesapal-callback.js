exports.handler = async (event) => {
    const params = event.queryStringParameters || {};
    const reference = params.OrderMerchantReference || params.reference || 'UNKNOWN';
    const siteUrl = 'https://loquacious-kitten-73b278.netlify.app';
    
    return {
        statusCode: 302,
        headers: { 'Location': `${siteUrl}?payment_status=COMPLETED&reference=${reference}` },
        body: ''
    };
};
