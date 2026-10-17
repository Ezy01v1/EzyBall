import unittest

from unificar_etiquetas import ErrorDataset, resumen, unificar_coco

# categorías: 1 rim, 2 Basketball, 3 person; 3 imágenes:
# img1 con rim+Basketball, img2 solo person, img3 con rim
coco_ejemplo = {
    "images": [
        {"id": 1, "file_name": "a.jpg", "width": 100, "height": 100},
        {"id": 2, "file_name": "b.jpg", "width": 100, "height": 100},
        {"id": 3, "file_name": "c.jpg", "width": 100, "height": 100},
    ],
    "categories": [
        {"id": 1, "name": "rim"},
        {"id": 2, "name": "Basketball"},
        {"id": 3, "name": "person"},
    ],
    "annotations": [
        {"id": 10, "image_id": 1, "category_id": 1, "bbox": [0, 0, 10, 10], "area": 100, "iscrowd": 0},
        {"id": 11, "image_id": 1, "category_id": 2, "bbox": [20, 20, 5, 5], "area": 25, "iscrowd": 0},
        {"id": 12, "image_id": 2, "category_id": 3, "bbox": [5, 5, 30, 40], "area": 1200, "iscrowd": 0},
        {"id": 13, "image_id": 3, "category_id": 1, "bbox": [1, 1, 8, 8], "area": 64, "iscrowd": 0},
    ],
}

# Solo hay aros: no existe ninguna categoría de balón.
coco_solo_aros = {
    "images": [
        {"id": 1, "file_name": "a.jpg", "width": 100, "height": 100},
    ],
    "categories": [
        {"id": 1, "name": "hoop"},
    ],
    "annotations": [
        {"id": 1, "image_id": 1, "category_id": 1, "bbox": [0, 0, 10, 10], "area": 100, "iscrowd": 0},
    ],
}


class TestUnificar(unittest.TestCase):
    def test_remapea_y_descarta(self):
        out = unificar_coco(coco_ejemplo)
        self.assertEqual([c["name"] for c in out["categories"]], ["aro", "balon"])
        self.assertEqual({i["id"] for i in out["images"]}, {1, 3})
        self.assertEqual(resumen(out), {"imagenes": 2, "aro": 2, "balon": 1})

    def test_ids_de_salida(self):
        out = unificar_coco(coco_ejemplo)
        self.assertEqual({c["name"]: c["id"] for c in out["categories"]}, {"aro": 1, "balon": 2})

    def test_falla_si_falta_una_clase(self):
        with self.assertRaises(ErrorDataset) as ctx:
            unificar_coco(coco_solo_aros)
        self.assertIn("balon", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
