"""Unifica las etiquetas de un dataset COCO en las dos clases del modelo: aro y balon.

Uso:
    python unificar_etiquetas.py <entrada.json> <salida.json>
"""

import json
import sys

MAPA_CLASES = {
    "rim": "aro",
    "hoop": "aro",
    "basket": "aro",
    "basketball-hoop": "aro",
    "net": "aro",
    "ball": "balon",
    "basketball": "balon",
    "sports ball": "balon",
    "sports-ball": "balon",
}

# Model Maker reserva el id 0 para el fondo.
CLASES_SALIDA = ["aro", "balon"]


class ErrorDataset(Exception):
    """Se lanza cuando tras unificar alguna clase no tiene cajas."""


def unificar_coco(coco: dict, mapa: dict = MAPA_CLASES) -> dict:
    """Devuelve un COCO nuevo solo con las clases de CLASES_SALIDA."""
    nombres_origen = {c["id"]: c["name"].strip().lower() for c in coco["categories"]}
    ids_salida = {nombre: i + 1 for i, nombre in enumerate(CLASES_SALIDA)}

    anotaciones = []
    for ann in coco["annotations"]:
        clase = mapa.get(nombres_origen.get(ann["category_id"], ""))
        if clase is None:
            continue
        nueva = dict(ann)
        nueva["category_id"] = ids_salida[clase]
        anotaciones.append(nueva)

    for nombre in CLASES_SALIDA:
        if not any(a["category_id"] == ids_salida[nombre] for a in anotaciones):
            encontradas = sorted(set(nombres_origen.values()))
            raise ErrorDataset(
                f"La clase '{nombre}' tiene 0 cajas tras unificar. "
                f"Categorías de origen encontradas: {', '.join(encontradas) or '(ninguna)'}"
            )

    con_anotacion = {a["image_id"] for a in anotaciones}
    imagenes = [img for img in coco["images"] if img["id"] in con_anotacion]

    for i, ann in enumerate(anotaciones, start=1):
        ann["id"] = i

    return {
        "images": imagenes,
        "categories": [{"id": ids_salida[n], "name": n} for n in CLASES_SALIDA],
        "annotations": anotaciones,
    }


def resumen(coco: dict) -> dict:
    """Cuenta imágenes y cajas por clase de un COCO unificado."""
    nombres = {c["id"]: c["name"] for c in coco["categories"]}
    conteo = {nombre: 0 for nombre in CLASES_SALIDA}
    for ann in coco["annotations"]:
        conteo[nombres[ann["category_id"]]] += 1
    return {"imagenes": len(coco["images"]), **conteo}


def main(argv: list) -> int:
    if len(argv) != 3:
        print("Uso: python unificar_etiquetas.py <entrada.json> <salida.json>", file=sys.stderr)
        return 2
    entrada, salida = argv[1], argv[2]
    with open(entrada, encoding="utf-8") as f:
        coco = json.load(f)
    try:
        out = unificar_coco(coco)
    except ErrorDataset as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    with open(salida, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(json.dumps(resumen(out), ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
