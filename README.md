# ReindeerLichens

Project repository for project "Determine reindeer lichen coverage with image segmentation and machine learning" which have been conducted in the course in Scientific Computing (1TD316).

## Image labeling
To start the data labeling system, do one of the following:

1. Start the entire system with [start_system.sh](https://github.com/DanielHjelm/ReindeerLichens/blob/main/start_system.sh)
    ```bash
    $ ./start_system.sh
    ```
2. Start each component of the system individually:
    ```bash
    cd images_api && npm run dev 

    cd web_server && npm run dev

    cd machine_learning && python3 prediction_server.py 

    cd region_growing && go run main.go 
    ```