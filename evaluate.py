import tensorflow as tf
from keras_preprocessing.image import load_img
from tensorflow import keras
import numpy as np
import matplotlib.pyplot as plt
from keras import backend as K
from PIL import Image
import os
from predict import predict
import re


def intersection_over_union(mask1, mask2):
    """
    Calculates the Intersection over Union (IoU) metric for a segmentation model.
        
    Parameters
    ----------
    mask1: image
        Either predicted or ground truth segmentation.
    mask2: image
        TEither predicted or ground truth segmentation.
        
    Returns
    -------
    iou: float
        The Intersection over Union (IoU) of the model.
    """
    
    # Make sure the masks are arrays
    mask1 = np.array(mask1)
    mask2= np.array(mask2)
    
    # Calculate intersection
    intersection = np.logical_and(mask1, mask2)
    
    # Calculate union
    union = np.logical_or(mask1, mask2)
    
    # Return intersection over union
    return intersection.sum() / union.sum()

def pixel_accuracy(pred, gt):
    """
    Calculates the pixel-level accuracy of a segmentation model.
    
    Parameters
    ----------
    pred: numpy array
        The predicted segmentation.
    gt: numpy array
        The ground truth segmentation.
        
    Returns
    -------
    accuracy: float
        The pixel-level accuracy of the model.
    """

    # Make sure the masks are arrays
    pred = np.array(pred)
    gt= np.array(gt)

    correct = (pred == gt).sum()
    total = pred.size
    accuracy = correct / total
    return accuracy

def dice_coefficient(mask1,mask2):
    """
    Calculates the Dice coefficient for a segmentation model.
    
    Parameters
    ----------
    mask1: image
        Either predicted or ground truth segmentation.
    mask2: image
        TEither predicted or ground truth segmentation.
        
    Returns
    -------
    dice: float
        The Dice coefficient of the model.
    """
    
    # Make sure the masks are arrays
    mask1 = np.array(mask1)
    mask2= np.array(mask2)
    
    # Caluclate intersection
    intersection = np.logical_and(mask1, mask2)
    
    # Calculate union
    union = np.logical_or(mask1, mask2)
    
    # Calculate dice coefficent
    dice = (2*np.sum(intersection))/(np.sum(union)+np.sum(intersection))
    
    return dice

def sensitivity(pred, gt):
    """
    Calculates the sensitivity (true positive rate or recall) for a segmentation model.
    
    Parameters
    ----------
    pred: image
        The predicted segmentation.
    gt: image
        The ground truth segmentation.
        
    Returns
    -------
    sensitivity: float
        The sensitivity of the model.
    """

    # Make sure the masks are arrays
    pred = np.array(pred)
    gt= np.array(gt)

    # True positives
    tp = (pred & gt).sum()

    # False negatives
    fn = np.logical_and(gt, np.logical_not(pred)).sum()

    # Calculate sensitivity
    sensitivity = tp / (tp + fn)
    
    return sensitivity

def specificity(pred, gt):
    """
    Calculates the specificity for a segmentation model.
    
    Parameters
    ----------
    pred: image
        The predicted segmentation.
    gt: image
        The ground truth segmentation.
        
    Returns
    -------
    specificity: float
        The specificity of the model.
    """

    # Make sure the masks are arrays
    pred = np.array(pred)
    gt= np.array(gt)

    # True negatives
    tn = np.logical_and(np.logical_not(pred), np.logical_not(gt)).sum()

    # False positives
    fp = np.logical_and(pred, np.logical_not(gt)).sum()

    # Calculate specificity
    specificity = tn / (tn + fp)

    return specificity

def evaluate_image(pred, gt):
    """Evaluates a single image."""
    
    # Calculate the intersection-over-union (IoU)
    iou = intersection_over_union(pred, gt)
    
    # Calculate the pixel accuracy
    pixel_acc = pixel_accuracy(pred, gt)
    
    # Calculate the dice coefficient
    dice = dice_coefficient(pred, gt)

    # Calculate the sensitivity
    sens = sensitivity(pred, gt)

    # Calculate the specificity
    spec = specificity(pred, gt)
    
    return iou, pixel_acc, dice, sens, spec

