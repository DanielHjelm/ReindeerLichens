import tensorflow as tf
from keras_preprocessing.image import load_img
from tensorflow import keras
import numpy as np
import matplotlib.pyplot as plt
from keras import backend as K
from PIL import Image
import os

def intersection_over_union(mask1, mask2):
    """Calculates the intersection over union."""
    
    # Make sure the masks are arrays
    mask1 = np.array(mask1)
    mask2= np.array(mask2)
    
    # Calculate intersection
    intersection = np.logical_and(mask1, mask2)
    
    # Calculate union
    union = np.logical_or(mask1, mask2)
    
    # Return intersection over union
    return intersection.sum() / union.sum()

def pixel_accuracy(mask1, mask2):
    """Calculates the pixel accuracy."""
    
    # Make sure the masks are arrays
    mask1 = np.array(mask1)
    mask2= np.array(mask2)
    
    
    # Flatten the predicted and ground-truth masks
    mask1_flat = tf.reshape(mask1, [-1])
    mask2_flat = tf.reshape(mask2, [-1])

    # Compute the pixel accuracy
    accuracy = tf.reduce_mean(tf.cast(tf.equal(mask1_flat, mask2_flat), tf.float32))

    return accuracy

def dice_coefficient(mask1,mask2):
    """Calculates the dice coefficient."""
    
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


def evaluate_image(mask1, mask2):
    """Evaluates a single image."""
    
    # Calculate the intersection-over-union (IoU)
    iou = intersection_over_union(mask1, mask2)
    
    # Calculate the pixel accuracy
    pixel_acc = pixel_accuracy(mask1, mask2)
    
    # Calculate the dice coefficient
    dice = dice_coefficient(mask1, mask2)
    
    return iou, pixel_acc, dice

def average_evaluation(ground_truth, predictions):
    """Evaluates a list of images and gets the average IoU, pixel accuracy, and dice coefficient."""
    
    # Calculate the average IoU
    avg_iou = np.mean([intersection_over_union(ground_truth[i], predictions[i]) for i in range(len(ground_truth))])
    
    # Calculate the average pixel accuracy
    avg_acc = np.mean([pixel_accuracy(ground_truth[i], predictions[i]) for i in range(len(ground_truth))])
    
    # Calculate the average dice coefficient
    avg_dice = np.mean([dice_coefficient(ground_truth[i], predictions[i]) for i in range(len(ground_truth))])
    
    return avg_iou, avg_acc, avg_dice


if __name__ == "__main__":

    # Evaluate a single image
    
    # # Load the ground-truth mask
    # ground_truth = load_img("/Users/daniel/Desktop/Erik/01_mask.png")
    
    # # Load the predicted mask
    # prediction = load_img("/Users/daniel/Desktop/ReindeerLichens/predictions/01_pred_mask.png")
    
    # iou, pixel_acc, dice = evaluate_image(ground_truth, prediction)
    
    # # Print the results
    # print(f"Intersection over union: {iou}")
    # print(f"Pixel accuracy: {pixel_acc}")
    # print(f"Dice coefficient: {dice}")


    ### Evaluate a list of images

    path_to_ground_truth = "/Users/daniel/Desktop/ground_truth/"
    path_to_predictions = "/Users/daniel/Desktop/predictions/"

    # Load the ground-truth masks
    ground_truth_list = []
    for filename in sorted(os.listdir(path_to_ground_truth)):
        im=load_img(os.path.join(path_to_ground_truth, filename))
        ground_truth_list.append(im)
  
    # Load the predicted masks
    predictions_list = []
    for filename in sorted(os.listdir(path_to_predictions)):
        im=load_img(os.path.join(path_to_predictions, filename))
        predictions_list.append(im)

    
    # Evaluate a list of images
    avg_iou, avg_acc, avg_dice = average_evaluation(ground_truth_list, predictions_list)

    # Print the results
    print(f"Average intersection over union: {avg_iou}")
    print(f"Average pixel accuracy: {avg_acc}")
    print(f"Average dice coefficient: {avg_dice}")