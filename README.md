# ReindeerLichens

Project in Scientific Computing (1TD316)

## Remove boarder
Use OpenCV for removing boarders

## Image preprocessing
Image Processing techniques using OpenCV and Python: https://github.com/BhanuPrakashNani/Image_Processing
### Pre processing - shades
Use "Shading correction based on Gaussian smoothing" - create a "background" using a large mean filter and subtract/divide by this to remove shades

## Segmentation
### Use template matching for identification
Use template matching (OpenCV) to find typical lichen or typical errors. Could give good results for removing bägarlav 

### Deep Learning

https://www.v7labs.com/blog/image-segmentation-guide

#### Deeplab image segmentation paper

https://arxiv.org/pdf/1606.00915.pdf

#### Mask-RCNN image segmentation paper

https://arxiv.org/pdf/1703.06870.pdf
https://www.kaggle.com/code/lewisgmorris/image-segmentation-using-detectron2 

> code: https://github.com/facebookresearch/Detectron
>
> Updated version code: https://github.com/facebookresearch/detectron2/blob/main/INSTALL.md

#### Deep learning for segmentation on wheat, with very different backgrounds and conditions
"Outdoor Plant Segmentation With Deep Learning for High-Throughput Field Phenotyping on a Diverse Wheat Dataset"
Article: https://www.frontiersin.org/articles/10.3389/fpls.2021.774068/full
Code: https://github.com/RadekZenkl/EWS

#### Deep learning for data with limited labeling
https://arxiv.org/abs/2005.10266

https://www.iges.or.jp/en/publication_documents/pub/peer/en/11571/Remote+Sensing+-+Jozdani+et+al+2021.pdf


#### Tool for useful to label images
##### Lightly
https://www.lightly.ai/: Self-supervised learning. Built to help you understand and work with large unlabeled datasets.

##### Labelme
https://github.com/wkentaro/labelme

## Other approaches for estimating lichen coverage

### Advanced Photogrammetry
https://www.researchgate.net/publication/320670417_Advanced_Photogrammetry_to_Assess_Lichen_Colonization_in_the_Hyper-Arid_Namib_Desert

# Fix corrupted zip file by using 
```zip -FF FILE.zip --out fixed.zip```
 followed by ```7z x fixed.zip ```
> Worked on linux
