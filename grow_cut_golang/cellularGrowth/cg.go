package cellulargrowth

import (
	"fmt"
	"runtime"
	"sync"
	"time"

	utils "github.com/DanielHjelm/ReindeerLichens/utils"
)

func CellularGrowth(img [][][]uint8, initial_values []map[string]int, shouldSaveState bool) [][]int {

	numProcs := runtime.NumCPU()
	saveEveryNIterations := 40
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
	imageCount := 0
	iteration := 0
	yDim := len(img)
	xDim := len(img[0])

	start := time.Now()

	for !done {
		wg := new(sync.WaitGroup)
		assigned = 0
		done = true

		for proc := 0; proc < numProcs; proc++ {
			wg.Add(1)
			go func(proc int) {
				defer wg.Done()
				for y := proc * yDim / numProcs; y < (proc+1)*yDim/numProcs; y++ {
					for x := 0; x < xDim; x++ {

						// if (x%2 == 0 && skipEven) || (x%2 != 0 && !skipEven) {
						// 	continue
						// }

						assigned += assignBasedOnLocalMeanNorm(img, labels, labels_next, y, x)

					}
				}

			}(proc)
		}

		if shouldSaveState && (iteration%saveEveryNIterations) == 0 {
			fmt.Printf("Saving Image\n")
			go func() {
				// SaveState(img, labels_next, initial_values, fmt.Sprintf("result/cellular_growth_%d.jpg", imageCount))
				// utils.SaveMask(labels_next, fmt.Sprintf("result/grow_cut_mask%d.jpg", imageCount))
				// SaveState(img, labels_next, initial_values, fmt.Sprintf("result/cellular_growth.jpg"))
				// utils.SaveMask(labels_next, fmt.Sprintf("result/grow_cut_mask.jpg"))
				imageCount++

			}()
		}

		iteration++
		wg.Wait()

		if assigned > 200 {
			fmt.Printf("Assigned %d pixels on iteration %d\n", assigned, iteration)
			done = false

		} else {
			if distantNeighbors := FillInDistantNeighbors(img, labels_next); distantNeighbors > 0 {
				fmt.Printf("Restarting growth, %d distant neighbors found\n", distantNeighbors)
				done = false
			} else {

				fmt.Printf("Stopped on iteration %d\n", iteration)
			}
		}

		labels = utils.CopyArrayInt(labels_next)
		skipEven = !skipEven
	}

	elapsed := time.Since(start)
	fmt.Printf("Cellular growth took %s to run %d iterations\n", elapsed, iteration)
	fmt.Printf("Average time per iteration: %s\n", elapsed/time.Duration(iteration))

	return labels_next

}

func SaveState(img [][][]uint8, labels [][]int, initial_values []map[string]int, filename string) {
	mask := utils.CopyArrayInt(labels)

	for i := 0; i < len(initial_values); i++ {
		x := initial_values[i]["x"]
		y := initial_values[i]["y"]
		mask[y][x] = -1

	}

	// err := saveImage("grow_cut.jpg", arrayToImage(_saveImg))
	err := utils.SaveMaskOnTopOfImage(img, mask, filename)
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
	nValues := 0
	start := -1
	limit := -4
	threshold := 0.99994
	// fmt.Printf("Checking pixel %d, %d\n", y, x)
	rMean, gMean, bMean := 0.0, 0.0, 0.0

	for !done {
		if start < limit {
			done = true
		}
		for i := start; i <= start*-1; i++ {
			for j := start; j <= start*-1; j++ {
				// fmt.Printf("Value of start: %d , i: %d, j: %d \n", start, i, j)
				if y+i >= 0 && y+i < len(labels) && x+j >= 0 && x+j < len(labels[0]) {

					if labels[y+i][x+j] == 1 {

						r, g, b := int(img[y+i][x+j][0]), int(img[y+i][x+j][1]), int(img[y+i][x+j][2])
						rMean += float64(r)
						gMean += float64(g)
						bMean += float64(b)

						found++
						nValues++

					}
				}
				// if !(i == start || i == start*-1) {
				// 	if j == start*-1 {
				// 		break
				// 	}
				// 	j = start*-1 - 1
				// }
			}
		}
		if found != 0 {
			start--
			found = 0
		} else {
			done = true
		}
	}

	if nValues == 0 {
		return 0
	}

	rMean /= float64(nValues)
	gMean /= float64(nValues)
	bMean /= float64(nValues)

	// This pixel rgb
	r, g, b := int(img[y][x][0]), int(img[y][x][1]), int(img[y][x][2])
	if similiarity := utils.Similiarity(r, g, b, int(rMean), int(gMean), int(bMean)); similiarity >= threshold {
		// fmt.Printf("Similiarity: %f\n", similiarity)

		labels_next[y][x] = 1

		return 1
	}
	// fmt.Printf("Similiarity: %f\n", utils.Similiarity(r, g, b, int(rMean), int(gMean), int(bMean)))

	return 0
}

