from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
from io import BytesIO
from PIL import Image
import tensorflow as tf
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# TensorFlow Serving endpoint
endpoint = "http://localhost:8501/v1/models/potatoes_model:predict"

# Class names for prediction
CLASS_NAMES = ["Early Blight", "Late Blight", "Healthy"]

@app.get("/ping")
async def ping():
    """Health check endpoint."""
    return {"message": "Hello, I am alive"}

def read_file_as_image(data) -> np.ndarray:
    """Read uploaded file and convert it into a NumPy array."""
    image = np.array(Image.open(BytesIO(data)).convert("RGB"))
    return image

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Handle prediction request.
    Takes an uploaded file, preprocesses it, and sends it to TensorFlow Serving.
    """
    try:
        # Preprocess the uploaded image
        image = read_file_as_image(await file.read())
        image = tf.image.resize(image, [224, 224])  # Resize image to match the model's expected input
        image = image / 255.0  # Normalize image to [0, 1]
        img_batch = np.expand_dims(image, 0)  # Add batch dimension

        # Prepare JSON payload
        json_data = {
            "instances": img_batch.tolist()
        }

        # Send request to TensorFlow Serving
        response = requests.post(endpoint, json=json_data)
        response.raise_for_status()  # Raise HTTPError for bad responses

        # Parse the response
        prediction = np.array(response.json()["predictions"][0])
        predicted_class = CLASS_NAMES[np.argmax(prediction)]
        confidence = np.max(prediction)

        # Return prediction results
        return {
            "class": predicted_class,
            "confidence": float(confidence)
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
