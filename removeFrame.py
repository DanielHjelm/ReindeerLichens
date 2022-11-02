import numpy as np
import cv2
import matplotlib.pyplot as plt

def removeFrame(image_path):
    '''Function that removes the frame in the image'''

    # Load image
    img = cv2.imread(image_path)

    # Create grayscale image
    gray = cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)

    # GaussionBlur the gray image
    kernel_size = 3
    blur_gray = cv2.GaussianBlur(gray,(kernel_size, kernel_size),0)

    # Threshold image
    thresh = cv2.threshold(blur_gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]

    # Create kernel used in the dilation
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (13,13))

    # Dilate the thresholded image
    dilate = cv2.dilate(thresh, kernel, iterations=3)

    # Fill holes 
    kernel2 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(150,150))
    res = cv2.morphologyEx(dilate,cv2.MORPH_OPEN,kernel2)

    # Find the contours in the image
    contours = cv2.findContours(res, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    contours = contours[0] if len(contours) == 2 else contours[1]

    # Loop through each area
    area_list = []
    for i,contour in enumerate(contours):
        area = cv2.contourArea(contour)
        area_list.append((i,area))

    # Find maximum area
    max_tuple = max(area_list, key=lambda tup: tup[1])

    # Use boundingRect to find area within frame
    x,y,w,h = cv2.boundingRect(contours[max_tuple[0]])

    # Area within frame
    output = np.zeros((w,h))
    output = img[y:y+h, x:x+w]

    return output

if __name__ == "__main__":
    image = removeFrame('IMG_0155.jpg')
    plt.imshow(image)
    plt.show()


