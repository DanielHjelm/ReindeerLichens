package main

import (
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	"log"
	"math"
	"net/http"
	"sync"

	cellulargrowth "github.com/DanielHjelm/ReindeerLichens/cellularGrowth"
	utils "github.com/DanielHjelm/ReindeerLichens/utils"
)

func g_function(x, c_max float64) float64 {
	return 1 - x/c_max
}

func ImageMeanNorm(img image.Image) {
	panic("unimplemented")
}

func assignBasedOnLocalMeanNorm(img image.Image, labels, labels_next [][]int, x, y int) int {
	if labels[x][y] != 0 {
		return 0
	}
	done := false
	found := 0
	values := []float64{}
	start := -1
	limit := -4
	threshold := .1

	for !done {
		if start < limit {
			done = true
		}
		for i := start; i <= start*-1; i++ {
			for j := start; j <= start*-1; j++ {
				if x+i >= 0 && x+i < len(labels) && y+j >= 0 && y+j < len(labels[0]) {
					if labels[x+i][y+j] == 1 {
						r, g, b, _ := img.At(x+i, y+j).RGBA()
						r, g, b = r/257, g/257, b/257
						values = append(values, utils.L2(int(r), int(g), int(b)))
						found++
					}
				}
			}
		}
		if found != 0 {
			start--
			found = 0
		} else {
			done = true
		}
	}
	// fmt.Printf("Done checking local norm")

	if len(values) == 0 {
		return 0
	}

	var sum float64 = 0
	for _, v := range values {
		sum += v
	}
	mean := sum / float64(len(values))

	// This pixel rgb
	r, g, b, _ := img.At(x, y).RGBA()
	r, g, b = r/257, g/257, b/257

	// if norm := l2(r, g, b); norm > mean {
	// 	if (norm-mean)/mean <= threshold {
	// 		labels_next[x][y] = 1
	// 		return 1
	// 	}
	// } else {
	// 	if (mean-norm)/mean <= threshold {
	// 		labels_next[x][y] = 1
	// 		return 1
	// 	}
	// }
	if norm := utils.L2(int(r), int(g), int(b)); (math.Abs(norm-mean))/mean <= threshold {
		labels_next[x][y] = 1
		return 1
	}
	return 0
}

