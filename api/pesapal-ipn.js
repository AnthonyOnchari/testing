export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const ipnData = req.body;
    console.log('IPN received:', ipnData);
    
    return res.status(200).send('OK');
}