from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import shutil
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("best.pt")

@app.get("/")
def home():
    return {"message": "API working"}

@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    
    file_path = f"temp_{file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    results = model.predict(file_path)

    detections = []

    for r in results:
        for box in r.boxes:
            detections.append({
                "class": int(box.cls),
                "confidence": float(box.conf),
                "bbox": box.xyxy.tolist()
            })

    os.remove(file_path)

    return {"detections": detections}