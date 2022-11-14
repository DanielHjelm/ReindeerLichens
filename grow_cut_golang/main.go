package main

import (
	"fmt"
	"image"
	"image/color"
	"image/jpeg"
	"math"
	"sync"

	"os"
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

func grow_cut(img image.Image) {

	labels := createArrayInt(img.Bounds().Max.X, img.Bounds().Max.Y)
	strength := createArray(img.Bounds().Max.X, img.Bounds().Max.Y)
	labels[img.Bounds().Dx()/2][img.Bounds().Dy()/2] = 1
	strength[img.Bounds().Dx()/2][img.Bounds().Dy()/2] = 1

	strength[0][0] = 1
	labels[0][0] = -1

	strength[img.Bounds().Dx()-1][img.Bounds().Dy()-1] = 1
	labels[img.Bounds().Dx()-1][img.Bounds().Dy()-1] = -1

	c_max := getImageMaxNorm(img)
	labels_i := copyArrayInt(labels)
	strength_i := copyArrayFloat(strength)

	found := true
	count := 0
	for found {
		found = false
		wg := new(sync.WaitGroup)
		wg.Add(img.Bounds().Dx())
		for x := img.Bounds().Min.X; x < img.Bounds().Max.X; x++ {
			go func(x int) {
				defer wg.Done()
				for y := img.Bounds().Min.Y; y < img.Bounds().Max.Y; y++ {
					r, g, b, _ := img.At(x, y).RGBA()
					r, g, b = r/257, g/257, b/257
					for i := -1; i < 2; i++ {
						for j := -1; j < 2; j++ {
							// fmt.Printf("x: %d, y: %d, i: %d, j: %d", x, y, i, j)
							if i == 0 && j == 0 || x+i < 0 || y+j < 0 || x+i >= img.Bounds().Max.X || y+j >= img.Bounds().Max.Y {
								continue
							}
							if labels[x+i][y+j] == labels[x][y] && strength[x+i][y+j] == 0 && strength[x][y] == 0 {
								continue
							}
							// fmt.Printf("i: %d, j: %d\n", i, j)

							neighbor_r, neighbor_g, neighbor_b, _ := img.At(x+i, y+j).RGBA()
							neighbor_r, neighbor_g, neighbor_b = neighbor_r/257, neighbor_g/257, neighbor_b/257
							// fmt.Printf("Neighbor: %d, %d, %d", neighbor_r, neighbor_g, neighbor_b)
							norm := l2(r-neighbor_r, g-neighbor_g, b-neighbor_b)
							t := g_function(norm, c_max) * strength_i[x+i][y+j]
							// fmt.Printf("t: %f\n", t)
							if t > .5 && t > strength[x][y] {
								strength_i[x][y] = t
								labels_i[x][y] = labels[x+i][y+j]
								found = true
								// fmt.Printf("Updated value\n")
							}
						}

					}

				}
			}(x)
		}
		wg.Wait()

		labels = copyArrayInt(labels_i)
		strength = copyArrayFloat(strength_i)

		// fmt.Print("insert y value here: ")
		// input := bufio.NewScanner(os.Stdin)
		// input.Scan()
		count++

		if (count % 10) == 0 {
			err := saveImage("grow_cut.jpg", arrayToImage(labels))
			// fmt.Printf("Labels: %v", labels)
			if err != nil {
				panic(err)

			}
			fmt.Printf("Count: %d\n", count)

		}

	}

	// make labels into an image

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

func main() {

	// image, err := openImage("../maxresdefault-52050755.jpeg")
	image, err := openImage("../images/IMG_0162.JPG")
	if err != nil {
		panic(err)
	}

	grow_cut(image)

}
