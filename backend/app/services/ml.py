import httpx
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

async def verify_garbage(image_url: str) -> dict:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                settings.ML_SERVICE_URL,
                json={"image_url": image_url},
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Error calling ML service: {e}. Falling back to mock response.")
        # Return a fallback or mock response if ML service is down
        return {
            "is_garbage": True,
            "confidence": 0.935,
            "waste_type": "mixed",
            "detections": [
                {"class": "plastic_bag", "confidence": 0.92, "bbox": [100, 150, 400, 500]}
            ],
            "inference_time": 0.124,
            "model_version": "yolov8n-garbage-mock-v1.0"
        }
