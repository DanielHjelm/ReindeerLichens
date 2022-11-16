package main

import (
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	"image/jpeg"
	"log"
	"math"
	"net/http"
	"os"
	"sync"
)

func copyArrayInt(arr [][]int) [][]int {
	new_arr := createArrayInt(len(arr), len(arr[0]))
	for x := 0; x < len(arr); x++ {
		for y := 0; y < len(arr[0]); y++ {
			new_arr[x][y] = arr[x][y]
		}
	}
	return new_arr
}

func copyArrayFloat(arr [][]float64) [][]float64 {
	new_arr := createArray(len(arr), len(arr[0]))
	for x := 0; x < len(arr); x++ {
		for y := 0; y < len(arr[0]); y++ {
			new_arr[x][y] = arr[x][y]
		}
	}
	return new_arr
}

func openImage(path string) (image.Image, error) {
	f, err := os.Open(path)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	fi, _ := f.Stat()
	fmt.Println(fi.Name())

	defer f.Close()
	img, err := jpeg.Decode(f)
	if err != nil {
		fmt.Println("Decoding error:", err.Error())
		return nil, err
	}

	return img, nil
}

func saveImage(path string, img image.Image) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	err = jpeg.Encode(f, img, nil)
	return err
}

func l2(r, g, b uint32) float64 {
	return math.Sqrt(float64(r*r + g*g + b*b))
}

func getImageMaxNorm(img image.Image) float64 {

	bounds := img.Bounds()
	var norm float64 = 0

	for x := bounds.Min.X; x < bounds.Max.X; x++ {
		for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
			r, g, b, _ := img.At(x, y).RGBA()
			r, g, b = r/257, g/257, b/257
			_norm := l2(r, g, b)

			if _norm > norm {
				norm = _norm
			}
		}
	}
	return norm
}

func g_function(x, c_max float64) float64 {
	return 1 - x/c_max
}

func createArray(sizeX, sizeY int) [][]float64 {
	a := make([][]float64, sizeX)
	for i := range a {
		a[i] = make([]float64, sizeY)
	}
	return a
}

func createArrayInt(sizeX, sizeY int) [][]int {
	a := make([][]int, sizeX)
	for i := range a {
		a[i] = make([]int, sizeY)
	}

	return a
}

func assignBasedOnLocalMeanNorm(image image.Image, labels [][]int, x, y int) int {
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
						r, g, b, _ := image.At(x+i, y+j).RGBA()
						r, g, b = r/257, g/257, b/257
						values = append(values, l2(r, g, b))
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
	r, g, b, _ := image.At(x, y).RGBA()
	r, g, b = r/257, g/257, b/257
	if norm := l2(r, g, b); (math.Abs(norm-mean))/mean < threshold {
		labels[x][y] = 1
		return 1
	}
	return 0
}

func grow_cut(img image.Image, initial_values []map[string]int) {
	log.Printf("Starting grow cut")
	labels := createArrayInt(img.Bounds().Max.X, img.Bounds().Max.Y)
	strength := createArray(img.Bounds().Max.X, img.Bounds().Max.Y)

	for i := 0; i < len(initial_values); i++ {
		x := initial_values[i]["x"]
		y := initial_values[i]["y"]
		labels[x][y] = 1
		strength[x][y] = 1

	}

	// c_max := getImageMaxNorm(img)
	labels_i := copyArrayInt(labels)
	strength_i := copyArrayFloat(strength)

	found := true
	count := 0
	skipEvenX := false

	for found {
		found = false
		wg := new(sync.WaitGroup)
		wg.Add(img.Bounds().Dx() / 2)
		assigned := 0

		for x := img.Bounds().Min.X; x < img.Bounds().Max.X; x += 1 {
			if x%2 == 0 && skipEvenX {

				continue
			}
			if x%2 != 0 && !skipEvenX {

				continue
			}
			go func(x int) {
				defer wg.Done()
				for y := img.Bounds().Min.Y; y < img.Bounds().Max.Y; y += 1 {

					assigned += assignBasedOnLocalMeanNorm(img, labels_i, x, y)

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
		wg.Wait()
		if assigned > 0 {
			found = true

		}

		// fmt.Print("insert y value here: ")
		// input := bufio.NewScanner(os.Stdin)
		// input.Scan()
		count++
		fmt.Printf("Iteration: %d\n", count)

		if (count % 10) == 0 {
			mask := copyArrayInt(labels_i)

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

		}

		skipEvenX = !skipEvenX
		labels = copyArrayInt(labels_i)
		strength = copyArrayFloat(strength_i)

	}

	// make labels into an image

	log.Printf("Done")

}

func arrayToImage(arr [][]int) image.Image {
	// create an image
	img := image.NewRGBA(image.Rect(0, 0, len(arr), len(arr[0])))
	for x := 0; x < len(arr); x++ {
		for y := 0; y < len(arr[0]); y++ {
			if arr[x][y] == 1 {
				img.Set(x, y, color.RGBA{255, 255, 255, 255})
			} else if arr[x][y] == -1 {
				img.Set(x, y, color.RGBA{255, 0, 0, 255})
			} else {
				img.Set(x, y, color.RGBA{0, 0, 0, 255})
			}

		}
	}
	return img

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

	err := saveImage(filename, _img)

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
		fmt.Printf("Success parsing")

		// fmt.Printf("Pixels: %v\n", r_body.Pixels)
		// fmt.Fprintf(w, "OK: %+v\n", r_body)

		_image, err := openImage("../images/" + r_body.ImageName)
		if err != nil {
			fmt.Printf("Error opening image: %v", err)
			panic(err)
		}

		busy = true
		grow_cut(_image, r_body.Pixels)
		busy = false

	})

	port := ":3001"
	fmt.Println("Server is running on port" + port)

	// Start server on port specified above
	log.Fatal(http.ListenAndServe(port, nil))

}
