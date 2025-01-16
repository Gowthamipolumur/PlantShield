from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
from io import BytesIO
from PIL import Image
import tensorflow as tf

# Initialize FastAPI app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)


# Load the Keras model
MODEL_PATH = "C:/Users/SAI PHANI/Desktop/potato-disease/models/2.keras"
MODEL = tf.keras.models.load_model(MODEL_PATH)
CLASS_NAMES = ["Early Blight", "Late Blight", "Healthy"]

@app.get("/ping")
async def ping():
    return {"message": "Hello, I am alive"}

def read_file_as_image(data) -> np.ndarray:
    """Convert the uploaded file data to a NumPy array."""
    image = np.array(Image.open(BytesIO(data)).convert("RGB"))  # Ensure RGB format
    return image

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # Read and preprocess the image
        image = read_file_as_image(await file.read())
        image = tf.image.resize(image, [224, 224])  # Resize to model input size
        image = image / 255.0  # Normalize to [0, 1]
        img_batch = np.expand_dims(image, axis=0)

        # Perform prediction
        predictions = MODEL.predict(img_batch)
        predicted_class = CLASS_NAMES[np.argmax(predictions[0])]
        confidence = np.max(predictions[0])

        # Return the prediction results
        return {
            "class": predicted_class,
            "confidence": float(confidence)
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
