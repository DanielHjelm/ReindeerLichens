import imageio.v2 as imageio
import imgaug
import matplotlib.pyplot as plt
import os
import time

class ImageAugmenter:
    """
    Class to augment images and masks.
    """
    def __init__(self, image, mask):
        self.image = image
        self.mask = mask

    def rotate(self, number_of_degrees):
        """
        Rotate image and mask by number_of_degrees degrees.
        """
        self.image, self.mask = rotate_image(self.image, self.mask, number_of_degrees)

    def flip(self, flip_direction):
        """
        Flip image and mask horizontally or vertically.
        """
        self.image, self.mask = flip_image(self.image, self.mask, flip_direction)

    def contrast(self, type_of_contrast):
        """
        Adjust contrast of image and mask.
        """
        self.image, self.mask = contrast_image(self.image, self.mask, type_of_contrast)

    def show(self):
        """
        Show image and mask.
        """
        fig, ax = plt.subplots(1, 2, figsize=(10, 5))
        ax[0].imshow(self.image)
        ax[0].set_title('Image')
        ax[1].imshow(self.mask, cmap='gray')
        ax[1].set_title('Mask')
        plt.show()

    def return_augmented_images(self):
        """Returns a generator with 8 different rotated images and their mask."""
        for flip_direction in ['horizontal', 'vertical']:
            self.flip(flip_direction)
            for number_of_degrees in [0, 90, 180, 270]:
                self.rotate(number_of_degrees)
                yield self.image, self.mask

def rotate_image(image, mask, number_of_degrees):
    """
    Rotate image and mask by number_of_degrees degrees.
    """
    image_rot = imgaug.augmenters.Affine(rotate=number_of_degrees).augment_image(image)
    mask_rot = imgaug.augmenters.Affine(rotate=number_of_degrees).augment_image(mask)
    return image_rot, mask_rot

def flip_image(image, mask, flip_direction):
    """
    Flip image and mask horizontally or vertically.
    """
    if flip_direction == 'horizontal':
        image_flip = imgaug.augmenters.Fliplr(p=1.0).augment_image(image)
        mask_flip = imgaug.augmenters.Fliplr(p=1.0).augment_image(mask)

    elif flip_direction == 'vertical':
        image_flip = imgaug.augmenters.Flipud(p=1.0).augment_image(image)
        mask_flip = imgaug.augmenters.Flipud(p=1.0).augment_image(mask)


    return image_flip, mask_flip

def contrast_image(image, mask, type_of_contrast):
    """
    Adjust contrast of image and mask.
    """
    if type_of_contrast == 'Gamma':
        image_contrast = imgaug.augmenters.GammaContrast(gamma=2.0).augment_image(image)
    
    elif type_of_contrast == 'Sigmoid':
        image_contrast = imgaug.augmenters.SigmoidContrast(gain=10, cutoff=0.5).augment_image(image)

    elif type_of_contrast == 'Linear':
        image_contrast = imgaug.augmenters.LinearContrast(alpha=1.5).augment_image(image)

    return image_contrast, mask

def augment_images(path_to_folder):

    """Augment images and masks in path_to_folder. A ImageAugmenter object is created for each image and mask."""

    for folder in os.listdir(path_to_folder):
        if folder != ".DS_Store":
            for image in os.listdir(os.path.join(path_to_folder, folder)):
                if "mask" in image:
                    mask_path = os.path.join(path_to_folder, folder, image)
                else:
                     image_path = os.path.join(path_to_folder, folder, image)

            # Read image and masks
            image = imageio.imread(image_path)
            mask = imageio.imread(mask_path)

            # Create ImageAugmenter object
            image_augmenter = ImageAugmenter(image, mask)

            # Crerate generator with 8 different rotated images and their mask
            gen = image_augmenter.return_augmented_images()

            # Example on how you access the images and masks. They are stored as (image, mask) tuples in the generator.
            # for i, (image, mask) in enumerate(gen):
            #     plt.subplot(1, 2, 1)
            #     plt.imshow(image)
            #     plt.subplot(1, 2, 2)
            #     plt.imshow(mask)
            #     plt.show()




if __name__ == '__main__':

    path_to_folder = '/Users/daniel/Desktop/downloaded_images'
    start = time.time()
    augment_images(path_to_folder)
    end = time.time()
    print(end - start)

    # image = imageio.imread('images/01.png')
    # mask = imageio.imread('masks/01_mask.png')

    # image_augmenter = ImageAugmenter(image, mask)
    # gen = image_augmenter.return_augmented_images()
    
    # for i, (image, mask) in enumerate(gen):
    #     plt.subplot(1, 2, 1)
    #     plt.imshow(image)
    #     plt.subplot(1, 2, 2)
    #     plt.imshow(mask)
    #     plt.show()

    
    # image_augmenter.rotate(90)
    # image_augmenter.flip('horizontal')
    # image_augmenter.contrast('Gamma')
    # image_augmenter.show()
    # image_rot, mask_rot = contrast_image(image, mask, 'Linear')
    # plt.subplot(1,2,1)
    # plt.title('Original image')
    # plt.imshow(image)
    # plt.subplot(1, 2, 2)
    # plt.title('Augmented image')
    # plt.imshow(image_rot)
    # plt.show()
