# Entrenamiento de hoop-ball.tflite

Entrena el detector de aro y balon (EfficientDet-Lite0, int8, menos de 5 MB) en Google Colab.

## Pasos

1. Crea una cuenta en [Roboflow](https://roboflow.com) y copia tu API key (Settings > API Keys).
2. En Colab, abre `entrenar_hoop_ball.ipynb` y guarda la clave como secreto `ROBOFLOW_API_KEY` (icono de la llave, panel izquierdo), con acceso al notebook activado.
3. En [Roboflow Universe](https://universe.roboflow.com) busca "basketball hoop ball". Elige un dataset con clases de aro y balon y al menos 1 000 imagenes. Copia su workspace, project y version a `DATASETS` en la celda 1 (puedes anadir varios).
4. Entorno de ejecucion > Cambiar tipo de entorno de ejecucion > GPU T4.
5. Ejecuta las celdas en orden y para si alguna falla. La celda 2 crea un Python 3.11 aparte (Colab trae Python 3.13 y `mediapipe-model-maker` solo funciona hasta 3.11) y tarda unos minutos; las celdas `%%py311` se ejecutan con el. Si el repo es privado, la celda 2 te pedira subir `training/unificar_etiquetas.py`.
6. Al terminar se descargan `hoop-ball.tflite` y `labels.txt`. Copia `hoop-ball.tflite` a `assets/models/`.
7. Pega en la conversacion la salida de la celda 9 (tipo y forma de entrada, salidas y orden de etiquetas) para ajustar el perfil del modelo en la app.
