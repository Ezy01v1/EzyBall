"""Comprueba como decodificar las salidas crudas de hoop-ball.tflite.

El modelo de Model Maker exporta cajas y puntuaciones sin NMS (formato crudo), y
la app las decodifica con los anchors incrustados en los metadatos. Este script
prueba los dos ordenes de caja posibles (YXHW y XYWH) contra el ObjectDetector de
MediaPipe sobre imagenes de test, e imprime cual coincide. Tambien guarda los
anchors en anchors.json para la app.

Uso (Python 3.11 con mediapipe y tflite):
    python verificar_decodificacion.py export/hoop-ball.tflite datos/test/images
"""
import glob
import json
import os
import struct
import sys

import flatbuffers
import numpy as np
import tflite
from flatbuffers.table import Table


def leer_metadatos(ruta):
    buf = open(ruta, "rb").read()
    m = tflite.Model.GetRootAsModel(buf, 0)
    md = None
    for i in range(m.MetadataLength()):
        if m.Metadata(i).Name() == b"TFLITE_METADATA":
            md = bytes(m.Buffers(m.Metadata(i).Buffer()).DataAsNumpy())
    pos = md.find(b"V001")  # file_identifier de ObjectDetectorOptions
    sub = bytearray(md[pos - 4:])
    t = Table(sub, struct.unpack_from("<I", sub, 0)[0])

    def tabla(t, slot):
        o = t.Offset(4 + 2 * slot)
        return Table(t.Bytes, t.Indirect(o + t.Pos))

    fijos = tabla(tabla(t, 1), 0)
    dec = tabla(t, 2)
    o = fijos.Offset(4)
    inicio = fijos.Vector(o)
    f32 = flatbuffers.number_types.Float32Flags
    anchors = []
    for k in range(fijos.VectorLen(o)):
        a = Table(fijos.Bytes, fijos.Indirect(inicio + 4 * k))
        anchors.append([a.GetSlot(4 + 2 * j, 0.0, f32) for j in range(4)])  # x, y, w, h
    escalas = [dec.GetSlot(4 + 2 * (6 + j), 1.0, f32) for j in range(4)]  # x, y, w, h
    return np.array(anchors, dtype=np.float32), escalas


def decodificar(raw, anchors, escalas, orden):
    ax, ay, aw, ah = anchors.T
    sx, sy, sw, sh = escalas
    if orden == "YXHW":
        ty, tx, th, tw = raw.T
    else:
        tx, ty, tw, th = raw.T
    x = tx / sx * aw + ax
    y = ty / sy * ah + ay
    w = np.exp(tw / sw) * aw
    h = np.exp(th / sh) * ah
    return np.stack([x - w / 2, y - h / 2, x + w / 2, y + h / 2], axis=1)  # xmin, ymin, xmax, ymax normalizados


def iou(a, b):
    ix = max(0.0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0.0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = ix * iy
    union = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
    return inter / union if union > 0 else 0.0


def main():
    import mediapipe as mp
    import tensorflow as tf
    from mediapipe.tasks import python as mpp
    from mediapipe.tasks.python import vision
    from PIL import Image

    ruta_modelo, carpeta = sys.argv[1], sys.argv[2]
    anchors, escalas = leer_metadatos(ruta_modelo)
    json.dump({"escalas": escalas, "anchors": anchors.round(6).tolist()}, open("anchors.json", "w"))
    print("anchors:", len(anchors), "escalas x,y,w,h:", escalas)

    interp = tf.lite.Interpreter(model_path=ruta_modelo)
    interp.allocate_tensors()
    ent = interp.get_input_details()[0]
    sal = interp.get_output_details()
    alto, ancho = int(ent["shape"][1]), int(ent["shape"][2])
    detector = vision.ObjectDetector.create_from_options(vision.ObjectDetectorOptions(
        base_options=mpp.BaseOptions(model_asset_path=ruta_modelo), score_threshold=0.5, max_results=5))

    aciertos = {"YXHW": [], "XYWH": []}
    for ruta in sorted(glob.glob(os.path.join(carpeta, "*")))[:15]:
        img = Image.open(ruta).convert("RGB")
        W, H = img.size
        x = np.asarray(img.resize((ancho, alto)), dtype=np.float32)
        # Model Maker normaliza la entrada a [-1, 1]
        x = (x - 127.5) / 127.5
        interp.set_tensor(ent["index"], x[None])
        interp.invoke()
        salidas = [interp.get_tensor(s["index"])[0] for s in sal]
        cajas = next(o for o in salidas if o.shape[-1] == 4)
        scores = next(o for o in salidas if o.shape[-1] != 4)
        r = detector.detect(mp.Image.create_from_file(ruta))
        for d in r.detections:
            bb = d.bounding_box
            ref = [bb.origin_x / W, bb.origin_y / H, (bb.origin_x + bb.width) / W, (bb.origin_y + bb.height) / H]
            nombre = d.categories[0].category_name
            for orden in aciertos:
                dec = decodificar(cajas, anchors, escalas, orden)
                clase = 1 if nombre == "aro" else 2
                k = int(np.argmax(scores[:, clase]))
                aciertos[orden].append(max(iou(ref, dec[j]) for j in np.argsort(-scores[:, clase])[:20]))
            print(os.path.basename(ruta)[:40], nombre, round(d.categories[0].score, 3),
                  "score crudo max:", round(float(scores[:, 1 if nombre == 'aro' else 2].max()), 3))
    for orden, v in aciertos.items():
        print(f"{orden}: IoU medio con MediaPipe = {np.mean(v):.3f} sobre {len(v)} detecciones")
    print("Rango de scores crudos:", float(scores.min()), float(scores.max()))


if __name__ == "__main__":
    main()
