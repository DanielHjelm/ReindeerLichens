package utils

func CreateArray(sizeX, sizeY int) [][]float64 {
	a := make([][]float64, sizeX)
	for i := range a {
		a[i] = make([]float64, sizeY)
	}
	return a
}

func CreateArrayInt(sizeX, sizeY int) [][]int {
	a := make([][]int, sizeX)
	for i := range a {
		a[i] = make([]int, sizeY)
	}

	return a
}

func CopyArrayInt(arr [][]int) [][]int {
	new_arr := CreateArrayInt(len(arr), len(arr[0]))
	for x := 0; x < len(arr); x++ {
		for y := 0; y < len(arr[0]); y++ {
			new_arr[x][y] = arr[x][y]
		}
	}
	return new_arr
}

func CopyArrayFloat(arr [][]float64) [][]float64 {
	new_arr := CreateArray(len(arr), len(arr[0]))
	for x := 0; x < len(arr); x++ {
		for y := 0; y < len(arr[0]); y++ {
			new_arr[x][y] = arr[x][y]
		}
	}
	return new_arr
}


