import requests
import base64
import io
from matplotlib import pyplot as plt
import matplotlib.image as mpimg
import os
import time
from multiprocessing import cpu_count
from multiprocessing.pool import ThreadPool
from datetime import datetime, timedelta


def downloadFileFromDB(args):

    '''Download file from database'''

    # Time
    t0 = time.time()

    # Fetch url and file_location from input
    url, file_location = args[0], args[1]

    # Fetch filename from url
    filename = url.rsplit('/', 1)[-1]

    # File type
    file_type = filename.split(".")[1]

    try: 
        # Get image from server
        image = requests.get(url = url)

        # Decode image
        image_decoded = base64.b64decode(image.content)

        # Convert to image
        image_converted = io.BytesIO(image_decoded)

        # Save image
        image = mpimg.imread(image_converted, format=f'{file_type}')
        plt.imsave(file_location, image)
        return (url, time.time() - t0)
        # print(f"Time to download and save {filename}:", time.time() - t0)
        
    except Exception as e:
        print("Exception when downloading image: ", e)
        return ("", time.time() - t0)


def dowload_parallel(inputs):

    '''Download images in parallel'''

    # Start time
    start_time = time.time()

    # Number of threads
    cpus = cpu_count()

    # Use ThreadPool to download images in parallel
    results = ThreadPool(cpus - 1).imap_unordered(downloadFileFromDB, inputs)

    for result in results:
        print('url:', result[0], 'Time to download (s):', result[1])

    # End time
    print("Total time:", time.time() - start_time)


def createFolders(outputFolders=["downloaded_images"]):

    '''Create folders for downloaded images'''

    for folder in outputFolders:
        if not os.path.exists(folder):
            os.makedirs(folder)

def downloadFromDB(request_url, outputFolder, onlyLast24Hour=False):

    '''Download images from database'''

    # Create folder for downloaded images
    createFolders([outputFolder])

    # Fetch which images is in database
    filenames = requests.get(url = request_url)

    # Create list of inputs for parallel download
    urls = []
    file_locations = []
    for file in filenames.json()["images"]:

        # Check if the file was uploaded to database in the last 24 hours
        if onlyLast24Hour and file["uploadDate"] < (datetime.now() - timedelta(hours = 24)).isoformat():
            continue

        # Append url for image to list
        urls.append(request_url+'/'+file["filename"])
        
        # Create folders for images and add there location to file_locations
        if file["filename"].rsplit('_', 1)[-1].split(".")[0] == "mask":
            createFolders([outputFolder + "/" + file["filename"].rsplit('_', 1)[-2]])
            file_locations.append(outputFolder + "/" + file["filename"].rsplit('_', 1)[-2]+"/"+file["filename"])
        else:
            createFolders([outputFolder + "/" + file["filename"].split(".")[0]])
            file_locations.append(outputFolder + "/" + file["filename"].split(".")[0]+"/"+file["filename"])

    # Create inputs for parallel download
    inputs = zip(urls, file_locations)

    # Download images in parallell
    dowload_parallel(inputs)




if __name__ == "__main__":

    # Url to the API
    request_url = "https://a916-130-243-234-224.eu.ngrok.io/images"

    outputFolder = "downloaded_images"

    # Download images from database
    downloadFromDB(request_url, outputFolder, onlyLast24Hour=False)
    
    # createFolders([outputFolder])

    #     # Get filenames from server
    # filenames = requests.get(url = filenames_URL)


    # # print(filenames.json()["images"])

    # urls = []
    # file_locations = []
    # for file in filenames.json()["images"]:
    #     urls.append(filenames_URL+'/'+file["filename"])
        
    #     if file["filename"].rsplit('_', 1)[-1].split(".")[0] == "mask":
    #         createFolders([outputFolder + "/" + file["filename"].rsplit('_', 1)[-2]])
    #         file_locations.append(outputFolder + "/" + file["filename"].rsplit('_', 1)[-2]+"/"+file["filename"])
    #     else:
    #         createFolders([outputFolder + "/" + file["filename"].split(".")[0]])
    #         file_locations.append(outputFolder + "/" + file["filename"].split(".")[0]+"/"+file["filename"])


    # inputs = zip(urls, file_locations)

    # dowload_parallel(inputs)

    # start_time = time.time()
    # cpus = cpu_count()
    # results = ThreadPool(cpus - 1).imap_unordered(downloadFromDB, inputs)

    # for result in results:
    #     print('url:', result[0], 'time (s):', result[1])



    # # t0 = time.time()

    # # Loop through filenames and download images
    # for file in filenames.json()["images"]:

    #     downloadFromDB(file)



    # print("Total time:", time.time() - start_time)
    
   


# print(os.path.splitext(file["filename"])[0])


# file = requests.get(url = filenames_URL+'/'+file["filename"])

# # print(file.content)

# i = base64.b64decode(file.content)
# i = io.BytesIO(i)
# i = mpimg.imread(i, format='JPG')
# mpimg.imsave('downloaded_images/{f}', i)

# plt.imshow(i, interpolation='nearest')
# plt.show()