@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "AI Vision Service"}

@app.post("/api/analyze")
async def analyze_image(
    file: UploadFile,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard)
):
    """
    Accept image upload, validate it, and return AI analysis
    
    Requirements:
    - Authenticate user via JWT (Clerk)
    - Validate file type (jpg, jpeg, png, webp only)
    - Check file size (max 5MB)
    - Convert to base64
    - Call OpenAI Vision API
    - Check usage limits (free vs premium)
    - Return analysis result
    """

@app.get("/api/usage")
def check_usage(creds: HTTPAuthorizationCredentials = Depends(clerk_guard)):
    """
    Return user's current usage and tier
    
    Returns:
    {
        "user_id": "...",
        "tier": "free" | "premium",
        "analyses_used": 0,
        "limit": 1 or "unlimited"
    }
    """
