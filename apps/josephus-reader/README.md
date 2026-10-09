# Josephus Reader

A parallel Greek/English reader of the complete works of Flavius Josephus. [See it live here](https://cbop-dev.github.io/josephus-reader). The texts are taken from xml data provided by the [PerseusDL project](https://github.com/PerseusDL) of the following public domain works:

* *Flavii Iosephi Opera*, Vol. 1-4. Benedikt Niese, editor. Berlin: Weidmann, 1885-1890. (Greek) (See)
* *The Works of Flavius Josephus*. William, Whiston,translator. Auburn and Rochester, NY: Alden and Beardsley, 1856. (English)


Python scripts (in `/scripts` and) were used to grab the data, which was processed and stored in `/static/data`. A SvelteKit project is then what builds the static html/js site, which is then stored in `/build`.


You can also read these works on the Tufts University's [Scaife Viewer](https://scaife.perseus.org/library/urn:cts:greekLit:tlg0526/). 

## Installation

```
git clone https://github.com/cbop-dev/josephus-reader/
cd josephus-reader
npm install


## run a dev version locally:
npm run check && npm run dev

## build the static site:
npm run build

## preview the static site:
npm run preview

```

The result is a roughly ~54 MB folder which can be hosted on any http server. This site is currently live at: [https://cbop-dev.github.io/josephus-reader/](https://cbop-dev.github.io/josephus-reader/)


## Human Involvement and AI Tools Used

* This README was written entirely by a real human being.
* The Greek text displayed is a reconstruction of that of a real human being, Flavius Josephus, of the 1st century CE, as edited by scholars of the 19th century, digitized by Perseus experts in the 21st.
* Most of the rest of this project's underlying code was built using Google's Antigravity IDE (2.5.5).
* But a human being had to coerce and correct it many times to get it right.

## Disclaimer
* The tool may have bugs/problems. 
* It has not been thoroughly tested for accuracy.
* Thus, check the texts against reliable sources before using any quotations in academic work.


