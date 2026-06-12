from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import httpx
import base64
import os
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Get Fans Kenya API", description="M-Pesa Payment Integration")

# Enable CORS for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class STKPushRequest(BaseModel):
    phone: str
    amount: int
    orderData: Dict[str, Any]

class OrderStatus(BaseModel):
    checkoutRequestId: str
    status: str
    orderData: Optional[Dict] = None
    transactionDetails: Optional[Dict] = None

# Store orders (Use PostgreSQL/MySQL in production)
orders_db = {}

# M-Pesa API endpoints
MPESA_API_BASE = "https://sandbox.safaricom.co.ke"  # Production: https://api.safaricom.co.ke

async def get_access_token() -> str:
    """Get OAuth token from Safaricom"""
    async with httpx.AsyncClient() as client:
        auth = base64.b64encode(
            f"{os.getenv('CONSUMER_KEY')}:{os.getenv('CONSUMER_SECRET')}".encode()
        ).decode()
        
        response = await client.get(
            f"{MPESA_API_BASE}/oauth/v1/generate?grant_type=client_credentials",
            headers={"Authorization": f"Basic {auth}"}
        )
        
        if response.status_code != 200:
            raise Exception(f"Failed to get token: {response.text}")
        
        return response.json()["access_token"]

def format_phone_number(phone: str) -> str:
    """Format phone number to 254XXXXXXXXX"""
    phone = ''.join(filter(str.isdigit, phone))
    if phone.startswith('0'):
        phone = '254' + phone[1:]
    elif phone.startswith('254'):
        pass
    else:
        phone = '254' + phone
    return phone

@app.get("/")
async def root():
    return {
        "message": "Get Fans Kenya API",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health",
            "stkpush": "/api/mpesa/stkpush (POST)",
            "callback": "/api/mpesa/callback (POST)",
            "status": "/api/order-status/{checkout_id} (GET)"
        }
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "environment": "sandbox" if "sandbox" in MPESA_API_BASE else "production"
    }

@app.post("/api/mpesa/stkpush")
async def initiate_stk_push(request: STKPushRequest):
    """
    Initiate STK Push to customer's phone.
    This sends a pop-up to the customer's M-Pesa app.
    """
    try:
        # Format phone number
        formatted_phone = format_phone_number(request.phone)
        
        # Get access token
        token = await get_access_token()
        
        # Generate timestamp and password
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        password_str = f"{os.getenv('SHORTCODE')}{os.getenv('PASSKEY')}{timestamp}"
        password = base64.b64encode(password_str.encode()).decode()
        
        # Prepare STK Push request
        stk_request = {
            "BusinessShortCode": os.getenv("SHORTCODE"),
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": request.amount,
            "PartyA": formatted_phone,
            "PartyB": os.getenv("SHORTCODE"),
            "PhoneNumber": formatted_phone,
            "CallBackURL": os.getenv("CALLBACK_URL"),
            "AccountReference": f"GFK{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "TransactionDesc": "Get Fans Kenya Payment"
        }
        
        # Send to M-Pesa API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{MPESA_API_BASE}/mpesa/stkpush/v1/processrequest",
                json=stk_request,
                headers={"Authorization": f"Bearer {token}"}
            )
            
            result = response.json()
            
            if response.status_code == 200 and result.get("ResponseCode") == "0":
                checkout_id = result["CheckoutRequestID"]
                
                # Store order
                orders_db[checkout_id] = {
                    "status": "PENDING",
                    "orderData": request.orderData,
                    "amount": request.amount,
                    "phone": formatted_phone,
                    "timestamp": datetime.now().isoformat()
                }
                
                return {
                    "success": True,
                    "checkoutRequestId": checkout_id,
                    "message": result.get("CustomerMessage", "STK Push sent successfully")
                }
            else:
                return {
                    "success": False,
                    "error": result.get("errorMessage", "Failed to initiate payment")
                }
                
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mpesa/callback")
async def mpesa_callback(request: Dict[str, Any]):
    """
    Receive callback from M-Pesa after customer completes payment.
    This is where Safaricom sends the payment confirmation.
    """
    print(f"Callback received: {json.dumps(request, indent=2)}")
    
    try:
        stk_callback = request.get("Body", {}).get("stkCallback", {})
        
        if stk_callback:
            checkout_id = stk_callback.get("CheckoutRequestID")
            result_code = stk_callback.get("ResultCode")
            result_desc = stk_callback.get("ResultDesc")
            
            if checkout_id in orders_db:
                if result_code == 0:
                    # Payment successful
                    metadata = stk_callback.get("CallbackMetadata", {}).get("Item", [])
                    
                    transaction_details = {}
                    for item in metadata:
                        transaction_details[item["Name"]] = item.get("Value")
                    
                    orders_db[checkout_id]["status"] = "COMPLETED"
                    orders_db[checkout_id]["transactionDetails"] = transaction_details
                    orders_db[checkout_id]["completedAt"] = datetime.now().isoformat()
                    
                    print(f"✅ Payment successful!")
                    print(f"   Receipt: {transaction_details.get('MpesaReceiptNumber')}")
                    print(f"   Amount: {transaction_details.get('Amount')}")
                    print(f"   Customer: {orders_db[checkout_id]['orderData'].get('customerName')}")
                    
                    # Here: Save to Google Sheets
                    # Here: Send WhatsApp confirmation
                    # Here: Start order fulfillment
                    
                else:
                    orders_db[checkout_id]["status"] = "FAILED"
                    orders_db[checkout_id]["failureReason"] = result_desc
                    print(f"❌ Payment failed: {result_desc}")
        
        return {"ResultCode": 0, "ResultDesc": "Success"}
        
    except Exception as e:
        print(f"Callback error: {str(e)}")
        return {"ResultCode": 0, "ResultDesc": "Success"}

@app.get("/api/order-status/{checkout_id}")
async def get_order_status(checkout_id: str):
    """Check the status of an order"""
    order = orders_db.get(checkout_id)
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {
        "status": order["status"],
        "orderData": order.get("orderData"),
        "transactionDetails": order.get("transactionDetails"),
        "failureReason": order.get("failureReason"),
        "completedAt": order.get("completedAt")
    }

@app.get("/api/orders")
async def get_all_orders():
    """Get all orders (for admin panel)"""
    return [
        {
            "checkoutRequestId": checkout_id,
            **order_data
        }
        for checkout_id, order_data in orders_db.items()
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
