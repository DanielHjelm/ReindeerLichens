import cv2
import os
from removeFrame import removeFrame
import sys


def saveImagesWithoutFrame(path_to_images, path_to_save_folder):
    # Loop through all the images in the folder
    for i, image in enumerate(os.listdir(os.getcwd()+'/'+path_to_images)):

        # Remove frame 
        without_frame = removeFrame(os.getcwd()+'/'+path_to_images+'/'+image)

        # Make sure the frame is removed
        if without_frame is not None:
            # Save image
            cv2.imwrite(path_to_save_folder+'/'+image, without_frame)
            print(f"Saved image: {image}")
    
def createFolders(outputFolders=["withoutFrame"]):
    '''Create folders for images without frame'''

    for folder in outputFolders:
        if not os.path.exists(folder):
            os.makedirs(folder)

if __name__ == "__main__":

    if len(sys.argv) < 3:
        print("USAGE: python3 evaluate.py <path_to_images> <path_to_save_folder>")

        sys.exit(1)

    # Set the paths to the ground truth and predictions
    path_to_images = sys.argv[1]
    path_to_save_folder = sys.argv[2]

    if (not path_to_images) or (not path_to_save_folder):
        print("No path to ground truth or predictions provided.")
        sys.exit(1)

    # Create folders
    createFolders([path_to_save_folder])
    
   # Save images without frame
    saveImagesWithoutFrame(path_to_images, path_to_save_folder)
