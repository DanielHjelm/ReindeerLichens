from os.path import isfile, join
from os import listdir
import os
from PIL import Image
from PIL import ImageOps
import matplotlib.pyplot as plt
import numpy as np
from tensorflow import keras
from keras_preprocessing.image import load_img
import tensorflow as tf
import sys
sys.path.append('../')


def get_pred(prediction):
    '''Turn prediction into image'''
    mask = np.argmax(prediction, axis=-1)
    mask = np.expand_dims(mask, axis=-1)
    img = ImageOps.autocontrast(keras.preprocessing.image.array_to_img(mask))
    return img


def predict(model, path_to_image, image_size, plot=False, save=False):
    '''Function for predicting on a single image'''

    # Load image
    og_image = load_img(path_to_image)

    # Resize image
    image = og_image.resize((image_size, image_size))

    # Add dimension
    img = np.expand_dims(image, axis=0)

    # Predict
    prediction = model.predict(img)

    # Remove first dimensipon
    img = np.squeeze(img)
    prediction = np.squeeze(prediction)

    # Get prediction image
    pred = get_pred(prediction)

    # Resize prediction
    pred = pred.resize((og_image.size[0], og_image.size[1]))

    # Convert to binary
    pred = pred.point(lambda x: 255 if x > 30 else 0)

    if plot:

        # Find indices of non-zero pixels
        pred_array = np.array(pred)
        idx = np.nonzero(pred_array)

        # Create overlay image
        overlayColor = Image.new(mode="RGB", size=(
            og_image.size[0], og_image.size[1]), color=(144, 0, 211))
        overlay = np.array(og_image).copy()
        overlay[idx] = 0.6*np.array(og_image)[idx] + \
            0.4*np.array(overlayColor)[idx]

        plt.imshow(overlay)
        plt.title(f"Prediction on image {path_to_image.split('/')[-1]}")
        plt.show()

    if save:

        # Save prediction and image
        split = path_to_image.split('/')[-1].split('.')
        pred.save(f"predictions/{split[0]}_pred_mask.{split[1]}")
        og_image.save(f"predictions/{split[0]}_pred.{split[1]}")
        print(f"Saved image {path_to_image.split('/')[-1]} and predicted mask")

    return pred


class IOU(tf.keras.metrics.MeanIoU):
    def __init__(self, from_logits=False, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._from_logits = from_logits

    def update_state(self, y_true, y_pred, sample_weight=None):
        if self._from_logits:
            y_pred = tf.nn.softmax(y_pred)
            y_pred = tf.math.argmax(y_pred, axis=-1)
            super(IOU, self).update_state(
                y_true, y_pred, sample_weight=sample_weight)
        else:
            super(IOU, self).update_state(
                y_true, y_pred, sample_weight=sample_weight)


if __name__ == "__main__":

    if len(sys.argv) < 2:
        print("USAGE: python3 predict.py <path_to_images>")
        sys.exit(1)

    # Path to images
    path = sys.argv[1]

    if (not path):
        print("No path provided.")
        sys.exit(1)

    # Find all images in folder
    files = [f for f in listdir(path) if isfile(
        join(path, f)) and f != ".DS_Store"]

    # Load model
    model = keras.models.load_model("modelV4.h5", custom_objects={"IOU": IOU})

    # Set figure size
    plt.rcParams["figure.figsize"] = (20, 20)

    # Create folders
    os.makedirs("predictions", exist_ok=True)

    # Predict on all images
    for file in files:
        pred = predict(
            model=model, path_to_image=f"{path}/{file}", image_size=1024, plot=True, save=False)
