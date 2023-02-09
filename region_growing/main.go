package main

import (
	"encoding/json"
	"strconv"
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
	FileName          string
	InitialState      [][][]uint8
	ImageData         [][][]uint8
	AllowJumps        bool
	NeighborThreshold float64
}

func handleCellularGrowth(pipeline *[]Job) {

	for true {
		if len(*pipeline) > 0 {

			job := (*pipeline)[0]
			*pipeline = (*pipeline)[1:]
			if utils.GetInProgessStatus(job.FileName) {
				fmt.Printf("Job %v is already in progress\n", job.FileName)
				continue
			}
			if !job.AllowJumps {
				fmt.Printf("Job %v is not allowed to jump\n", job.FileName)
			}

			// utils.SendInProgessStatus(job.FileName, true)
			mask := cellulargrowth.CellularGrowth(job.ImageData, job.InitialState, true, job.AllowJumps, job.NeighborThreshold)
			fmt.Printf("Cellular growth completed\n")
			fileType := strings.Split(job.FileName, ".")[1]
			maskName := strings.Split(job.FileName, ".")[0] + "_mask" + "." + fileType
			utils.SaveMask(mask, "result/"+maskName)
			fmt.Printf("Mask saved\n")
			utils.SaveResultToDb("result/"+maskName, job.NeighborThreshold)
			utils.SendInProgessStatus(job.FileName, false)
			fmt.Printf("Mask saved to mongo\n")
		}
		time.Sleep(2 * time.Second)

	}
}

func main() {

	var pipeline []Job

	err := godotenv.Load("../web_server/.env.local")
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
		Mask              string `json:"mask"`
		FileName          string `json:"fileName"`
		Img               string `json:"img"`
		AllowJumps        bool   `json:"allowJumps"`
		NeighborThreshold string `json:"neighborThreshold"`
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

		// img, err := utils.ReadImageAsArray("temp.jpg")
		// Convert base64 to image
		initialState, err := utils.Base64ToArrayImage(r_body.Mask)
		fmt.Printf("threshold: %v\n", r_body.NeighborThreshold)

		if r_body.NeighborThreshold == "" || r_body.NeighborThreshold == "No data" {
			r_body.NeighborThreshold = "0.99" // Default threshold
		}
		var threshold float64
		if n, err := strconv.ParseFloat(r_body.NeighborThreshold, 64); err == nil {
			threshold = n
		} else {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		job := Job{
			FileName:          r_body.FileName,
			InitialState:      initialState,
			ImageData:         img,
			AllowJumps:        r_body.AllowJumps,
			NeighborThreshold: threshold,
		}
		fmt.Printf("Job added to pipeline\n")
		pipeline = append(pipeline, job)

		fmt.Fprintf(w, "Job added to pipeline")
		w.WriteHeader(http.StatusOK)
		return
	})

	port := ":3001"
	fmt.Println("Server is running on port" + port)

	// Start server on port specified above
	log.Fatal(http.ListenAndServe(port, nil))

}
