package main

import (
	"encoding/json"
	"time"

	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/joho/godotenv"

	cellulargrowth "github.com/DanielHjelm/ReindeerLichens/cellularGrowth"
	utils "github.com/DanielHjelm/ReindeerLichens/utils"
)

type Job struct {
	FileName     string
	InitialState []map[string]int
	ImageData    [][][]uint8
}

func handleCellularGrowth(pipeline *[]Job) {

	for true {
		if len(*pipeline) > 0 {
			job := (*pipeline)[0]
			*pipeline = (*pipeline)[1:]
			mask := cellulargrowth.CellularGrowth(job.ImageData, job.InitialState, false)
			fmt.Printf("Cellular growth completed\n")
			fileType := strings.Split(job.FileName, ".")[1]
			maskName := strings.Split(job.FileName, ".")[0] + "_mask" + "." + fileType
			utils.SaveMask(mask, "result/"+maskName)
			fmt.Printf("Mask saved\n")
			utils.SaveResultToDb("result/" + maskName)
			fmt.Printf("Mask saved to mongo\n")
		}
		time.Sleep(2 * time.Second)

	}
}

func main() {

	var pipeline []Job

	err := godotenv.Load("web_server/.env.local")
	if err != nil {
		log.Fatalf("Some error occured. Err: %s", err)
	}
	if os.Getenv("NEXT_PUBLIC_IMAGES_API_HOST") == "" {
		log.Fatalf("NEXT_PUBLIC_IMAGES_API_HOST not set")
	}

	fmt.Printf("Images will be sent to %v\n", os.Getenv("NEXT_PUBLIC_IMAGES_API_HOST"))
	_, err = os.Stat("result")
	if os.IsNotExist(err) {
		os.Mkdir("result", 0755)
	}
	_, err = os.Stat("images")
	if os.IsNotExist(err) {
		os.Mkdir("images", 0755)
	}

	type RequestBody struct {
		Pixels   []map[string]int `json:"pixels"`
		FileName string           `json:"fileName"`
		Img      string           `json:"img"`
	}
	go handleCellularGrowth(&pipeline)

	http.HandleFunc("/start", func(w http.ResponseWriter, r *http.Request) {

		// fmt.Printf("Request: %v", r)

		r_body := RequestBody{}
		err := json.NewDecoder(r.Body).Decode(&r_body)
		if err != nil {
			// Print error
			fmt.Printf("%v", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		img, err := utils.Base64ToArrayImage(r_body.Img)
		if err != nil {
			// Print error
			fmt.Printf("%v\n", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		job := Job{
			FileName:     r_body.FileName,
			InitialState: r_body.Pixels,
			ImageData:    img,
		}
		fmt.Printf("Job added to pipeline\n")
		pipeline = append(pipeline, job)

		// _image, err := utils.ReadImageAsArray("../images/" + r_body.ImageName)
		// if err != nil {
		// 	fmt.Printf("Error opening image: %v", err)
		// 	panic(err)
		// }

		// mask := cellulargrowth.CellularGrowth(img, r_body.Pixels, false)
		// fmt.Printf("Cellular growth completed\n")
		// fileType := strings.Split(r_body.FileName, ".")[1]
		// maskName := strings.Split(r_body.FileName, ".")[0] + "_mask" + "." + fileType
		// utils.SaveMask(mask, "result/"+maskName)

		// Save image locally
		// if _, err := os.Stat("images/" + r_body.FileName); err != nil {

		// }

	})

	port := ":3001"
	fmt.Println("Server is running on port" + port)

	// Start server on port specified above
	log.Fatal(http.ListenAndServe(port, nil))

}
