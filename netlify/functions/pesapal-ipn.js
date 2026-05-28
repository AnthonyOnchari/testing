exports.handler = async (event) => {
    console.log("IPN:", event.queryStringParameters);
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'OK' })
    };
};
