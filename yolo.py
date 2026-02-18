# corrected_yolo_display.py
import ctypes
import cv2
import os
import numpy as np
from ultralytics import YOLO

# 1. Standard Windows DPI Fix (keeps UI scaling sane on Windows HiDPI)
try:
    ctypes.windll.shcore.SetProcessDpiAwareness(1)
except Exception:
    pass

# --- Paths ---
model_path = "Models/veh_ext_v3.pt"
video_path = "WIN_20260130_13_04_40_Pro.mp4"

if not os.path.exists(model_path) or not os.path.exists(video_path):
    print("Files missing!")
    exit()

model = YOLO(model_path)
cap = cv2.VideoCapture(video_path)

# --- ASPECT RATIO & ZOOM LOGIC ---
TARGET_HEIGHT = 720  # display height in pixels (change to 600/480 if needed)
orig_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
orig_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

# Calculate uniform scale to keep aspect ratio
scale = TARGET_HEIGHT / float(orig_h)
view_w = int(round(orig_w * scale))
view_h = TARGET_HEIGHT

print(f"Original: {orig_w}x{orig_h} -> Display: {view_w}x{view_h}")

# Create the window
cv2.namedWindow("YOLO Detection", cv2.WINDOW_NORMAL)
cv2.resizeWindow("YOLO Detection", view_w, view_h)

colors = {}
np.random.seed(42)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # --- INFERENCE on original frame (preserve detection quality) ---
    results = model.predict(frame, conf=0.5, iou=0.7, verbose=False, imgsz=640)

    # --- Resize the frame for display (this is what the viewer actually shows) ---
    display_frame = cv2.resize(frame, (view_w, view_h), interpolation=cv2.INTER_AREA)

    # Compute scale factors from original -> displayed
    sx = view_w / float(orig_w)
    sy = view_h / float(orig_h)
    # Note: because we used a uniform scale above, sx and sy should be equal; we keep both for safety.

    # --- Draw boxes on the display_frame using scaled coordinates ---
    for r in results:
        for box in r.boxes:
            # box.xyxy is tensor-like: [ [x1, y1, x2, y2] ]
            x1, y1, x2, y2 = map(float, box.xyxy[0].tolist())
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            label = f"{model.names[cls]} {conf:.2f}"

            # choose color per class
            if cls not in colors:
                colors[cls] = tuple(int(c) for c in np.random.randint(0, 255, 3))

            # scale coords to display size and convert to int
            x1s = int(round(x1 * sx))
            y1s = int(round(y1 * sy))
            x2s = int(round(x2 * sx))
            y2s = int(round(y2 * sy))

            cv2.rectangle(display_frame, (x1s, y1s), (x2s, y2s), colors[cls], 2)
            # put text with background for readability
            (text_w, text_h), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
            cv2.rectangle(display_frame, (x1s, max(0, y1s - text_h - baseline)),
                          (x1s + text_w, y1s), colors[cls], thickness=-1)
            cv2.putText(display_frame, label, (x1s, y1s - baseline),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)

    cv2.imshow("YOLO Detection", display_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
