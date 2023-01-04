# Import keras
import predict as predict
from download_from_db import createFolders
import keras.metrics as tfm
from keras.models import load_model
# Import other libraries
from flask import Flask, request, jsonify, make_response  # Pip3 install flask
import requests
import dotenv  # pip3 install python-dotenv
import os
import base64
import numpy as np
import io
import matplotlib.image as mpimg
import matplotlib.pyplot as plt
import sys
sys.path.append('../')
dotenv.load_dotenv("web_server/.env.local")
host = os.getenv("NEXT_PUBLIC_IMAGES_API_HOST")
url = f"http://{host}/images"

# Initialize the Flask application
app = Flask(__name__)


class IOU(tfm.MeanIoU):
    def __init__(self, from_logits=False, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._from_logits = from_logits

    def update_state(self, y_true, y_pred, sample_weight=None):
        if self._from_logits:
            super(IOU, self).update_state(y_true, tf.nn.softmax(
                y_pred), sample_weight=sample_weight)
        else:
            super(IOU, self).update_state(
                y_true, y_pred, sample_weight=sample_weight)


# Load the model
model = load_model('modelV6.h5', custom_objects={'IOU': IOU})
createFolders(["predictions"])


def _build_cors_preflight_response():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add('Access-Control-Allow-Headers', "*")
    response.headers.add('Access-Control-Allow-Methods', "*")
    return response


def _corsify_actual_response(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response


@app.route("/predict/<string:fileName>", methods=["GET", "OPTIONS"])
def handle(fileName):
    print("Predicting...")

    if request.method == "OPTIONS":  # CORS preflight
        return _build_cors_preflight_response()
    if not fileName:
        return jsonify({"message": "No file name provided"})

     # Get image from server
    print(f"Getting image from server: {url}/{fileName}")
    imageRes = requests.get(url=f"{url}/{fileName}")

    if imageRes.status_code != 200:
        print(f"Error getting image from server: {imageRes.status_code}")
        return jsonify({"message": "Error getting image from server"})

    # Decode image
    image_decoded = base64.b64decode(imageRes.content)

    # Convert to image
    image_converted = io.BytesIO(image_decoded)

    file_type = fileName.split(".")[1]

    # Read image
    image = mpimg.imread(image_converted, format=f'{file_type}')
    imgW = image.shape[0]
    imgH = image.shape[1]

    # Save temp image
    plt.imsave(f"temp.{file_type}", image)
    predict.predict(
        model, f"temp.{file_type}", 1024, plot=False, save=True)

    encoded_string = ""
    # Fetch predicted image file and convert to base64
    with open(f"predictions/temp_pred_mask.{file_type}", "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read())

    # Return base64 encoded image
    return _corsify_actual_response(jsonify({"prediction": encoded_string.decode('utf-8')}))


if __name__ == '__main__':
    app.run(port=8001, debug=True)
