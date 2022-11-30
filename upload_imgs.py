
import os
import sys
import threading
import requests
from dotenv import load_dotenv
import magic


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

    success = load_dotenv("grow_cut_golang/web_server/.env.local")
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
    print(existingFiles)
    existingFiles = [f["filename"] for f in existingFiles]
    print(existingFiles)

    if os.path.isfile(path):
        if os.path.basename(path) not in existingFiles:
            uploadFile(path)
        else:
            print(f"Skipping {path} because it already exists")
    else:
        # threads = []

        for file in os.listdir(path):
            if file in existingFiles:
                print(f"Skipping {file} because it already exists")
                continue

            # thread = threading.Thread(
            #     target=uploadFile, args=(os.path.join(path, file),))

            # thread.start()
            # threads.append(thread)
            uploadFile(os.path.join(path, file))

        # for thread in threads:
        #     thread.join()
