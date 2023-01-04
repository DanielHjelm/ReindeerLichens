(
    trap 'kill 0' SIGINT

    cd images_api && npm run dev &

    cd machine_learning && python3 prediction_server.py &

    cd region_growing && go run main.go &

    cd web_server && npm run dev &

    wait
)
