import tensorflow as tf
from keras_preprocessing.image import load_img
from tensorflow import keras
import numpy as np
import matplotlib.pyplot as plt
from keras import backend as K

# Calculate the intersection-over-union (IoU)
def intersection_over_union(mask1, mask2):
    
    # Make sure the masks are arrays
    mask1 = np.array(mask1)
    mask2= np.array(mask2)
    
    # Calculate intersection
    intersection = np.logical_and(mask1, mask2)
    
    # Calculate union
    union = np.logical_or(mask1, mask2)
    
    # Return intersection over union
    return intersection.sum() / union.sum()

# Calculate the pixel accuracy
def pixel_accuracy(mask1, mask2):
    
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


def evaluate(mask1, mask2):
        
        # Calculate the intersection-over-union (IoU)
        iou = intersection_over_union(mask1, mask2)
        
        # Calculate the pixel accuracy
        pixel_acc = pixel_accuracy(mask1, mask2)
        
        # Calculate the dice coefficient
        dice = dice_coefficient(mask1, mask2)
        
        return iou, pixel_acc, dice


if __name__ == "__main__":
    
    # Load the ground-truth mask
    ground_truth = load_img("/Users/daniel/Desktop/Erik/01_mask.png")
    
    # Load the predicted mask
    prediction = load_img("/Users/daniel/Desktop/ReindeerLichens/predictions/01_pred_mask.png")
    
    iou, pixel_acc, dice = evaluate(ground_truth, prediction)
    
    # Print the results
    print(f"Intersection over union: {iou}")
    print(f"Pixel accuracy: {pixel_acc}")
    print(f"Dice coefficient: {dice}")