func FillInDistantNeighbors(img [][][]uint8, labels [][]int) int {
	fmt.Printf("Running FillInDistantNeighbor\n")
	// globalMeanNorm := utils.ImageMeanNorm(img)
	threshold := 0.99994
	reach := 100
	found := 0

	wg := new(sync.WaitGroup)
	nProcs := runtime.NumCPU()
	for proc := 0; proc < nProcs; proc++ {
		wg.Add(1)
		go func(proc int) {
			defer wg.Done()
			for y := proc * len(labels) / nProcs; y < (proc+1)*len(labels)/nProcs; y++ {
				for x := 0; x < len(img[0]); x += 1 {
					if labels[y][x] == 0 {
						continue
					}
					start := -1
					limit := -3
					mRed := 0.0
					mGreen := 0.0
					mBlue := 0.0
					nValues := 0

					for start > limit {

						for i := start; i < start*-1; i++ {
							for j := start; j < start*-1; j++ {
								if y+i >= 0 && y+i < len(img) && x+j >= 0 && x+j < len(img[0]) {
									if labels[y+i][x+j] == 0 {
										continue
									}
									rn, gn, bn := img[y+i][x+j][0], img[y+i][x+j][1], img[y+i][x+j][2]
									mRed += float64(rn)
									mGreen += float64(gn)
									mBlue += float64(bn)
									nValues++
									if !(i == start || i == start*-1) && j != start*-1 {
										j = start*-1 - 1
									}
								}
							}
						}
						start--
					}

					mRed /= float64(nValues)
					mGreen /= float64(nValues)
					mBlue /= float64(nValues)

					for i := reach / 2; i < reach; i++ {

						if y-i >= 0 && labels[y-i][x] == 0 {
							rn, gn, bn := int(img[y-i][x][0]), int(img[y-i][x][1]), int(img[y-i][x][2])

							if utils.Similiarity(int(mRed), int(mGreen), int(mBlue), rn, gn, bn) >= threshold && checkNeighbors(img, x, y-i, int(mRed), int(mGreen), int(mBlue)) {
								labels[y-i][x] = 1
								found++
							}
						}
						if y+i < len(img) && labels[y+i][x] == 0 {
							rn, gn, bn := int(img[y+i][x][0]), int(img[y+i][x][1]), int(img[y+i][x][2])

							if utils.Similiarity(int(mRed), int(mGreen), int(mBlue), rn, gn, bn) >= threshold && checkNeighbors(img, x, y+i, int(mRed), int(mGreen), int(mBlue)) {
								labels[y+i][x] = 1
								found++
							}
						}
						if x-i >= 0 && labels[y][x-i] == 0 {
							rn, gn, bn := int(img[y][x-i][0]), int(img[y][x-i][1]), int(img[y][x-i][2])

							if utils.Similiarity(int(mRed), int(mGreen), int(mBlue), rn, gn, bn) >= threshold && checkNeighbors(img, x-i, y, int(mRed), int(mGreen), int(mBlue)) {
								labels[y][x-i] = 1
								found++
							}
						}
						if x+i < len(img[0]) && labels[y][x+i] == 0 {
							rn, gn, bn := int(img[y][x+i][0]), int(img[y][x+i][1]), int(img[y][x+i][2])

							if utils.Similiarity(int(mRed), int(mGreen), int(mBlue), rn, gn, bn) >= threshold && checkNeighbors(img, x+i, y, int(mRed), int(mGreen), int(mBlue)) {
								labels[y][x+i] = 1
								found++
							}
						}

					}

				}
			}
		}(proc)

	}
	// for y := 0; y < len(img); y += 1 {
	// 	wg.Add(1)
	// 	go func(y int) {
	// 		defer wg.Done()

	// 	}(y)
	// }
	wg.Wait()
	fmt.Printf("Found %d pixels\n", found)
	return found

}

func checkNeighbors(img [][][]uint8, x, y, r, g, b int) bool {
	// Calculate mean norm around this pixel
	// If mean norm is within threshold of global mean norm, then label this pixel as 1
	// Else, label this pixel as 0
	start := -1
	limit := -10
	mRed := 0.0
	mGreen := 0.0
	mBlue := 0.0
	nValues := 0
	threshold := 0.99999

	for start > limit {

		for i := start; i < start*-1; i++ {
			for j := start; j < start*-1; j++ {
				if y+i >= 0 && y+i < len(img) && x+j >= 0 && x+j < len(img[0]) {

					rn, gn, bn := img[y+i][x+j][0], img[y+i][x+j][1], img[y+i][x+j][2]
					mRed += float64(rn)
					mGreen += float64(gn)
					mBlue += float64(bn)
					nValues++
					if !(i == start || i == start*-1) && j != start*-1 {
						j = start*-1 - 1
					}
				}
			}
		}
		start--
	}

	mRed /= float64(nValues)
	mGreen /= float64(nValues)
	mBlue /= float64(nValues)

	if utils.Similiarity(r, g, b, int(mRed), int(mGreen), int(mBlue)) >= threshold {
		return true
	}
	return false
}
