// netlify/functions/pesapal-ipn.js
exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };
    
    console.log("IPN received:", event.queryStringParameters);
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'OK', received: true })
    };
};