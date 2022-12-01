import numpy as np

def jaccard_binary(x,y):
    '''Returns the Jaccard coefficient between two binary and equally sized matrices'''
    #x = np.flatten(x)
    #y = np.flatten(y)
    intersect = np.logical_and(x, y)
    union = np.logical_or(x, y)
    coefficient = np.sum(intersect) / np.sum(union)
    return coefficient

def simple_match(x,y):
    '''Returns the Simple matching coefficient between two binary and equally sized matrices'''
    all_matches = np.logical_and(x, y) + np.logical_and(np.logical_not(x), np.logical_not(y))
    total_elements = np.prod(np.shape(x))
    coefficient = np.sum(all_matches) / np.sum(total_elements)
    return coefficient
    