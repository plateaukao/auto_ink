# An Automated Inking System
Shape Processing and its Application to Stroke Rendering and Stylization

This is a brain dump of my final year project (commonly known as FYP) at HKUST. Basically, it is a system that allows you to input plain curves and turn it into stroked plausible inkings. The intended application including Chinese calligraphic font generation and animated cartoon.

<img src="images/cover.png" width="800">
<img src="images/system diagram.png" width="400">
Figure 1. Visual summary of the automated inking system

Stage A (offline). Library construction

1. Input images of stroke samples
2. Perform thresholding, edge extraction and vectorization
3. Decompose the shapes into individual strokes
4. Thinning: compute the central axis
5. Compute the skeletal representation
6. Perform component analysis
7. Build a library of component strokes 

Stage B (online). Matching and stylization
1. Input digitized unstroked curves
2. Perform component analysis
3. Search for the best match in the library
4. Compute correspondence between input curves and sample curves
5. Compute the skeletal stroke deformation
6. Output the stroked set

<img src="images/cartoon stylization.png" width="800">
Figure 2. Input (left), naive stylization (middle), our stylization result (right). The solid eyes were added afterwards for aesthetic purpose. It was originally a frame extracted from the animation Toy Tinkers, 1949 by Walt Disney Productions. Reproduced without permission.

### Automated dynamic inking for animation
<img src="images/dale_walking.gif" width="400" />

### Interactive Chinese calligraphy
![](images/heung.gif)

### Some HTML demo you may find interesting

#### Chinese Calligraphy
[Interactive Chinese calligraphy](https://tyt2y3.github.io/auto_ink/sketch.html)<br>
[stroke library of Chinese calligraphy](https://tyt2y3.github.io/auto_ink/library%20of%20chin%20cali%202.html)<br>
[stylization of Chinese characters](https://tyt2y3.github.io/auto_ink/library_matching.html)<br>
[stage 1 of stylization](https://tyt2y3.github.io/auto_ink/library_matching.html?mode=present&stage=1)<br>
[stage 2 of stylization](https://tyt2y3.github.io/auto_ink/library_matching.html?mode=present&stage=2)<br>

#### Cartoon illustration
[stroke library of cartoon](https://tyt2y3.github.io/auto_ink/library%20of%20cartoon.html)<br>
[stylization of cartoon](https://tyt2y3.github.io/auto_ink/library_matching.html?mode=cartoon)<br>
[animation showing dynamic stroke interpolation](https://tyt2y3.github.io/auto_ink/animation.html)<br>

#### Shape
[stroke deform](https://tyt2y3.github.io/auto_ink/stroke_deform.html)<br>
[shape decomposition](https://tyt2y3.github.io/auto_ink/shape_processing.html)<br>

### Technical details
- [abstract](promotion%20booklet.pdf)
- [slides](FYP%20presentation.pdf)
- [full report](hftsangab_PSAN2_Final.pdf)

DISCLAIMER: this repository is all rights reserved, and is merely a "brain dump". You can only use it for academic research purpose. Albeit, the programs provided here are purely for demonstration purpose, and is so poorly implemented that it probably cannot handle practical inputs.