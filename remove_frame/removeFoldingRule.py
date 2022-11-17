
import cv2
import numpy as np
import os
import matplotlib.pyplot as plt


def removeFrameUsingHoughLines(image_path, dilation_kernel = 20):

    '''Function that removes the frame in the image using Hough Lines'''

    # Read image
    img = cv2.imread(image_path)

    # Create grayscale image
    gray = cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)

    # Median filter the gray image
    median = cv2.medianBlur(gray, 1)

    # Sharpen image
    sharpen_kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
    sharpen = cv2.filter2D(median, -1, sharpen_kernel)

    # Threshold image
    thresh = cv2.threshold(sharpen, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]

    # Create kernel used in the dilation
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (dilation_kernel,dilation_kernel))

    # Dilate the thresholded image
    dilate = cv2.dilate(thresh, kernel, iterations=1)

    # Extract edges with Canny
    edges = cv2.Canny(dilate,50,150,apertureSize = 3)

    # Extract lines using HoughLines
    lines = cv2.HoughLinesP(image=edges,rho=1,theta=np.pi/180, threshold=100,lines=np.array([]), minLineLength=10,maxLineGap=500)

    # Check if we actually get some lines
    if lines is not None:
        
        # Draw lines on black background
        lines_out = np.zeros_like(gray)
        for i in range(np.shape(lines)[0]):
            cv2.line(lines_out, (lines[i][0][0], lines[i][0][1]), (lines[i][0][2], lines[i][0][3]), (255,255,255), 10, cv2.LINE_AA)

        # Using Closing to fill
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (100,100))
        closing = cv2.morphologyEx(lines_out, cv2.MORPH_CLOSE, kernel, iterations=1)

        # Find countours
        contours = cv2.findContours(closing, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        contours = contours[0] if len(contours) == 2 else contours[1]

        # Loop through each area
        area_list = []
        for i,contour in enumerate(contours):
            area = cv2.contourArea(contour)
            area_list.append((i,area))

        # Pick correct area
        if len(area_list) == 1:
            tup = area_list[0]
        else:
            tup = sorted(area_list, key=lambda tup: tup[1], reverse=True)[1]

        # If area to small, return None
        if tup[1] < 300000:
            return None

        # Use boundingRect to find area within frame
        x,y,w,h = cv2.boundingRect(contours[tup[0]])
       
        # Area within frame
        output = np.zeros((w,h))
        output = img[y:y+h, x:x+w]
        # print(f'Ratio between sides: {np.shape(output)[0]/np.shape(output)[1]}')
        # print(f'Ratio area: {(np.shape(output)[0]*np.shape(output)[1])/(np.shape(img)[0]*np.shape(img)[1])}')

        # If returned image is somewhat sqaure, return results
        if (0.9 <= np.shape(output)[0]/np.shape(output)[1] <= 1.1) and (0.2 < (np.shape(output)[0]*np.shape(output)[1])/(np.shape(img)[0]*np.shape(img)[1]) < 0.65):
            return output

        # If output image not somewhat or image cut to much or to little
        else:
            return None

    # If no lines return None
    else:
        return None

def removeFoldingRule(image_path):
    '''Function removing folding rule frame from images'''

    # Try with dilation_kernel=20
    no_frame = removeFrameUsingHoughLines(image_path=image_path, dilation_kernel=20)
    
    # If it works with 20, return image
    if no_frame is not None:
        return no_frame

    # Try with smaller dilation kernel       
    else:
        no_frame = removeFrameUsingHoughLines(image_path=image_path, dilation_kernel=10)
        
        if no_frame is not None:
            return no_frame
        else:
            print('Frame could not be removed')
            return None

