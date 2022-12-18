import imageio
import imgaug
import matplotlib.pyplot as plt
import os

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
        if "DS_Store" not in folder:
            for image in os.listdir(os.path.join(path_to_folder, folder)):
                if "DS_Store" and "augmented" in image:
                    continue
                if "mask" in image:
                    mask_name = image.split(".")[0]
                    mask_path = os.path.join(path_to_folder, folder, image)
                else:
                    image_name = image.split(".")[0]
                    image_path = os.path.join(path_to_folder, folder, image)
         
            print("-------------")

            # Read image and masks
            image = imageio.imread(image_path)
            mask = imageio.imread(mask_path)

            # Create ImageAugmenter object
            image_augmenter = ImageAugmenter(image, mask)

            # Crerate generator with 8 different rotated images and their mask
            gen = image_augmenter.return_augmented_images()

            # Example on how you access the images and masks. They are stored as (image, mask) tuples in the generator.
            for i, (image, mask) in enumerate(gen):
                plt.imsave(path_to_folder + "/" + folder + "/" + image_name + '_augmented' + f'_{i+1}' + "." + image_path.split('.')[-1], image)
                plt.imsave(path_to_folder + "/" + folder + "/" + mask_name + '_augmented' + f'_{i+1}' + "." + mask_path.split('.')[-1], mask)
                print(f'Augmented image and mask saved to: {path_to_folder + "/" + folder}')

if __name__ == '__main__':

    # Path to folder with images and masks
    path_to_folder = '/Users/daniel/Desktop/ReindeerLichens/downloaded_images'

    # Augment images and masks
    augment_images(path_to_folder)
  