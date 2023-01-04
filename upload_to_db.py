
import os
import sys
import time
import threading
import requests
from dotenv import load_dotenv
import magic
import shutil
import cv2
import remove_frame.removeFrame as removeFrame


def uploadFile(path: str):
    try:

        with open(path, 'rb') as f:
            fileType = magic.from_file(path, mime=True)

            file = {
                'file': (f.name, f, fileType),
                # "file": f,

            }
            host = os.getenv("NEXT_PUBLIC_IMAGES_API_HOST")
            print(f"Uploading {path} to {host}")
            with requests.Session() as s:
                r = s.post(f"http://{host}/images", files=file)
                if r.status_code != 200:
                    print(f"Error uploading {path} to {host}")
                    print(r.text)

                else:
                    print(f"Uploaded {path} to {host}")

            # response = requests.post(
            #     f"http://{host}/images", files=[file])
            # if (response.status_code == 200):
            #     print(f"Success Uploading image {os.path.basename(path)}")

            # else:
            #     print(f"Error Uploading image {os.path.basename(path)}")
            #     print(response.text)
    except:
        print(f"Error Uploading image {os.path.basename(path)}")
        print(sys.exc_info()[0])


if __name__ == "__main__":

    success = load_dotenv("web_server/.env.local")
    if not success:
        print("Error loading env variables")
        sys.exit(1)

    if len(sys.argv) < 2:
        print("USAGE: python3 upload_images.py <path_to_images_or_directory>")
        sys.exit(1)

    path = sys.argv[1]
    if (not path):
        print("No path specified")
        sys.exit(1)

    if not os.path.exists(path):
        print("Path does not exist")
        sys.exit(1)


    host = os.getenv("NEXT_PUBLIC_IMAGES_API_HOST")

    existingFiles = requests.get(f"http://{host}/images").json()["images"]
    existingFiles = [f["filename"] for f in existingFiles]

    removeFrames = input("Remove frames? (y/n): ").lower() == "y"
    if removeFrames:
        os.makedirs("tmp", exist_ok=True)

    if os.path.isfile(path):
        if removeFrames:
            img = removeFrame.removeFrame(path)
            if img is None:
                print(
                    f"Skipping upload of {path} since the frame could not be removed")
                os.rmdir("tmp")
                exit(0)
            # Save img to file
            path = f"tmp/{os.path.basename(path)}"
            cv2.imwrite(path, img)

        if os.path.basename(path) not in existingFiles:
            uploadFile(path)
        else:
            print(f"Skipping {path} because it already exists")

        os.remove(path)
    else:
        # threads = []

        original_path = path
        for file in os.listdir(original_path):
            path = original_path

            if file in existingFiles:
                print(f"Skipping {file} because it already exists")
                continue

            if removeFrames:
                img = removeFrame.removeFrame(f"{path}/{file}")
                if img is None:
                    print(
                        f"Skipping upload of {file} since the frame could not be removed")
                    continue
                # Save img to file
                path = "tmp"
                print(f"Saving {file} to {path}")
                cv2.imwrite(f"{path}/{file}", img)

            # thread = threading.Thread(
            #     target=uploadFile, args=(os.path.join(path, file),))

            # thread.start()
            # threads.append(thread)

            uploadFile(os.path.join(path, file))

    # Remove tmp directory
    shutil.rmtree("tmp", ignore_errors=True)

    # for thread in threads:

    #     thread.join()
