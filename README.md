# Minor-Project
# Garbage Detection using YOLOv8

This project implements a computer vision system to detect garbage in images using the YOLOv8 object detection model. The dataset was annotated using Roboflow and the model was trained in Google Colab.

## Project Overview

The objective of this project is to automatically identify garbage in images using deep learning techniques. Such a system can be applied in smart city monitoring, environmental cleanliness tracking, and automated inspection of public spaces.

## Model Details

Model: YOLOv8  
Task: Object Detection  
Class: garbage  
Dataset size: 333 images after augmentation  
Annotation tool: Roboflow  
Training platform: Google Colab  

## Repository Structure

Minor-Project/
│
├── dataset/ # Dataset files (optional if included)
├── runs/ # Training results and prediction outputs
├── yolo.py # Training or inference script
├── README.md
└── best.pt # Trained model weights (if uploaded)

## Installation and Setup

# Clone the repository:

git clone https://github.com/Adi7coder/Minor-Project.git
cd Minor-Project

# install dependencies: 
pip install ultralytics roboflow opencv-python matplotlib

# load the trained model and run detection:
from ultralytics import YOLO
model = YOLO("best.pt")
model.predict(source="image.jpg", save=True, conf=0.25)

# Results will be saved in: runs/detect/predict/

## Model Performance

Precision: approximately 0.83
Recall: approximately 0.45
mAP50: approximately 0.48
mAP50-95: approximately 0.32

