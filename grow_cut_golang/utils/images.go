package utils

import (
	"fmt"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"math"
	"net/http"

	"os"

	exif "github.com/rwcarlsen/goexif/exif"
)

func ImageMeanNorm(img [][][]uint8) float64 {

	var norm float64 = 0
	var count int = 0
	for y := 0; y < len(img); y++ {
		for x := 0; x < len(img[0]); x++ {
			r, g, b := img[y][x][0], img[y][x][1], img[y][x][2]
			_norm := L2(int(r), int(g), int(b))
			norm += _norm
			count += 1
		}
	}
	return norm / float64(count)
}
func SaveMask(mask [][]int, filename string) error {
	_img := image.NewRGBA(image.Rect(0, 0, len(mask[0]), len(mask)))
	for row := 0; row < len(mask); row++ {
		for col := 0; col < len(mask[0]); col++ {
			if mask[row][col] != 1 {
				_img.Set(col, row, color.RGBA{0, 0, 0, 255})
			} else {
				_img.Set(col, row, color.RGBA{255, 255, 255, 255})
			}

		}
	}

	err := SaveImage(filename, _img)
	return err
}

func SaveMaskOnTopOfImage(img [][][]uint8, mask [][]int, filename string) error {

	_img := image.NewRGBA(image.Rect(0, 0, len(mask[0]), len(mask)))
	for row := 0; row < len(mask); row++ {
		for col := 0; col < len(mask[0]); col++ {
			r, g, b := img[row][col][0], img[row][col][1], img[row][col][2]
			if mask[row][col] == 1 {

				_img.Set(col, row, color.RGBA{uint8(float64(148)*.4 + float64(r)*.6), uint8(float64(g) * .6), uint8(math.Round(float64(211) * .6)), 255})
			} else if mask[row][col] == -1 {
				_img.Set(col, row, color.RGBA{255, 0, 0, 255})
			} else {

				_img.Set(col, row, color.RGBA{uint8(r), uint8(g), uint8(b), 255})
			}

		}
	}

	err := SaveImage(filename, _img)

	return err
}

func GetFileContentType(file *os.File) (string, error) {

	// to sniff the content type only the first
	// 512 bytes are used.

	buf := make([]byte, 512)

	_, err := file.Read(buf)

	if err != nil {
		return "", err
	}

	// the function that actually does the trick
	contentType := http.DetectContentType(buf)

	return contentType, nil
}

func ReadPngAsArray(path string) ([][][]uint8, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	img, err := png.Decode(f)
	if err != nil {
		return nil, err
	}
	bounds := img.Bounds()
	w, h := bounds.Max.X, bounds.Max.Y
	var imgArray [][][]uint8 = make([][][]uint8, h)
	for y := 0; y < h; y++ {
		imgArray[y] = make([][]uint8, w)
		for x := 0; x < w; x++ {
			r, g, b, _ := img.At(x, y).RGBA()
			r, g, b = r>>8, g>>8, b>>8
			imgArray[y][x] = []uint8{uint8(r), uint8(g), uint8(b)}
		}

	}
	return imgArray, nil
}

func ReadJpegAsArray(path string) ([][][]uint8, error) {
	f, err := os.Open(path)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	defer f.Close()

	fi, _ := f.Stat()
	fmt.Println(fi.Name())
	x, err := exif.Decode(f)
	var rotation float64 = 0

	if err == nil {
		orientationRaw, err := x.Get("Orientation")

		if err == nil {
			orientation := orientationRaw.String()

			if orientation == "3" {
				rotation = 180
			} else if orientation == "6" {
				rotation = 270
			} else if orientation == "8" {
				rotation = 90
			}
		}

	}
	f.Seek(0, 0)

	img, err := jpeg.Decode(f)
	if err != nil {
		fmt.Println("Decoding error:", err.Error())
		return nil, err
	}

	bounds := img.Bounds()
	var imageArray [][][]uint8 = make([][][]uint8, bounds.Max.Y)
	for y := 0; y < bounds.Max.Y; y++ {
		imageArray[y] = make([][]uint8, bounds.Max.X)
		for x := 0; x < bounds.Max.X; x++ {
			r, g, b, _ := img.At(x, y).RGBA()
			r, g, b = r/257, g/257, b/257
			imageArray[y][x] = []uint8{uint8(r), uint8(g), uint8(b)}

		}
	}
	fmt.Printf("Rotation: %f\n", rotation)

	if rotation != 0 {
		fmt.Printf("Rotating image by %f\n", -rotation)
		imageArray = RotateImage(imageArray, rotation*3)

	}
	fmt.Printf("Read image with width %d and height %d\n", len(imageArray[0]), len(imageArray))
	return imageArray, nil

}