def average_evaluation(predictions, ground_truth):
    """Evaluates a list of images and gets the average IoU, pixel accuracy, and dice coefficient."""
    
    # Calculate the average IoU
    avg_iou = np.mean([intersection_over_union(ground_truth[i], predictions[i]) for i in range(len(ground_truth))])
    
    # Calculate the average pixel accuracy
    avg_acc = np.mean([pixel_accuracy(ground_truth[i], predictions[i]) for i in range(len(ground_truth))])
    
    # Calculate the average dice coefficient
    avg_dice = np.mean([dice_coefficient(ground_truth[i], predictions[i]) for i in range(len(ground_truth))])

    # Calculate the average sensitivity
    avg_sens = np.mean([sensitivity(ground_truth[i], predictions[i]) for i in range(len(ground_truth))])

    # Calculate the average specificity
    avg_spec = np.mean([specificity(ground_truth[i], predictions[i]) for i in range(len(ground_truth))])
    
    return avg_iou, avg_acc, avg_dice, avg_sens, avg_spec





if __name__ == "__main__":

    # # Evaluate a single image
    # image_path = "/Users/daniel/Desktop/Erik/03.png"
    # image = load_img(image_path)

    # # Load the ground-truth mask
    # ground_truth = load_img("/Users/daniel/Desktop/Erik/03_mask.png", color_mode="grayscale")
    # print(np.shape(np.array(ground_truth)))

    # # Load model
    # model = keras.models.load_model("model.h5")
    
    # # Load the predicted mask
    # prediction = predict(model=model, path_to_image=image_path, image_size=1024, plot=False, save=False)

    # # Binarize the mask
    # prediction = prediction.point(lambda x: 1 if x > 30 else 0)


    # iou, pixel_acc, dice, sens, spec = evaluate_image(prediction, ground_truth)
    
    # # Print the results
    # print(f"Intersection over union: {iou}")
    # print(f"Pixel accuracy: {pixel_acc}")
    # print(f"Dice coefficient: {dice}")
    # print(f"Sensitivity: {sens}")
    # print(f"Specificity: {spec}")


    ### Evaluate a list of images

    path_to_ground_truth = "/Users/daniel/Desktop/testSet/"
    path_to_predictions = "/Users/daniel/Desktop/ReindeerLichens/predictions/"

    if not os.path.exists(path_to_predictions):
        os.mkdir(path_to_predictions)
        


    # Load the ground-truth masks
    ground_truth_list = []
    to_prediction_list = []
    for folder in sorted(os.listdir(path_to_ground_truth)):
        if "DS_Store" not in folder:
            for image in sorted(os.listdir(os.path.join(path_to_ground_truth, folder))):
                if "DS_Store" not in image and "mask" in image:

                    # Load the image
                    im=load_img(os.path.join(path_to_ground_truth, folder, image), color_mode="grayscale")

                    # Binarize the mask
                    im = im.point(lambda x: 1 if x > 30 else 0)

                    # Add the image to the list
                    ground_truth_list.append(im)

                else:
                    # Add the image to the list that is to be predicted or loaded
                    to_prediction_list.append(os.path.join(path_to_ground_truth, folder, image))

    # Create a list of the predicted masks
    predictions_list = []

    # Initiliaze model to None and load it only once (if needed)
    model = None
    for image_path in to_prediction_list:

        # Split the image name
        split = image_path.split("/")[-1].split(".")
        image_name = image_path.split("/")[-1]


        # Check if the image has already been predicted
        if split[0]+"_pred_mask."+split[1] in sorted(os.listdir(path_to_predictions)):

            print(f"Loading prediction for {image_name}...")

            # Load the predicted mask
            prediction = load_img(os.path.join(path_to_predictions, split[0]+"_pred_mask."+split[1]), color_mode="grayscale")

            # Binarize the mask
            prediction = prediction.point(lambda x: 1 if x > 30 else 0)

            # Add to list
            predictions_list.append(prediction)

        else:
            print(f"Predicting on image {image_name}...")
            if model == None:
                model = keras.models.load_model("model.h5")

            # Load the predicted mask
            prediction = predict(model=model, path_to_image=image_path, image_size=1024, plot=False, save=True)

            # Binarize the mask
            prediction = prediction.point(lambda x: 1 if x > 30 else 0)

            # Save the image
            predictions_list.append(prediction)


    # Evaluate a list of images
    avg_iou, avg_acc, avg_dice, avg_sens, avg_spec = average_evaluation(ground_truth_list, predictions_list)

    # Print the results
    print(f"Average intersection over union: {avg_iou}")
    print(f"Average pixel accuracy: {avg_acc}")
    print(f"Average dice coefficient: {avg_dice}")
    print(f"Average sensitivity: {avg_sens}")
    print(f"Average specificity: {avg_spec}")