import tensorflow as tf
from keras_preprocessing.image import load_img
from tensorflow import keras
import numpy as np
import matplotlib.pyplot as plt
from keras import backend as K
from PIL import Image
import os
from predict import predict
import sys
import tensorflow_addons as tfa



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

def intersection_over_union(gt, pred, num_classes=2):
    """
    Calculates the Intersection over Union (IoU) metric for a segmentation model.
        
    Parameters
    ----------
    gt: image
        Ground truth segmentation.
    pred: image
        Predicted segmentation.

    num_classes: int
        Number of classes in the segmentation.
        
    Returns
    -------
    iou: float
        The Intersection over Union (IoU) of the model.
    """
    
    # Make sure the masks are arrays
    gt = np.array(gt)
    pred= np.array(pred)

    # Ensure that the masks are binary.
    y_true = gt.astype(bool)
    y_pred = pred.astype(bool)

    # Compute the IoU for each class.
    ious = []
    for cls in range(num_classes):
        mask1 = y_true == cls
        mask2 = y_pred == cls
        intersection = (mask1 & mask2).sum()
        union = mask1.sum() + mask2.sum() - intersection
        iou = intersection / union
        ious.append(iou)

    # Compute the mean IoU.
    mean_iou = sum(ious) / 2
    return mean_iou

def pixel_accuracy(gt, pred):
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

def dice_coefficient(gt,pred):
    """
    Calculates the Dice coefficient for a segmentation model.
    
    Parameters
    ----------
    pred: image
        The predicted segmentation.
    gt: image
        The ground truth segmentation.
        
    Returns
    -------
    dice: float
        The Dice coefficient of the model.
    """
    
    
    # Caluclate intersection
    intersection = np.logical_and(gt, pred)
    
    # Calculate union
    union = np.logical_or(gt, pred)
    
    # Calculate dice coefficent
    dice = (2*np.sum(intersection))/(np.sum(union)+np.sum(intersection))
    
    return dice

def sensitivity(gt, pred):
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

def specificity(gt, pred):
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

def evaluate_image(gt, pred):
    """Evaluates a single image."""
    
    # Calculate the intersection-over-union (IoU)
    iou = intersection_over_union(gt, pred)
    
    # Calculate the pixel accuracy
    pixel_acc = pixel_accuracy(gt, pred)
    
    # Calculate the dice coefficient
    dice = dice_coefficient(gt, pred)

    # Calculate the sensitivity
    sens = sensitivity(gt, pred)

    # Calculate the specificity
    spec = specificity(gt, pred)
    
    return iou, pixel_acc, dice, sens, spec

def average_evaluation(ground_truth, predictions):
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

    if len(sys.argv) < 3:
        print("USAGE: python3 evaluate.py <path_to_ground_truth> <path_to_predictions>")

        sys.exit(1)

    # Set the paths to the ground truth and predictions
    path_to_ground_truth = sys.argv[1]
    path_to_predictions = sys.argv[2]

    if (not path_to_ground_truth) or (not path_to_predictions):
        print("No path to ground truth or predictions provided.")
        sys.exit(1)
        
    # Create the predictions folder if it doesn't exist
    if not os.path.exists(path_to_predictions):
        os.mkdir(path_to_predictions)
        


    # Create list of ground truth images and images to be predicted or loaded
    ground_truth_list = []
    to_prediction_list = []

    for folder in sorted(os.listdir(path_to_ground_truth)):
        if "DS_Store" not in folder:
            for image in sorted(os.listdir(os.path.join(path_to_ground_truth, folder))):

                # If the image is a mask, binarize it and add it to the list
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

    # Loop through the images to be predicted or loaded
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

            # Load the model if it hasn't been loaded yet
            if model == None:
                model = keras.models.load_model("modelV4.h5", custom_objects={"IOU": IOU})

            # Load the predicted mask
            prediction = predict(model=model, path_to_image=image_path, image_size=1024, plot=False, save=True)

            # Binarize the mask
            prediction = prediction.point(lambda x: 1 if x > 30 else 0)

            # Save the image
            predictions_list.append(prediction)


    # Evaluate the masks
    avg_iou, avg_acc, avg_dice, avg_sens, avg_spec = average_evaluation(ground_truth_list, predictions_list)

    # Print the results
    print(f"Average intersection over union: {avg_iou}")
    print(f"Average pixel accuracy: {avg_acc}")
    print(f"Average dice coefficient: {avg_dice}")
    print(f"Average sensitivity: {avg_sens}")
    print(f"Average specificity: {avg_spec}")