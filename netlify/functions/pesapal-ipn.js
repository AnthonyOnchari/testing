// netlify/functions/pesapal-ipn.js
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method not allowed'
        };
    }

    const ipnData = JSON.parse(event.body);
    console.log('IPN received:', ipnData);
    
    return {
        statusCode: 200,
        body: 'OK'
    };
};