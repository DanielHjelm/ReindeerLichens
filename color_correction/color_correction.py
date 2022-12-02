import cv2
import numpy as np
import sys
from matplotlib import pyplot as plt
from scipy.optimize import minimize_scalar
sys.path.append('remove_frame')
from removeFrame import removeFrame
import colour

def histogram_norm(path, clipLimit=6.0, tileGridSize=(6,6)):
    img = cv2.imread(path)
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    l_channel, a, b = cv2.split(lab)

    # Applying CLAHE to L-channel - tileGridSize controls the size of the where local
    clahe = cv2.createCLAHE(clipLimit=6.0, tileGridSize=(6,6))
    cl = clahe.apply(l_channel)

    # merge the CLAHE enhanced L-channel with the a and b channel
    limg = cv2.merge((cl,a,b))
    return limg


def color_correction(path, method = 'gamma', dist_meas = 'euclidean'):
    '''Function for automatic color correction of img, based on the blue frame'''
    # Avg from graycard, in rgb = [98.918, 98.918, 98.926]
    # Assuiming linear transform and it should be rgb [124, 124, 124]. This gives the transform:
    transform = np.array([[1.25356, 0, 0],
                          [0, 1.25357, 0],
                          [0, 0, 1.25346]])
    # Avg of frameColors in rgb [31.055, 81.530, 145.941]
    # Assuming a linear transform, we get the the true colors of the frame as:
    avgBlue = np.array([[31.055], [81.530], [145.941]]);
    global trueBlue # Accessible for all distance measurments, could be passed to those functions instead     
    trueBlue = np.dot(transform,avgBlue)

    # rgb to bgr, as cv2 uses bgr as standard:
    trueBlue = np.dot([[0, 0, 1],[0, 1, 0],[1,0,0]],trueBlue)
    
    # Read the image and remove the frame, saving the parameters about where the frame was cut in original image
    img = cv2.imread(path)
    noFrame, x, y, w, h = removeFrame(path)
    
    # Make samples of the color of the frame on all 4 different sides
    sampleSize = 20 # sampleSize^2 is the number of pixels taken from each of the 4 sides of the frame
    #imageBlue = np.zeros((sampleSize*sampleSize*4,1,3))
    top = img[y-sampleSize:y, int((x+w)*.55):int((x+w)*.55)+sampleSize]
    right = img[int((y+h)*.55)-sampleSize:int((y+h)*.55), x+w:x+w+sampleSize]
    bottom = img[y+h:y+h+sampleSize, int((x+w)*.55):int((x+w)*.55)+sampleSize]
    left = img[int((y+h)*.55)-sampleSize:int((y+h)*.55), x-sampleSize:x]
    sampleMean = (np.mean(top,(0,1))+np.mean(right,(0,1))+np.mean(bottom,(0,1))+np.mean(left,(0,1)))/4
    
    # Set to true for plotting all the sampled pixels from frame
    if False:
        # Create of all samples subplots
        fig, axs = plt.subplots(2, 2, figsize=(10,10))
        axs[0, 0].imshow(cv2.cvtColor(top, cv2.COLOR_BGR2RGB))
        axs[0, 1].imshow(cv2.cvtColor(right, cv2.COLOR_BGR2RGB))
        axs[1, 0].imshow(cv2.cvtColor(bottom, cv2.COLOR_BGR2RGB))
        axs[1, 1].imshow(cv2.cvtColor(left, cv2.COLOR_BGR2RGB))
        axs[0, 0].set_title('top')
        axs[0, 1].set_title('right')
        axs[1, 0].set_title('bottom')
        axs[1, 1].set_title('left')
        plt.show()

    # Check what the choosen objective function is for the minimization solver 
    if method == 'gamma':
        obj_f = gammaCorrection
    else:
        print('Using gamma-correction, no other correction funcition was choosen')
        obj_f = gammaCorrection
    
    # Check what the choosen distance measument is for the minimization solver 
    if dist_meas == 'euclidean':
        dist_f = dist_euc
    elif dist_meas == 'cosine':
        dist_f = dist_cos
    elif dist_meas == 'dist_manhattan':
        dist_f = dist_manhattan
    elif dist_meas == 'dist_weigtEuc':
        dist_f = dist_weigtEuc
    elif dist_meas == 'Lab':
        dist_f = dist_Lab
    else:
        print('Using Euclidean distance, no other distance measurement was choosen')
        dist_f = dist_euc
    
    # "Minimization solver" - finds the minimum of the object function == the best color correction according to chosen obj_f and dist_meas
    sampleMean = np.array(sampleMean,np.uint8) #Make into same format as image
    
    # OBS - bara för gamma so far
    res = minimize_scalar(dist_f, args = (sampleMean, obj_f), bounds=(0.01, 10), method='bounded')
    gamma = res.x
    print(f'True blue: {trueBlue.T}')
    print(f'Sampled blue: {sampleMean}')
    print(f'Corrected blue: {gammaCorrection(sampleMean,gamma).T}')
    print(f'Gamma: {gamma}')
    
    correctedImg = gammaCorrection(img, gamma)
    originalImg = img
    
    return (correctedImg, originalImg, gamma)



# Gamma correection on the input rgb/bgr image. using look up table  (=LUT) that map old values to new
# Note that the format on img must be uint8.
def gammaCorrection(img, gamma):
    invGamma = 1 / gamma

    table = [((i / 255) ** invGamma) * 255 for i in range(256)]
    table = np.array(table, np.uint8)
    return cv2.LUT(img, table)


# Different distance measures, taking mean as the sample mean. X is the variable to miimize, e.g. for gamma correction x = gamma
# Euclidean dist
def dist_euc(x, mean, obj_f):
    meanCorr = obj_f(mean,x)
    #print(f'Old: {mean}, new: {meanCorr.T}')
    return (np.linalg.norm(trueBlue-meanCorr))

# Cosine dist
from numpy.linalg import norm
def dist_cos(x, mean, obj_f):
    meanCorr = obj_f(mean,x)
    #print(f'Old: {mean}, new: {meanCorr.T}')
    return np.dot(meanCorr.T,trueBlue)/(norm(meanCorr)*norm(trueBlue))

# Manhattan/cityblock dist
from scipy.spatial.distance import cityblock
def dist_manhattan(x, mean, obj_f):
    meanCorr = obj_f(mean,x,)
    #print(f'Old: {mean}, new: {meanCorr.T}')
    return cityblock(meanCorr,trueBlue)

# "Weighted" version of Euclidean distance in accordance with https://www.compuphase.com/cmetric.htm
# Assumes BGR
def dist_weigtEuc(x, mean, obj_f):
    meanCorr = obj_f(mean,x)
    #print(f'Old: {mean}, new: {meanCorr.T}')
    rmean = meanCorr[2] + trueBlue[2] / 2
    dif = meanCorr-trueBlue
    return np.sqrt((2+rmean/256)*dif[2]*dif[2] + 4*dif[1]*dif[1]+(2+(255-rmean)/256)*dif[0]*dif[0])


def dist_Lab(x, mean, obj_f):
    meanCorr = obj_f(mean,x)
    trueBlueInt = trueBlue.T[np.newaxis, :]
    trueBlueInt = trueBlueInt.astype(int)
    labCorr = cv2.cvtColor(meanCorr.T[np.newaxis, :], cv2.COLOR_BGR2LAB)
    labBlue = [51.44914956808836, 27.486827560056494, 51.712956530084554]    
    delta_E = colour.delta_E(labCorr, labBlue)
    return delta_E