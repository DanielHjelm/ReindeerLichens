package cellulargrowth

import (
	"fmt"
	"math"
	"sync"

	utils "github.com/DanielHjelm/ReindeerLichens/utils"
)

func CellularGrowth(img [][][]uint8, initial_values []map[string]int) {

	labels := utils.CreateArrayInt(len(img), len(img[0]))

	fmt.Printf("Starting cellular growth on image with size %dx%d\n", len(img), len(img[0]))

	for i := 0; i < len(initial_values); i++ {
		x := initial_values[i]["x"]
		y := initial_values[i]["y"]
		labels[y][x] = 1
	}

	utils.SaveMask(labels, "initial_mask.jpg")

	labels_next := utils.CreateArrayInt(len(img), len(img[0]))

	assigned := 0
	done := false
	skipEven := false
	iteration := 0
	yDim := len(img)
	xDim := len(img[0])

	for !done {
		wg := new(sync.WaitGroup)
		assigned = 0
		done = true

		for y := 0; y < yDim; y++ {
			if (y%2 == 0 && skipEven) || (y%2 != 0 && !skipEven) {
				continue
			}
			wg.Add(1)
			go func(y int) {
				defer wg.Done()

				for x := 0; x < xDim; x++ {

					if (x%2 == 0 && skipEven) || (x%2 != 0 && !skipEven) {
						continue
					}

					assigned += assignBasedOnLocalMeanNorm(img, labels, labels_next, y, x)

				}
			}(y)

		}

		if (iteration % 20) == 0 {
			go func() {
				SaveState(img, labels_next, initial_values)
				utils.SaveMask(labels_next, "grow_cut_mask.jpg")

			}()
		}

		wg.Wait()
		iteration++

		if assigned > 0 {
			fmt.Printf("Assigned %d pixels on iteration %d\n", assigned, iteration)
			done = false

		} else {
			fmt.Printf("Stopped on iteration %d\n", iteration)
		}

		labels = utils.CopyArrayInt(labels_next)
		skipEven = !skipEven
	}

	SaveState(img, labels_next, initial_values)
	utils.SaveMask(labels_next, "grow_cut_mask.jpg")

}

func SaveState(img [][][]uint8, labels [][]int, initial_values []map[string]int) {
	mask := utils.CopyArrayInt(labels)

	for i := 0; i < len(initial_values); i++ {
		x := initial_values[i]["x"]
		y := initial_values[i]["y"]
		mask[y][x] = -1

	}

	// err := saveImage("grow_cut.jpg", arrayToImage(_saveImg))
	err := utils.SaveMaskOnTopOfImage(img, mask, "grow_cut.jpg")
	if err != nil {
		panic(err)

	}
}

func assignBasedOnLocalMeanNorm(img [][][]uint8, labels, labels_next [][]int, y int, x int) int {
	//fmt.Printf("Running assignBasedOnLocalMeanNorm on row %d, col %d\n", row, col)

	if labels[y][x] != 0 {
		return 0
	}
	done := false
	found := 0
	values := []float64{}
	start := -1
	limit := -4
	threshold := 0.1

	for !done {
		if start < limit {
			done = true
		}
		for i := start; i <= start*-1; i++ {
			for j := start; j <= start*-1; j++ {
				if y+i >= 0 && y+i < len(labels) && x+j >= 0 && x+j < len(labels[0]) {
					if labels[y+i][x+j] == 1 {
						r, g, b := img[y+i][x+j][0], img[y+i][x+j][1], img[y+i][x+j][2]
						values = append(values, utils.L2(r, g, b))
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
	r, g, b := img[y][x][0], img[y][x][1], img[y][x][2]
	if norm := utils.L2(r, g, b); (math.Abs(norm-mean))/mean <= threshold {

		labels_next[y][x] = 1

		return 1
	}

	return 0
}
