import sys
import os
import cv2
import numpy as np

from remove_frame.removeBlueFrame import removeBlueFrame
from remove_frame.removeFoldingRule import removeFoldingRule

def generateMask(image,lims):

    # sensitivity = 80

    image = cv2.cvtColor(image, cv2.COLOR_RGB2HLS_FULL)
    
    lims = lims.reshape(6,3) # reshape the 18x1 to more understandeble shape
    # Bright
    low = lims[0,:]
    high = lims[1,:]
    mask = cv2.inRange(image, low, high)
    low = lims[2,:]
    high = lims[3,:]
    mask = cv2.bitwise_or(mask, cv2.inRange(image, low, high))
    low = lims[4,:]
    high = lims[5,:]
    mask = cv2.bitwise_or(mask, cv2.inRange(image, low, high))

    return mask

# Segmentation based on Otsu's tresholding on a grayscale version of the input image
def generateOtsuMask(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # Gaussian filtering and Otsu thresholding
    #filtersize = np.ceil(np.shape(gray)[1]*0.002)
    #filtersize = int(filtersize)
    #print(filtersize)
    filt = cv2.GaussianBlur(gray,(15,15),cv2.BORDER_DEFAULT)
    ret3,OtsuMask = cv2.threshold(filt,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)
    return OtsuMask
          
          
def saveImage(image, path):
    if not cv2.imwrite(path, image):
        raise Exception("Could not write image")


def createFolders(outputFolders=["result"]):
    for folder in outputFolders:
        if not os.path.exists(folder):
            os.mkdir(folder)


def processImage(imagePath,lims):
    image = removeFoldingRule(imagePath)
    B, G, R = cv2.split(image)
    B = cv2.equalizeHist(B)
    G = cv2.equalizeHist(G)
    R = cv2.equalizeHist(R)
    out = cv2.merge((B, G, R))
    # cv2.imshow("image", out)
    # cv2.waitKey(0)
    # cv2.destroyAllWindows()
    mask = generateMask(image,lims)
    #OtsuMask = generateOtsuMask(image)
    
    # Check the operating system and create folder for results depedning on that
    if sys.platform == "win32":
        parentFolder = os.path.dirname(imagePath) + "\\" + outputFolder
    else:
        parentFolder = outputFolder + "/" + imagePath.split(".")[0]
    #print(parentFolder)
    createFolders([parentFolder])
    # Get file name of image
    imName = imagePath.replace(os.path.dirname(imagePath)+'\\','') # Should surely be some smother way to get the image file orginigal name, but works
    imName = imName[:-4] # Remvoes '.jpg'
    # Save image
    saveImage(
        image, f"{parentFolder}/{imName}_original.jpg")
    # Save mask
    saveImage(
        mask, f"{parentFolder}/{imName}_mask.jpg")
    # Save Otsu mask
    #saveImage(
    #    OtsuMask, f"{parentFolder}/{imName}_OtsuMask.jpg")
    
    # Save image
    idx = (mask != 0)
    image[idx] = purple
    saveImage(
        image, f"{parentFolder}/{imName}_overlay.jpg")
    coverege = np.sum(mask == 255) / mask.size
    with open(f"{parentFolder}/{imName}_coverage.txt", "w") as f:
        f.write(f"coverege: {round(coverege * 100, 1)}% \n")


if __name__ == "__main__":

    if (len(sys.argv) < 2):
        print(
            "Usage: python segmentation.py pathToFolderOrFile limits OPTIONAL: pathToOutputFolder limits")
        sys.exit(1)

    outputFolder = "result"
    
    # standard limits for the mak if non is given, from first testing
    standardLims = np.array([[0, int(255*.6), 0],
                     [64, 255, 255],
                     [160, int(255*.6), 0],
                     [255, 255, 255],
                     [0, int(255 * .4), int(255 * .05)],
                     [255, int(255 * .9), int(255 * .15)]])
    print(sys.argv)
    print(len(sys.argv))
    if (len(sys.argv) == 4):
        standardLims = f"{os.getcwd()}/{sys.argv[3]}"
        print('4 argument')
        outputFolder = f"{os.getcwd()}/{sys.argv[2]}"
    elif (len(sys.argv) == 3):
        outputFolder = f"{os.getcwd()}/{sys.argv[2]}"

    path = sys.argv[1]

    purple = [148, 0, 211]
    
    outputFolder = "result" ## Japp, ignorerar att läsa in outputfolder
    createFolders([outputFolder])

    if (os.path.isdir(path)):
        for file in os.listdir(path):
            if (file.lower().endswith(".jpg")):
                processImage(f"{path}/{file}",standardLims)

        sys.exit(0)

    else:
        processImage(path,standardLims)
        sys.exit(0)
