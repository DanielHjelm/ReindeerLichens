import cv2
import numpy as np
import sys
sys.path.append("removeBlueFrame.py")
sys.path.append("removeFoldingRule.py")
from removeBlueFrame import removeBlueFrame
from removeFoldingRule import removeFoldingRule


def removeFrame(image_path):
    '''Function for removing frame from image'''
    
    # Read image
    img = cv2.imread(image_path)
    
    # Convert to HSV
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h,s,v = cv2.split(hsv)

    # Create mask for blue color in HSV
    lower = (80,100,100)
    upper = (160,255,255)
    mask = cv2.inRange(hsv, lower, upper)

    # Count non-zero pixels in mask (i.e blue pixels)
    count=np.count_nonzero(mask)
    
    # If images have to few blue pixels, use removeFoldingRule
    if count < 333000:
        return removeFoldingRule(image_path)
    
    # Else use, removeBlueFrame
    else:
        return removeBlueFrame(image_path)