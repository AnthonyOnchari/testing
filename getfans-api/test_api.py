import httpx
import asyncio

async def test_health():
    async with httpx.AsyncClient() as client:
        response = await client.get("http://localhost:8000/api/health")
        print("Health Check:", response.json())

async def test_stkpush():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/mpesa/stkpush",
            json={
                "phone": "254708374149",
                "amount": 10,
                "orderData": {
                    "customerName": "Test Customer",
                    "platform": "Facebook",
                    "service": "Followers",
                    "quantity": 10000,
                    "price": 3399
                }
            }
        )
        print("STK Push Response:", response.json())

async def main():
    print("Testing API...")
    await test_health()
    print("\nTesting STK Push...")
    await test_stkpush()

if __name__ == "__main__":
    asyncio.run(main())
