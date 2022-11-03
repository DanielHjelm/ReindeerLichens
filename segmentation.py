import sys
import os
import cv2
import numpy as np
from removeFrame import removeFrame


def generateMask(image):

    sensitivity = 80

    # low = np.array([220, 220, 220])
    # high = np.array([255, 255, 255])
    image = cv2.cvtColor(image, cv2.COLOR_RGB2HLS_FULL)

    # mask = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Bright
    low = np.array([0, int(255*.6), 0])
    high = np.array([64, 255, 255])
    mask = cv2.inRange(image, low, high)
    low = np.array([130, int(255*.6), 0])
    high = np.array([255, 255, 255])
    mask = cv2.bitwise_or(mask, cv2.inRange(image, low, high))

    # # Mid bright
    # low = np.array([30, int(255*.5), int(255*.05)])
    # high = np.array([225, 255, int(255*.15)])

    # mask = cv2.bitwise_or(mask, cv2.inRange(image, low, high))

    # # Dark
    # low = np.array([30, int(255*.3), int(255*.08)])
    # high = np.array([225, int(255*.5), int(255*.15)])
    # mask = cv2.bitwise_or(mask, cv2.inRange(image, low, high))

    # low = np.array([0, 110, 20])
    # high = np.array([255, 180, 60])
    # cv2.imshow("mask", mask)
    # cv2.waitKey(0)
    # cv2.destroyAllWindows()

    return mask


def saveImage(image, path):
    if not cv2.imwrite(path, image):
        raise Exception("Could not write image")


def createFolders(outputFolders=["result"]):
    for folder in outputFolders:
        if not os.path.exists(folder):
            os.mkdir(folder)


def processImage(imagePath):
    image = removeFrame(f"{path}/{file}")
    B, G, R = cv2.split(image)
    B = cv2.equalizeHist(B)
    G = cv2.equalizeHist(G)
    R = cv2.equalizeHist(R)
    out = cv2.merge((B, G, R))
    # cv2.imshow("image", out)
    # cv2.waitKey(0)
    # cv2.destroyAllWindows()
    mask = generateMask(image)
    parentFolder = outputFolder + "/" + file.split(".")[0]
    createFolders([parentFolder])
    # Save image
    saveImage(
        image, f"{parentFolder}/original.jpg")
    # Save mask
    saveImage(
        mask, f"{parentFolder}/mask.jpg")
    # Save image
    idx = (mask != 0)
    image[idx] = purple
    saveImage(
        image, f"{parentFolder}/overlay.jpg")
    coverege = np.sum(mask == 255) / mask.size
    with open(f"{parentFolder}/coverage.txt", "w") as f:
        f.write(f"coverege: {round(coverege * 100, 1)}% \n")


if __name__ == "__main__":

    if (len(sys.argv) < 2):
        print(
            "Usage: python segmentation.py pathToFolderOrFile OPTIONAL: pathToOutputFolder")
        sys.exit(1)

    outputFolder = "result"

    if (len(sys.argv) == 3):
        outputFolder = f"{os.getcwd()}/{sys.argv[2]}"

    path = sys.argv[1]

    purple = [148, 0, 211]
    createFolders([outputFolder])

    if (os.path.isdir(path)):
        for file in os.listdir(path):
            if (file.lower().endswith(".jpg")):
                processImage(file)

        sys.exit(0)

    else:
        processImage(path)
        sys.exit(0)
