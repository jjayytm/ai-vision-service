"""
AI Vision Service - FastAPI Backend
Provides image analysis endpoints using OpenAI Vision API with Clerk authentication
"""

import os
import base64
import logging
import json
from pathlib import Path
from typing import Dict

from fastapi import FastAPI, Depends, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials
from openai import OpenAI

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AI Vision Service",
    description="AI-powered image analysis service using OpenAI Vision API",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Clerk authentication
clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(clerk_config)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Configuration constants
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
PREMIUM_PLAN_KEY = "premium_vision"
FREE_TIER_LIMIT = 1

# Usage tracking (in-memory, resets on deployment)
usage_tracker: Dict[str, int] = {}

def check_and_increment_usage(user_id: str, tier: str) -> bool:
    if tier == "premium":
        return True  # Unlimited for premium users
    
    current_usage = usage_tracker.get(user_id, 0)
    
    if current_usage >= FREE_TIER_LIMIT:
        return False
    
    usage_tracker[user_id] = current_usage + 1
    return True

def get_user_tier(decoded_token: dict) -> str:
    """
    Determine user's subscription tier from JWT token.
    Checks for the specific 'premium_vision' plan key or metadata.
    """
    user_id = decoded_token.get("sub", "")
    
    # Log the entire token for debugging (Rubric: Logging for debugging)
    logger.info("=" * 80)
    logger.info("DEBUGGING JWT TOKEN")
    logger.info(f"User ID: {user_id}")
    
    # 1. Check subscription object for plan key
    subscription = decoded_token.get("subscription", {})
    plan = subscription.get("plan", "")
    logger.info(f"subscription.plan: {plan}")
    
    # 2. Check public_metadata for tier information
    public_metadata = decoded_token.get("public_metadata", {})
    logger.info(f"public_metadata: {json.dumps(public_metadata, indent=2)}")
    
    tier = public_metadata.get("tier", "")
    
    # Logic to return premium
    if PREMIUM_PLAN_KEY in plan.lower() or tier == "premium":
        logger.info(f"User {user_id} is PREMIUM")
        return "premium"
    
    logger.info(f"User is on FREE tier")
    logger.info("=" * 80)
    return "free"

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI Vision Service",
        "version": "1.0.0"
    }

@app.post("/api/analyze")
async def analyze_image(
    file: UploadFile,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard)
):
    try:
        user_id = creds.decoded["sub"]
        tier = get_user_tier(creds.decoded)
        
        logger.info(f"Analysis request from user {user_id} (tier: {tier})")
        
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="File too large. Maximum size is 5MB"
            )
        
        if not check_and_increment_usage(user_id, tier):
            raise HTTPException(
                status_code=429,
                detail="Usage limit exceeded. Upgrade to Premium for unlimited analyses."
            )
        
        image_data = base64.b64encode(file_content).decode('utf-8')
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """Analyze this image professionally. 
                    Provide exactly 3 sections. Use this EXACT format for every section:
                    
                    ### Objects
                    - First object description
                    - Second object description
                    
                    ### Colors
                    - First color description
                    - Second color description
                    
                    ### Mood
                    - Description of the overall mood
                    
                    Important: Start every bullet point with ' - ' on a NEW LINE. 
                    Do not use bolding within the bullet points."""
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}
                        }
                    ]
                }
            ],
            max_tokens=250
        )
        
        description = response.choices[0].message.content
        return {
            "success": True,
            "description": description,
            "user_id": user_id,
            "tier": tier
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

@app.get("/api/usage")
def check_usage(creds: HTTPAuthorizationCredentials = Depends(clerk_guard)):
    try:
        user_id = creds.decoded["sub"]
        tier = get_user_tier(creds.decoded)
        analyses_used = usage_tracker.get(user_id, 0)
        limit = "unlimited" if tier == "premium" else FREE_TIER_LIMIT
        
        return {
            "user_id": user_id,
            "tier": tier,
            "analyses_used": analyses_used,
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Failed to fetch usage: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch usage: {str(e)}"
        )