from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List
import time

app = FastAPI(title="CleanBLR ML Service")

class DetectionRequest(BaseModel):
    image_url: str

class DetectionBox(BaseModel):
    class_name: str = Field(alias="class")
    confidence: float
    bbox: List[int]

    class Config:
        populate_by_name = True

class DetectionResponse(BaseModel):
    is_garbage: bool
    confidence: float
    waste_type: str
    detections: List[DetectionBox]
    inference_time: float
    model_version: str

@app.post("/ml/detect", response_model=DetectionResponse)
async def detect_garbage(request: DetectionRequest):
    start_time = time.time()
    
    # In a real scenario, we'd download the image and pass it to YOLO
    # try:
    #     response = requests.get(request.image_url)
    #     image = Image.open(BytesIO(response.content))
    #     results = model(image)
    #     ... extracting bboxes and classes
    # except Exception as e:
    #     raise HTTPException(status_code=400, detail="Invalid image")
        
    # Mocking YOLOv8 inference for now, since running real ML inference might fail in environment
    import asyncio
    await asyncio.sleep(0.5) # Simulate inference delay
    
    inference_time = round(time.time() - start_time, 3)
    
    return DetectionResponse(
        is_garbage=True,
        confidence=0.935,
        waste_type="mixed",
        detections=[
            {"class": "plastic_bag", "confidence": 0.92, "bbox": [100, 150, 400, 500]},
            {"class": "cardboard", "confidence": 0.88, "bbox": [200, 50, 300, 200]}
        ],
        inference_time=inference_time,
        model_version="yolov8n-garbage-mock"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
