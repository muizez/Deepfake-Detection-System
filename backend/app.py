from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from torchvision import transforms
from PIL import Image
import torch.nn as nn
from torchvision import models

app = Flask(__name__)
CORS(app)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Create the same architecture used during training
model = models.resnet50(weights=None)

# Example for binary classification
model.fc = nn.Linear(model.fc.in_features, 2)

# Load trained weights
model.load_state_dict(
    torch.load("model.pth", map_location=device, weights_only=True)
)

model.to(device)
model.eval()

# Preprocessing must match your training preprocessing
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

@app.route("/predict", methods=["POST"])
def predict():

    if "file" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["file"]

    image = Image.open(file).convert("RGB")
    image = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        output = model(image)
        probabilities = torch.softmax(output, dim=1)

        confidence, prediction = torch.max(probabilities, dim=1)

    classes = ["Class 0", "Class 1"]

    result = classes[prediction.item()]

    return jsonify({
        "prediction": result,
        "confidence": round(confidence.item() * 100, 2)
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)