func ImageToArray(img image.Image) [][][]uint8 {

	imageArray := make([][][]uint8, img.Bounds().Max.Y)
	for y := 0; y < img.Bounds().Max.Y; y++ {
		imageArray[y] = make([][]uint8, img.Bounds().Max.X)
		for x := 0; x < img.Bounds().Max.X; x++ {
			r, g, b, _ := img.At(x, y).RGBA()
			r, g, b = r/257, g/257, b/257
			imageArray[y][x] = []uint8{uint8(r), uint8(g), uint8(b)}

		}
	}
	return imageArray

}

func ReadImageAsArray(path string) ([][][]uint8, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	// Get the file content
	contentType, err := GetFileContentType(f)

	if err != nil {
		panic(err)
	}

	switch contentType {
	case "image/png":
		fmt.Printf("PNG file detected\n")
		return ReadPngAsArray(path)
	case "image/jpeg":
		fmt.Printf("JPEG file detected\n")
		return ReadJpegAsArray(path)

	}

	return nil, fmt.Errorf("Unknown file detected")

}

func RotateImage(img [][][]uint8, angle float64) [][][]uint8 {
	var rotatedImage [][][]uint8
	if angle == 90 {
		for col := 0; col < len(img[0]); col++ {
			var rowArray [][]uint8
			for row := len(img) - 1; row >= 0; row-- {
				rowArray = append(rowArray, img[row][col])
			}
			rotatedImage = append(rotatedImage, rowArray)
		}
	} else if angle == 180 {
		for row := len(img) - 1; row >= 0; row-- {
			var rowArray [][]uint8
			for col := len(img[0]) - 1; col >= 0; col-- {
				rowArray = append(rowArray, img[row][col])
			}
			rotatedImage = append(rotatedImage, rowArray)
		}
	} else if angle == 270 {
		for col := len(img[0]) - 1; col >= 0; col-- {
			var rowArray [][]uint8
			for row := 0; row < len(img); row++ {
				rowArray = append(rowArray, img[row][col])
			}
			rotatedImage = append(rotatedImage, rowArray)
		}
	}
	return rotatedImage
}

func SaveImage(path string, img image.Image) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	options := &jpeg.Options{Quality: 100}
	err = jpeg.Encode(f, img, options)
	return err
}

func L2(r, g, b int) float64 {
	return math.Sqrt(float64(r*r + g*g + b*b))
}

func GetImageMaxNorm(img image.Image) float64 {

	bounds := img.Bounds()
	var norm float64 = 0

	for row := bounds.Min.X; row < bounds.Max.X; row++ {
		for col := bounds.Min.Y; col < bounds.Max.Y; col++ {
			r, g, b, _ := img.At(col, row).RGBA()
			r, g, b = r/257, g/257, b/257
			_norm := L2(int(r), int(g), int(b))

			if _norm > norm {
				norm = _norm
			}
		}
	}
	return norm
}

func ArrayToImage(arr [][][]uint8) image.Image {
	// create an image

	fmt.Printf("Converting array to image with width %d and height %d\n", len(arr[0]), len(arr))
	img := image.NewRGBA(image.Rect(0, 0, len(arr[0]), len(arr)))

	for y := 0; y < len(arr); y++ {
		for x := 0; x < len(arr[0]); x++ {
			img.Set(x, y, color.RGBA{arr[y][x][0], arr[y][x][1], arr[y][x][2], 255})
		}
	}

	fmt.Printf("Created image with width %d and height %d\n", img.Bounds().Max.X, img.Bounds().Max.Y)
	return img

}
