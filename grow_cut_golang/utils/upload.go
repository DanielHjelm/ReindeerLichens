package utils

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image/jpeg"
	"image/png"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"os"
	"path/filepath"
	"strings"

	exif "github.com/rwcarlsen/goexif/exif"
)

var quoteEscaper = strings.NewReplacer("\\", "\\\\", `"`, "\\\"")

func escapeQuotes(s string) string {
	return quoteEscaper.Replace(s)
}

func Base64ToArrayImage(b64 string) ([][][]uint8, error) {

	// Remove the header

	b64 = strings.Split(b64, ",")[1]
	unbased, err := base64.StdEncoding.DecodeString(b64)
	if err != nil {
		return nil, err
	}

	fileType := http.DetectContentType(unbased)
	fmt.Printf("fileType: %v\n", fileType)
	var mimeType string
	if fileType == "image/jpeg" {
		mimeType = ".jpg"
	} else if fileType == "image/png" {
		mimeType = ".png"
	} else {
		return nil, fmt.Errorf("Invalid file type: %v", fileType)
	}

	fmt.Printf("mimeType: %v\n", mimeType)
	f, err := os.Create("temp" + mimeType)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	if _, err := f.Write(unbased); err != nil {
		return nil, err
	}
	if err := f.Sync(); err != nil {
		return nil, err
	}
	f.Seek(0, 0)
	if fileType == "image/png" {
		// Decode base64 string
		pngI, err := png.Decode(f)
		if err != nil {
			fmt.Printf("Error decoding png: %v", err)
			return nil, err

		}
		image := ImageToArray(pngI)
		return image, nil

	} else {

		x, err := exif.Decode(f)
		if err != nil {
			fmt.Printf("Error decoding exif: %v", err)
			return nil, err

		}
		// Get the image orientation
		orientation, err := x.Get("Orientation")
		if err != nil {
			fmt.Printf("Error getting orientation: %v", err)
			return nil, err

		}
		f.Seek(0, 0)

		// Decode base64 string
		jpgI, err := jpeg.Decode(f)
		if err != nil {
			fmt.Printf("Error decoding jpeg: %v", err)
			return nil, err

		}
		image := ImageToArray(jpgI)

		// Rotate the image
		if orientation.String() != "1" {
			image = RotateImage(image, 90*3)
		}

		os.Remove(f.Name())
		return image, nil

	}

}

func SaveResultToDb(path string) error {
	// Send mask to database with a form
	// https://stackoverflow.com/questions/20205796/post-data-using-the-content-type-multipart-form-data
	apiHost := os.Getenv("NEXT_PUBLIC_IMAGES_API_HOST")
	if apiHost == "" {
		fmt.Printf("NEXT_PUBLIC_IMAGES_API_HOST not set")
		return fmt.Errorf("NEXT_PUBLIC_IMAGES_API_HOST not set")
	}
	fmt.Printf("apiHost: %v\n", apiHost)
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()
	filetype, err := GetFileContentType(file)
	if err != nil {
		return err
	}
	file.Seek(0, 0)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	h := make(textproto.MIMEHeader)
	h.Set("Content-Disposition",
		fmt.Sprintf(`form-data; name="%s"; filename="%s"`,
			escapeQuotes("file"), escapeQuotes(filepath.Base(path))))
	h.Set("Content-Type", filetype)
	part, err := writer.CreatePart(h)
	if err != nil {
		return err
	}
	_, err = io.Copy(part, file)

	err = writer.Close()
	if err != nil {
		return err
	}

	endpoint := "http://" + apiHost + "/images"
	fmt.Printf("Sending request to %v\n", endpoint)
	req, err := http.NewRequest("POST", endpoint, body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	fmt.Printf("Request headers\n")
	for name, values := range req.Header {
		// Loop over all values for the name.
		for _, value := range values {
			fmt.Println(name, value)
		}
	}
	fmt.Printf("req: %v\n", req.Header)

	client := &http.Client{}
	res, err := client.Do(req)
	if err != nil {
		return err
	}
	fmt.Printf("Response status code: %v\n", res.StatusCode)
	fmt.Println("res header: %w\n", res.Header)
	fmt.Println("Response body: %w\n", res.Body)

	return nil

}
