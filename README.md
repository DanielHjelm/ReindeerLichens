# Determine reindeer lichen coverage with image segmentation and machine learning

Project repository for project "Determine reindeer lichen coverage with image segmentation and machine learning" which have been conducted in the course in Scientific Computing (1TD316).

## Image labeling
To start the data labeling system, do one of the following:

1. Start the entire system with [start_system.sh](https://github.com/DanielHjelm/ReindeerLichens/blob/main/start_system.sh):
    ```bash
    $ ./start_system.sh
    ```
2. Start each component of the system individually:
    ```bash
    cd images_api && npm ci && npm run dev &\

    cd web_server && npm ci && npm run dev & \

    cd machine_learning && python3 prediction_server.py 

    cd region_growing && go run main.go 
    ```

## Upload and download images to/from database

Upload and download images from the database [upload_to_db.py](https://github.com/DanielHjelm/ReindeerLichens/blob/main/upload_to_db.py) and [download_from_db.py](https://github.com/DanielHjelm/ReindeerLichens/blob/main/download_from_db.py)

