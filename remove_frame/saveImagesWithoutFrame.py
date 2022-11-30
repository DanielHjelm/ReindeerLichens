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

        print(image)
            
        # Remove frame 
        without_frame = removeFrame(os.getcwd()+'/'+path_to_images+'/'+image)
        
        # Convert to correct colors
        without_frame = cv2.cvtColor(without_frame, cv2.COLOR_BGR2RGB)
    
        # Save image to correct folder
        matplotlib.image.imsave(path_to_save_folder+'/'+image, without_frame)
        # im = Image.fromarray(without_frame)
        # im.save(path_to_save_folder+'/'+os.path.splitext(image)[0]+'.png')

        print("Saved image: ", os.path.splitext(image)[0]+'.png')


if __name__ == "__main__":
    path_to_images = '../../imagesToDB'
    path_to_save_folder = 'withoutFrame'
    number_of_images_to_save = 5
    saveImagesWithoutFrame(path_to_images, path_to_save_folder, number_of_images_to_save)