func grow_cut(img image.Image, initial_values []map[string]int) {
	log.Printf("Starting grow cut")
	labels := utils.CreateArrayInt(img.Bounds().Max.X, img.Bounds().Max.Y)
	strength := utils.CreateArray(img.Bounds().Max.X, img.Bounds().Max.Y)

	for i := 0; i < len(initial_values); i++ {
		x := initial_values[i]["x"]
		y := initial_values[i]["y"]
		labels[x][y] = 1
		strength[x][y] = 1

	}

	// c_max := getImageMaxNorm(img)
	labels_next := utils.CopyArrayInt(labels)
	strength_i := utils.CopyArrayFloat(strength)

	found := true
	count := 0
	skipEvenX := true

	for found {
		found = false
		wg := new(sync.WaitGroup)
		assigned := 0

		for x := img.Bounds().Min.X; x < img.Bounds().Max.X; x += 1 {
			wg.Add(1)
			if x%2 == 0 && skipEvenX {

				continue
			}
			if x%2 != 0 && !skipEvenX {

				continue
			}
			go func(x int) {

				defer wg.Done()
				for y := img.Bounds().Min.Y; y < img.Bounds().Max.Y; y += 1 {
					if y%2 == 0 && skipEvenX {

						continue
					}
					if y%2 != 0 && !skipEvenX {

						continue
					}

					assigned += assignBasedOnLocalMeanNorm(img, labels, labels_next, x, y)

					// r, g, b, _ := img.At(x, y).RGBA()
					// r, g, b = r/257, g/257, b/257
					// for i := -1; i < 2; i++ {
					// 	for j := -1; j < 2; j++ {
					// 		// fmt.Printf("x: %d, y: %d, i: %d, j: %d", x, y, i, j)
					// 		if i == 0 && j == 0 || x+i < 0 || y+j < 0 || x+i >= img.Bounds().Max.X || y+j >= img.Bounds().Max.Y {
					// 			continue
					// 		}
					// 		if labels[x+i][y+j] == labels[x][y] && strength[x+i][y+j] == 0 && strength[x][y] == 0 {
					// 			continue
					// 		}
					// 		// fmt.Printf("i: %d, j: %d\n", i, j)

					// 		neighbor_r, neighbor_g, neighbor_b, _ := img.At(x+i, y+j).RGBA()
					// 		neighbor_r, neighbor_g, neighbor_b = neighbor_r/257, neighbor_g/257, neighbor_b/257
					// 		// fmt.Printf("Neighbor: %d, %d, %d", neighbor_r, neighbor_g, neighbor_b)

					// 	}

					// }
					// var t float64
					// norm := l2(r, g, b)
					// if localNorm := assignBasedOnLocalMeanNorm(img, labels, x, y); localNorm != 0 {
					// 	t = g_function(norm, localNorm)
					// } else {

					// 	t = g_function(norm, c_max)
					// }

					// // fmt.Printf("t: %f\n", t)
					// if t > .5 {
					// 	strength_i[x][y] = t
					// 	if t > .5 {

					// 		labels_i[x][y] = 1
					// 		found = true
					// 	}
					// 	// fmt.Printf("Updated value\n")
					// }

				}
			}(x)
		}

		// fmt.Print("insert y value here: ")
		// input := bufio.NewScanner(os.Stdin)
		// input.Scan()

		if (count % 20) == 0 {
			go func() {
				mask := utils.CopyArrayInt(labels_next)

				for i := 0; i < len(initial_values); i++ {
					x := initial_values[i]["x"]
					y := initial_values[i]["y"]
					mask[x][y] = -1

				}

				// err := saveImage("grow_cut.jpg", arrayToImage(_saveImg))
				err := saveMaskOnTopOfImage(img, mask, "grow_cut.jpg")
				if err != nil {
					panic(err)

				}
				// fmt.Printf("Count: %d\n", count)

			}()
		}
		wg.Wait()
		if assigned > 0 {
			found = true

		} else {
			// fmt.Printf("Only found %d, checking further out \n", assigned)
			// newFound := checkNeighbors(img, labels, labels_next)
			// if newFound > 0 {
			// 	found = true
			// }
		}
		count++
		fmt.Printf("Changed %d Pixels on iteration: %d\n", assigned, count)

		skipEvenX = !skipEvenX
		labels = utils.CopyArrayInt(labels_next)
		strength = utils.CopyArrayFloat(strength_i)

	}

	// make labels into an image

	log.Printf("Done")

	for i := 0; i < len(initial_values); i++ {
		x := initial_values[i]["x"]
		y := initial_values[i]["y"]
		labels[x][y] = -1

	}

	// err := saveImage("grow_cut.jpg", arrayToImage(_saveImg))
	err := saveMaskOnTopOfImage(img, labels, "grow_cut.jpg")
	if err != nil {
		panic(err)

	}

}

func saveMaskOnTopOfImage(img image.Image, mask [][]int, filename string) error {

	_img := image.NewRGBA(image.Rect(0, 0, len(mask), len(mask[0])))
	for x := 0; x < len(mask); x++ {
		for y := 0; y < len(mask[0]); y++ {
			r, g, b, _ := img.At(x, y).RGBA()
			r, g, b = r/257, g/257, b/257
			if mask[x][y] == 1 {

				_img.Set(x, y, color.RGBA{uint8(float64(148)*.4 + float64(r)*.6), uint8(float64(g) * .6), uint8(math.Round(float64(211) * .6)), 155})
			} else if mask[x][y] == -1 {
				_img.Set(x, y, color.RGBA{255, 0, 0, 255})
			} else {

				_img.Set(x, y, color.RGBA{uint8(r), uint8(g), uint8(b), 255})
			}

		}
	}

	err := utils.SaveImage(filename, _img)

	return err
}

func start(img image.Image) {

}

func main() {

	// image, err := openImage("../maxresdefault-52050755.jpeg")
	// // image, err := openImage("../images/IMG_0162.JPG")
	// if err != nil {
	// 	panic(err)
	// }

	// grow_cut(image)

	// http.HandleFunc("/images/", http.StripPrefix("/images/", http.FileServer(http.Dir("../images"))))
	// http.Handle("/", http.FileServer(http.Dir("./static")))

	// // Serve api /hi
	// http.HandleFunc("/hi", func(w http.ResponseWriter, r *http.Request) {
	// 	fmt.Fprintf(w, "Hi")
	// })
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
		// imageArray := utils.ImageToArray(_image)
		// fmt.Printf("Image: %v", imageArray)
		// return
		// utils.SaveImage("original.jpg", utils.ArrayToImage(_image))
		cellulargrowth.CellularGrowth(_image, r_body.Pixels)
		fmt.Printf("Done Cellular Growth\n")

		// busy = true
		// grow_cut(_image, r_body.Pixels)
		// busy = false

	})

	port := ":3001"
	fmt.Println("Server is running on port" + port)

	// Start server on port specified above
	log.Fatal(http.ListenAndServe(port, nil))

}
