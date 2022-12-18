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
from dotenv import load_dotenv
import sys

# Load env variables
load_dotenv("grow_cut_golang/web_server/.env.local")

# Host for the API
host = os.getenv("NEXT_PUBLIC_IMAGES_API_HOST")

# Check if host is http or https
schema = "http" if ":8000" in host else "https"

# Url to the API
request_url = f"{schema}://{host}/images"


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
        image = requests.get(url=url)

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
    filenames = requests.get(url=request_url)
    print(filenames)
    # Create list of inputs for parallel download
    urls = []
    file_locations = []
    for file in filenames.json()["images"]:

        # Check if the file was uploaded to database in the last 24 hours and is starred
        if ("mask" in file["filename"]) or (file["star"] is False) or (onlyLast24Hour and file["uploadDate"] < (datetime.now() - timedelta(hours=24)).isoformat()):
            continue

        # Append url for image to list
        urls.append(request_url+'/'+file["filename"])
        urls.append(request_url+'/'+file["filename"].split(".")
                    [0]+"_mask."+file["filename"].split(".")[1])

        # Create folder for file if it does not exist
        createFolders([outputFolder + "/" + file["filename"].split(".")[0]])

        # Append file location to list
        file_locations.append(
            outputFolder + "/" + file["filename"].split(".")[0]+"/"+file["filename"])
        file_locations.append(outputFolder + "/" + file["filename"].split(".")[
                              0] + "/" + file["filename"].split(".")[0]+"_mask."+file["filename"].split(".")[1])

        # # Create folders for images and add there location to file_locations
        # if file["filename"].rsplit('_', 1)[-1].split(".")[0] == "mask":
        #     createFolders([outputFolder + "/" + file["filename"].rsplit('_', 1)[-2]])
        #     file_locations.append(outputFolder + "/" + file["filename"].rsplit('_', 1)[-2]+"/"+file["filename"])
        # else:
        #     createFolders([outputFolder + "/" + file["filename"].split(".")[0]])
        #     file_locations.append(outputFolder + "/" + file["filename"].split(".")[0]+"/"+file["filename"])

    # Create inputs for parallel download
    inputs = zip(urls, file_locations)

    # Download images in parallell
    dowload_parallel(inputs)


if __name__ == "__main__":

    if len(sys.argv) < 2:
        print("USAGE: python3 downloadFromDB.py <path_to_directory>")
        sys.exit(1)

    # Path to directory
    outputFolder = sys.argv[1]

    if (not outputFolder):
        print("No path specified")
        sys.exit(1)

    # Download images from database
    downloadFromDB(request_url, outputFolder, onlyLast24Hour=False)

    
