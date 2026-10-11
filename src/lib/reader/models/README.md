# Models of the reader

The two models that read printed text (the short code below a QR code) in the browser. They are
part of the app and served from the own server; nothing is fetched from elsewhere.

| File       | What it does                           | Size   | SHA-256                                                            |
| ---------- | -------------------------------------- | ------ | ------------------------------------------------------------------ |
| `det.onnx` | finds lines of text in a picture       | 4.8 MB | `4d97c44a20d30a81aad087d6a396b08f786c4635742afc391f6621f5c6ae78ae` |
| `rec.onnx` | reads one line (Latin letters, digits) | 7.9 MB | `c3461add59bb4323ecba96a492ab75e06dda42467c9e3d0c18db5d1d21924be8` |

- **Models:** PP-OCRv5 mobile (`PP-OCRv5_mobile_det`, `en_PP-OCRv5_mobile_rec`) from
  [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR), Apache License 2.0.
- **These files:** the ONNX conversions published by the
  [RapidOCR](https://github.com/RapidAI/RapidOCR) project (release v3.10.0, files
  `ch_PP-OCRv5_det_mobile.onnx` and `en_PP-OCRv5_rec_mobile.onnx`), Apache License 2.0. The
  checksums above are the ones RapidOCR lists for them.
- **Runtime:** [ONNX Runtime Web](https://onnxruntime.ai) (MIT License), bundled from the npm
  package `onnxruntime-web`.
- `../characters.ts` is the list of characters stored inside `rec.onnx` (metadata `character`).

Changing a model: replace the file, update this table and `characters.ts`, and measure again with
real pictures before shipping.
