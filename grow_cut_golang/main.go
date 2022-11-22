package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	cellulargrowth "github.com/DanielHjelm/ReindeerLichens/cellularGrowth"
	utils "github.com/DanielHjelm/ReindeerLichens/utils"
)

func main() {

	type RequestBody struct {
		ImageName string           `json:"imageName"`
		Pixels    []map[string]int `json:"pixels"`
	}

	busy := false
	http.HandleFunc("/start", func(w http.ResponseWriter, r *http.Request) {

		if busy {
			json.NewEncoder(w).Encode("busy")
			return
		}
		busy = true

		// fmt.Printf("Request: %v", r)

		r_body := RequestBody{}
		err := json.NewDecoder(r.Body).Decode(&r_body)
		if err != nil {
			// Print error
			fmt.Printf("%v", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		_image, err := utils.ReadImageAsArray("../images/" + r_body.ImageName)
		if err != nil {
			fmt.Printf("Error opening image: %v", err)
			panic(err)
		}

		cellulargrowth.CellularGrowth(_image, r_body.Pixels)
		fmt.Printf("Done Cellular Growth\n")
		busy = false

	})

	port := ":3001"
	fmt.Println("Server is running on port" + port)

	// Start server on port specified above
	log.Fatal(http.ListenAndServe(port, nil))

}
