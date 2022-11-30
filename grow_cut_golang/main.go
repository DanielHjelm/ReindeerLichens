package main

import (
	"bytes"
	"encoding/json"

	"encoding/base64"
	"fmt"
	"image/png"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"

	cellulargrowth "github.com/DanielHjelm/ReindeerLichens/cellularGrowth"
	utils "github.com/DanielHjelm/ReindeerLichens/utils"
	"github.com/rwcarlsen/goexif/exif"
)

var quoteEscaper = strings.NewReplacer("\\", "\\\\", `"`, "\\\"")

func escapeQuotes(s string) string {
	return quoteEscaper.Replace(s)
}

func base64ToArrayImage(b64 string) [][][]uint8 {

	// Remove the header
	header := strings.Split(b64, ",")[0]
	b64 = strings.Split(b64, ",")[1]
	unbased, _ := base64.StdEncoding.DecodeString(string(b64))
	if strings.Contains(header, "png") {
		// Decode base64 string
		pngI, err := png.Decode(bytes.NewReader([]byte(unbased)))
		if err != nil {
			fmt.Printf("Error decoding png: %v", err)
			panic(err)
		}
		image := utils.ImageToArray(pngI)
		return image

	} else {

		x, err := exif.Decode(bytes.NewReader([]byte(header)))
		if err != nil {
			fmt.Printf("Error decoding exif: %v", err)
			panic(err)
		}
		// Get the image orientation
		orientation, err := x.Get("Orientation")
		if err != nil {
			fmt.Printf("Error getting orientation: %v", err)
			panic(err)
		}

		// Decode base64 string
		pngI, err := png.Decode(bytes.NewReader([]byte(unbased)))
		if err != nil {
			fmt.Printf("Error decoding png: %v", err)
			panic(err)
		}
		image := utils.ImageToArray(pngI)
		// Rotate the image
		if orientation.String() != "0" {
			image = utils.RotateImage(image, 90*3)
		}
		return image

	}

}

func SaveResultToDb(path string) error {
	// Send mask to database with a form
	// https://stackoverflow.com/questions/20205796/post-data-using-the-content-type-multipart-form-data
	apiHost := os.Getenv("NEXT_PUBLIC_IMAGES_API_HOST")
	if apiHost == "" {
		fmt.Printf("NEXT_PUBLIC_IMAGES_API_HOST not set")
		panic("NEXT_PUBLIC_IMAGES_API_HOST not set")
	}
	fmt.Printf("apiHost: %v\n", apiHost)
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()
	filetype, err := utils.GetFileContentType(file)
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

func main() {

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

	busy := false
	http.HandleFunc("/start", func(w http.ResponseWriter, r *http.Request) {

		if busy {
			json.NewEncoder(w).Encode("busy")
			return
		}
		busy = true

		fmt.Printf("Request: %v", r)

		r_body := RequestBody{}
		err := json.NewDecoder(r.Body).Decode(&r_body)
		if err != nil {
			// Print error
			fmt.Printf("%v", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		img := base64ToArrayImage(r_body.Img)

		// _image, err := utils.ReadImageAsArray("../images/" + r_body.ImageName)
		// if err != nil {
		// 	fmt.Printf("Error opening image: %v", err)
		// 	panic(err)
		// }

		mask := cellulargrowth.CellularGrowth(img, r_body.Pixels, false)
		fmt.Printf("Cellular growth completed\n")
		fileType := strings.Split(r_body.FileName, ".")[1]
		maskName := strings.Split(r_body.FileName, ".")[0] + "_mask" + "." + fileType
		utils.SaveMask(mask, "result/"+maskName)
		SaveResultToDb("result/" + maskName)
		fmt.Printf("Mask saved to mongo\n")
		// Save image locally
		// if _, err := os.Stat("images/" + r_body.FileName); err != nil {

		// }

		busy = false

	})

	port := ":3001"
	fmt.Println("Server is running on port" + port)

	// Start server on port specified above
	log.Fatal(http.ListenAndServe(port, nil))

}
