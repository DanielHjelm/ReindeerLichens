from keras_preprocessing.image import load_img
from tensorflow import keras
import numpy as np
import matplotlib.pyplot as plt
from PIL import ImageOps
import cv2
from PIL import Image
from os import listdir
from os.path import isfile, join
from downloadFromDB import createFolders

def get_pred(prediction):
    '''Turn prediction into image'''
    mask = np.argmax(prediction, axis=-1)
    mask = np.expand_dims(mask, axis=-1)
    img = ImageOps.autocontrast(keras.preprocessing.image.array_to_img(mask))
    return img


def predict(model, path_to_image, image_size, plot=False, save=False):
    '''Function for predicting on a single image'''


    # Load image
    image = load_img(path_to_image)

    # Resize image
    image = image.resize((image_size, image_size))

    # Add dimension
    img = np.expand_dims(image, axis=0)

    # Predict
    prediction = model.predict(img)

    # Remove first dimensipon
    img = np.squeeze(img)
    prediction = np.squeeze(prediction)

    if plot:

        # Get prediction image
        pred = get_pred(prediction)
        
        # Find indices of non-zero pixels
        pred_array = np.array(pred)
        idx = np.nonzero(pred_array)

        # Create overlay image
        overlayColor = Image.new(mode="RGB", size=(image_size, image_size), color=(144,0,211))
        overlay = img.copy()
        overlay[idx] = 0.6*img[idx] + 0.4*np.array(overlayColor)[idx]

        plt.imshow(overlay)
        plt.title(f"Prediction on image {path_to_image.split('/')[-1]}")
        plt.show()
        
    if save:

        if not plot:
            # Get prediction image
            pred = get_pred(prediction)

        # Save prediction and image
        split = path_to_image.split('/')[-1].split('.')
        pred.save(f"predictions/{split[0]}_mask.{split[1]}")
        image.save(f"predictions/{path_to_image.split('/')[-1]}")
        print(f"Saved image {path_to_image.split('/')[-1]} and predicted mask")


    return prediction
    
        

if __name__ == "__main__":

    # Find all images in folder
    path = "/Users/daniel/Desktop/test"
    files = [f for f in listdir(path) if isfile(join(path, f)) and f != ".DS_Store"]

    # Load model
    model = keras.models.load_model("model.h5")

    # Set figure size
    plt.rcParams["figure.figsize"] = (20, 20)

    # Create folders
    createFolders(["predictions"])

    # Predict on all images
    for file in files:
        predict(model=model, path_to_image=f"{path}/{file}", image_size=1024, plot=True, save=True)