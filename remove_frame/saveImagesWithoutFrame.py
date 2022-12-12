import cv2
import numpy as np
import matplotlib
import os
from removeFrame import removeFrame
from PIL import Image 

def saveImagesWithoutFrame(path_to_images, path_to_save_folder, number_of_images_to_save):
    # Loop through all the images in the folder
    for i, image in enumerate(os.listdir(os.getcwd()+'/'+path_to_images)):
        if i+1 > number_of_images_to_save:
            break

        # Remove frame 
        without_frame = removeFrame(os.getcwd()+'/'+path_to_images+'/'+image)

        # Make sure the frame is removed
        if without_frame is not None:
            # Save image
            cv2.imwrite(path_to_save_folder+'/'+image, without_frame)
            print(f"Saved image: {image}")
    


if __name__ == "__main__":
    path_to_images = '../../removeImgFrame'
    path_to_save_folder = 'withoutFrame'
    number_of_images_to_save = 1000
    saveImagesWithoutFrame(path_to_images, path_to_save_folder, number_of_images_to_save)
