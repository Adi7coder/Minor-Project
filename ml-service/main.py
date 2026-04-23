from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List
import time

import base64
from io import BytesIO
from PIL import Image
from ultralytics import YOLO

import os

try:
    # Check if custom weights from Colab (best.pt) exist, otherwise use default yolov8n
    model_path = 'best.pt' if os.path.exists('best.pt') else 'yolov8n.pt'
    print(f"Loading model from: {model_path}")
    model = YOLO(model_path)
except Exception as e:
    print(f"Failed to load YOLO model: {e}")
    model = None

app = FastAPI(title="CleanBLR ML Service")

class DetectionRequest(BaseModel):
    image_data: str

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
    
    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded")

    try:
        if request.image_data.startswith('http'):
            import requests
            response = requests.get(request.image_data)
            image = Image.open(BytesIO(response.content))
        else:
            base64_data = request.image_data.split(",")[-1] if "," in request.image_data else request.image_data
            image_bytes = base64.b64decode(base64_data)
            image = Image.open(BytesIO(image_bytes))
            
        results = model(image)
        
        detections = []
        highest_conf = 0.0
        
        for r in results:
            boxes = r.boxes
            for box in boxes:
                cls_id = int(box.cls[0])
                class_name = model.names[cls_id]
                conf = float(box.conf[0])
                bbox = box.xyxy[0].tolist()
                
                detections.append({
                    "class": class_name,
                    "confidence": conf,
                    "bbox": [int(b) for b in bbox]
                })
                
                if conf > highest_conf:
                    highest_conf = conf

        inference_time = round(time.time() - start_time, 3)
        
        # We classify anything detected by YOLOv8n with > 0.3 conf as "garbage" for demo purposes
        is_garbage = len(detections) > 0 and highest_conf > 0.3
        
        return DetectionResponse(
            is_garbage=is_garbage,
            confidence=highest_conf if is_garbage else 0.0,
            waste_type="mixed" if is_garbage else "none",
            detections=detections,
            inference_time=inference_time,
            model_version="yolov8n"
        )
    except Exception as e:
        print(f"Error during ML inference: {e}")
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
