import type { Tip } from '@/types/tip';

const CREADO = '2026-01-15T00:00:00.000Z';

/**
 * Contenido semilla empaquetado con la app.
 *
 * Por qué existe: la Biblioteca tiene que funcionar en la primera apertura, sin
 * red y sin proyecto de Firebase configurado. Firestore luego sobreescribe y
 * amplía este set (ver tipsRepository.syncTips).
 *
 * Todo el texto es redacción original. `fuenteReferencia` es atribución
 * conceptual, nunca cita literal. Ver docs/CONTENIDO.md.
 */
export const SEED_TIPS: Tip[] = [
  {
    id: 'tiro-alineacion-pies',
    titulo: 'Alineación de pies',
    resumen: 'Orienta los pies antes de recibir: el tiro empieza en el suelo.',
    categoria: 'tiro',
    subcategoria: 'mecánica base',
    nivel: 'principiante',
    formato: 'drill',
    zonas: ['top_key', 'left_wing', 'right_wing', 'mid_range', 'free_throw'],
    texto: [
      'Un tiro consistente se construye de abajo hacia arriba. La alineación de los pies define el equilibrio y decide cuánta fuerza de las piernas llega realmente al balón.',
      'Si los pies quedan rígidamente cuadrados o demasiado abiertos, los brazos terminan compensando el esfuerzo. Eso funciona en un tiro suelto, pero se rompe cuando aparece el cansancio o un defensor.',
    ],
    pasos: [
      {
        titulo: 'Orientación al aro',
        detalle:
          'Apunta la punta del pie del lado de tu mano de tiro hacia el centro del aro. El otro pie puede quedar ligeramente atrás, en la posición que te salga natural.',
      },
      {
        titulo: 'Base de apoyo',
        detalle:
          'Separa los pies al ancho de los hombros. Demasiado juntos pierdes balance lateral; demasiado separados pierdes elevación.',
      },
      {
        titulo: 'Peso adelantado',
        detalle:
          'Flexiona las rodillas y mantén el peso sobre los metatarsos, no sobre los talones. Debes poder saltar sin dar un paso previo.',
      },
      {
        titulo: 'Repetición sin balón',
        detalle:
          'Haz 20 recepciones imaginarias desde distintos ángulos. El objetivo es que la posición de pies aparezca sola, sin pensarla.',
      },
    ],
    fuenteReferencia: 'Principios generales de biomecánica del tiro en baloncesto formativo.',
    autorRevisor: 'Equipo EzyBall',
    fechaCreacion: CREADO,
    actualizadoEn: CREADO,
    publicado: true,
  },
  {
    id: 'tiro-catch-and-shoot-manos',
    titulo: 'Preparación de manos en el catch & shoot',
    resumen: 'Las manos deben estar listas antes de que llegue el pase.',
    categoria: 'tiro',
    subcategoria: 'catch-and-shoot',
    nivel: 'intermedio',
    formato: 'tip_rapido',
    zonas: ['left_wing', 'right_wing', 'top_key', 'left_corner', 'right_corner'],
    texto: [
      'La mayor parte del tiempo que se pierde en un catch & shoot no está en el tiro: está en acomodar el balón después de recibirlo.',
      'Muestra las manos al pasador con las palmas hacia el balón y los pulgares apuntándose entre sí. Si recibes con las manos ya en la forma del tiro, el balón aterriza donde debe y te ahorras el reacomodo.',
      'Un indicador simple: si necesitas girar el balón en las manos después de recibirlo, la preparación llegó tarde.',
    ],
    autorRevisor: 'Equipo EzyBall',
    fechaCreacion: CREADO,
    actualizadoEn: CREADO,
    publicado: true,
  },
  {
    id: 'tiro-esquina-espacio',
    titulo: 'El triple de esquina y el margen que no tienes',
    resumen: 'En la esquina la línea está más cerca, pero el pie también.',
    categoria: 'tiro',
    subcategoria: 'tiro de esquina',
    nivel: 'intermedio',
    formato: 'concepto',
    zonas: ['left_corner', 'right_corner'],
    texto: [
      'La esquina es el triple más corto de la cancha, y por eso suele ser el de mejor porcentaje. El problema es que también es donde menos espacio hay entre la línea de tres y la banda.',
      'Muchos fallos en esquina no son de mecánica: son de posición. El tirador se acomoda demasiado cerca de la banda, se queda sin sitio para caer hacia adelante y termina tirando de lado.',
      'Antes de recibir, busca con el pie la línea de fondo y deja un paso de margen. Si tienes que mirar al suelo mientras el balón viaja, ya llegaste tarde.',
    ],
    pasos: [
      {
        titulo: 'Marca tu punto',
        detalle:
          'Coloca el pie interior a un pie de distancia de la línea de tres y memoriza esa referencia con el cuerpo, no con la vista.',
      },
      {
        titulo: 'Recibe abriéndote',
        detalle:
          'Da el último paso hacia el balón, no hacia la banda. Ganas espacio y evitas quedar pisando fuera.',
      },
      {
        titulo: 'Cae hacia adelante',
        detalle:
          'Termina el salto ligeramente hacia la cancha. Si caes hacia la banda estás frenando el tiro con el tronco.',
      },
    ],
    autorRevisor: 'Equipo EzyBall',
    fechaCreacion: CREADO,
    actualizadoEn: CREADO,
    publicado: true,
  },
  {
    id: 'tiro-libre-rutina',
    titulo: 'Construye una rutina de tiro libre',
    resumen: 'La rutina no es superstición: es un ancla de consistencia.',
    categoria: 'tiro',
    subcategoria: 'tiro libre',
    nivel: 'principiante',
    formato: 'drill',
    zonas: ['free_throw'],
    texto: [
      'El tiro libre es el único tiro del partido donde controlas todas las variables. Por eso la variabilidad que aparece ahí casi siempre viene de la cabeza, no del cuerpo.',
      'Una rutina fija reduce el número de decisiones que tomas antes de soltar. Cuanto menos decidas, más parecido sale cada tiro.',
    ],
    pasos: [
      {
        titulo: 'Elige tu secuencia',
        detalle:
          'Define un orden corto y repetible: pisar la marca, botar un número fijo de veces, respirar, tirar. Que dure menos de cinco segundos.',
      },
      {
        titulo: 'Fija la respiración',
        detalle:
          'Suelta el aire justo antes de flexionar. Es la señal que le dice al cuerpo que ya empezó el movimiento.',
      },
      {
        titulo: 'Repite bajo fatiga',
        detalle:
          'Haz series de 10 tiros libres intercaladas con sprints. La rutina solo sirve si aguanta cansado.',
      },
      {
        titulo: 'Mide, no adivines',
        detalle:
          'Registra las series en el tracker. Un cambio de rutina se evalúa con 100 tiros, no con 10.',
      },
    ],
    autorRevisor: 'Equipo EzyBall',
    fechaCreacion: CREADO,
    actualizadoEn: CREADO,
    publicado: true,
  },
  {
    id: 'tiro-con-bote-frenado',
    titulo: 'Frenar antes de tirar con bote',
    resumen: 'El último bote decide el tiro: mete el pie, no lo arrastres.',
    categoria: 'tiro',
    subcategoria: 'tiro con bote',
    nivel: 'avanzado',
    formato: 'drill',
    zonas: ['mid_range', 'top_key', 'left_wing', 'right_wing'],
    texto: [
      'Cuando tiras tras bote, el balón llega con inercia horizontal. Si no la conviertes en inercia vertical, el tiro sale corto o desviado hacia el lado del movimiento.',
      'La solución está en el último bote: hazlo más fuerte y más bajo, y mete el pie de freno por delante del centro de masa. Ese pie es el que convierte la velocidad en salto.',
    ],
    pasos: [
      {
        titulo: 'Bote de carga',
        detalle:
          'El último bote va más duro y a la altura de la rodilla. Te da tiempo para colocar los pies mientras el balón sube.',
      },
      {
        titulo: 'Pie de freno',
        detalle:
          'Planta el pie adelantado con el talón primero. Es antinatural al principio, pero es lo que corta el desplazamiento.',
      },
      {
        titulo: 'Sube en vertical',
        detalle:
          'Si aterrizas más de 20 cm por delante de donde saltaste, todavía estás tirando con inercia horizontal.',
      },
    ],
    autorRevisor: 'Equipo EzyBall',
    fechaCreacion: CREADO,
    actualizadoEn: CREADO,
    publicado: true,
  },
  {
    id: 'tiro-arco-y-rotacion',
    titulo: 'Arco alto y rotación constante',
    resumen: 'Un arco más alto agranda el aro; la rotación perdona el error.',
    categoria: 'tiro',
    subcategoria: 'mecánica base',
    nivel: 'intermedio',
    formato: 'concepto',
    zonas: ['mid_range', 'free_throw', 'top_key'],
    texto: [
      'El aro visto desde un tiro plano es una elipse estrecha. Cuanto más alto es el arco de entrada, más circular se vuelve esa figura y más margen de error tienes.',
      'La rotación hacia atrás cumple otra función: cuando el balón toca aro, el giro tiende a frenarlo y a hacerlo caer dentro en vez de rebotar largo.',
      'Si tus fallos son sobre todo rebotes largos y duros, casi siempre es falta de arco y de rotación, no de fuerza.',
    ],
    autorRevisor: 'Equipo EzyBall',
    fechaCreacion: CREADO,
    actualizadoEn: CREADO,
    publicado: true,
  },
  {
    id: 'tiro-pintura-mano-contraria',
    titulo: 'Terminar en la pintura con la mano contraria',
    resumen: 'La mano débil no se entrena en el partido: se entrena antes.',
    categoria: 'tiro',
    subcategoria: 'finalización',
    nivel: 'principiante',
    formato: 'drill',
    zonas: ['paint'],
    texto: [
      'Si solo terminas con tu mano dominante, el defensor solo tiene que cubrir un lado. Ganar la mano contraria no es un lujo técnico: te duplica las entradas disponibles.',
    ],
    pasos: [
      {
        titulo: 'Sin balón primero',
        detalle:
          'Haz 10 entradas al aro solo con el patrón de pasos, sin botar. Interioriza el ritmo de dos tiempos por el lado débil.',
      },
      {
        titulo: 'Apoyo en el tablero',
        detalle:
          'Usa el cuadro del tablero desde 45 grados. Te da una referencia visual clara mientras la mano gana sensibilidad.',
      },
      {
        titulo: 'Sube la exigencia',
        detalle:
          'Añade un cono o un compañero pasivo que te obligue a cambiar de mano en el último momento.',
      },
    ],
    autorRevisor: 'Equipo EzyBall',
    fechaCreacion: CREADO,
    actualizadoEn: CREADO,
    publicado: true,
  },
  {
    id: 'dribleo-bote-bajo',
    titulo: 'Bote bajo y cambio de ritmo',
    resumen: 'Bote a la altura de la rodilla y mirada arriba.',
    categoria: 'dribleo',
    subcategoria: 'control',
    nivel: 'principiante',
    formato: 'drill',
    zonas: [],
    texto: [
      'Un bote alto es cómodo para ti y cómodo para el defensor: le da tiempo de reacción. Bajar el bote a la altura de la rodilla reduce ese tiempo casi a la mitad.',
      'El control real no viene de la palma sino de los dedos y de la muñeca. La palma debe tocar el balón lo menos posible.',
    ],
    pasos: [
      {
        titulo: 'Estático, dos minutos',
        detalle: 'Bote fuerte a la altura de la rodilla con cada mano, mirando al frente, no al balón.',
      },
      {
        titulo: 'Cambio de ritmo',
        detalle:
          'Alterna tres botes lentos y dos explosivos. El cambio de velocidad es lo que rompe al defensor, no la velocidad constante.',
      },
      {
        titulo: 'Con obstáculo',
        detalle: 'Repite el patrón avanzando entre conos, manteniendo la cabeza levantada todo el ejercicio.',
      },
    ],
    autorRevisor: 'Equipo EzyBall',
    fechaCreacion: CREADO,
    actualizadoEn: CREADO,
    publicado: true,
  },
  {
    id: 'defensa-postura-base',
    titulo: 'Postura defensiva sostenible',
    resumen: 'Caderas abajo, pecho arriba, manos activas.',
    categoria: 'defensa',
    subcategoria: 'fundamentos',
    nivel: 'principiante',
    formato: 'concepto',
    zonas: [],
    texto: [
      'La postura defensiva correcta no es la más baja posible: es la más baja que puedes sostener durante toda la posesión sin perder la respiración.',
      'Baja desde las caderas, no doblando la espalda. Si el pecho se va hacia el suelo pierdes visión de campo y tardas más en reaccionar a un cambio de dirección.',
      'Las manos deben estar activas pero sin cruzar el cuerpo: molestan líneas de pase sin comprometer tu equilibrio.',
    ],
    autorRevisor: 'Equipo EzyBall',
    fechaCreacion: CREADO,
    actualizadoEn: CREADO,
    publicado: true,
  },
  {
    id: 'pase-lectura-antes',
    titulo: 'Decidir el pase antes de recibir',
    resumen: 'Mira la ayuda mientras el balón viaja hacia ti.',
    categoria: 'pase',
    subcategoria: 'lectura',
    nivel: 'intermedio',
    formato: 'concepto',
    zonas: [],
    texto: [
      'El tiempo más valioso de una posesión es el que pasa mientras el balón viaja hacia ti. Si lo usas para mirar la defensa en vez de mirar el balón, llegas con la decisión tomada.',
      'Lo que buscas es concreto: dónde está la ayuda, si el defensor del lado débil ya giró la cabeza, y qué compañero se va a quedar solo si esa ayuda llega.',
    ],
    autorRevisor: 'Equipo EzyBall',
    fechaCreacion: CREADO,
    actualizadoEn: CREADO,
    publicado: true,
  },
  {
    id: 'footwork-pivote-inverso',
    titulo: 'Pivote inverso para ganar el hombro',
    resumen: 'Un pivote bien ejecutado vale más que un cambio de mano.',
    categoria: 'footwork',
    subcategoria: 'pivotes',
    nivel: 'intermedio',
    formato: 'drill',
    zonas: ['paint', 'mid_range'],
    texto: [
      'El pivote inverso te permite cambiar de dirección sin botar, algo especialmente útil cuando ya agotaste el bote o recibes de espaldas al aro.',
    ],
    pasos: [
      {
        titulo: 'Fija el pie',
        detalle: 'Elige el pie de pivote y no lo levantes. Practica primero sin defensor y sin prisa.',
      },
      {
        titulo: 'Gira con el hombro',
        detalle: 'El giro lo inicia el hombro y la cadera, no el pie libre. El pie solo acompaña.',
      },
      {
        titulo: 'Sal a un objetivo',
        detalle:
          'Termina cada pivote con una acción concreta: tiro, entrada o pase. El pivote no es el final.',
      },
    ],
    autorRevisor: 'Equipo EzyBall',
    fechaCreacion: CREADO,
    actualizadoEn: CREADO,
    publicado: true,
  },
  {
    id: 'rebote-bloqueo-caja',
    titulo: 'Bloquear antes de saltar',
    resumen: 'El rebote se gana medio segundo antes de que el balón baje.',
    categoria: 'rebote',
    subcategoria: 'posicionamiento',
    nivel: 'principiante',
    formato: 'concepto',
    zonas: ['paint'],
    texto: [
      'Casi todos los rebotes perdidos se pierden por posición, no por salto. Localiza a tu par en cuanto sale el tiro, haz contacto con el antebrazo y ocupa el espacio antes de mirar el balón.',
      'El orden importa: primero contacto, después balón. Si inviertes ese orden, tu par ya te ganó el sitio.',
    ],
    autorRevisor: 'Equipo EzyBall',
    fechaCreacion: CREADO,
    actualizadoEn: CREADO,
    publicado: true,
  },
  {
    id: 'atletismo-triple-extension',
    titulo: 'Triple extensión para el salto',
    resumen: 'Tobillo, rodilla y cadera se extienden en el mismo instante.',
    categoria: 'atletismo',
    subcategoria: 'explosividad',
    nivel: 'intermedio',
    formato: 'drill',
    zonas: [],
    texto: [
      'La altura de salto depende menos de la fuerza bruta que de la sincronía. Si la cadera se extiende antes que la rodilla, pierdes parte de la energía por el camino.',
    ],
    pasos: [
      {
        titulo: 'Salto vertical sin brazos',
        detalle: '3 series de 5 saltos con las manos en la cadera. Aísla el trabajo de piernas.',
      },
      {
        titulo: 'Aterrizaje controlado',
        detalle:
          'Aterriza suave y absorbe con las rodillas alineadas sobre los pies. El aterrizaje protege más de lo que suma el salto.',
      },
      {
        titulo: 'Añade brazos',
        detalle:
          'Repite coordinando el impulso de brazos con la extensión. Debe sentirse como un solo movimiento.',
      },
    ],
    autorRevisor: 'Equipo EzyBall',
    fechaCreacion: CREADO,
    actualizadoEn: CREADO,
    publicado: true,
  },
  {
    id: 'iq-espaciado',
    titulo: 'Espaciado: ocupar el sitio correcto',
    resumen: 'Tu posición sin balón decide el espacio de quien lo tiene.',
    categoria: 'iq_juego',
    subcategoria: 'juego sin balón',
    nivel: 'avanzado',
    formato: 'concepto',
    zonas: ['left_corner', 'right_corner', 'left_wing', 'right_wing'],
    texto: [
      'Cuando dos atacantes están demasiado cerca, un solo defensor puede cubrir a los dos. El espaciado es, literalmente, obligar a la defensa a gastar más jugadores de los que quisiera.',
      'La referencia práctica: mantén entre cuatro y cinco metros con el compañero más cercano y respeta la esquina cuando hay penetración, porque es el pase de salida más largo y más difícil de cubrir.',
    ],
    autorRevisor: 'Equipo EzyBall',
    fechaCreacion: CREADO,
    actualizadoEn: CREADO,
    publicado: true,
  },
  {
    id: 'mentalidad-siguiente-jugada',
    titulo: 'La regla de la siguiente jugada',
    resumen: 'El fallo dura lo que tú decidas que dure.',
    categoria: 'mentalidad',
    subcategoria: 'foco',
    nivel: 'principiante',
    formato: 'concepto',
    zonas: [],
    texto: [
      'Un tiro fallado no baja tu porcentaje del siguiente, salvo que tú lo cargues hasta allí. El coste real de un error casi siempre es la posesión que viene después.',
      'Elige un gesto de reinicio: tocar la línea de fondo, ajustar la muñeca, una respiración. Es una señal física de que esa jugada ya terminó.',
    ],
    autorRevisor: 'Equipo EzyBall',
    fechaCreacion: CREADO,
    actualizadoEn: CREADO,
    publicado: true,
  },
  {
    id: 'mentalidad-entrenar-con-datos',
    titulo: 'Entrenar con datos sin obsesionarse',
    resumen: 'Compara series completas, no tiros sueltos.',
    categoria: 'mentalidad',
    subcategoria: 'progreso',
    nivel: 'intermedio',
    formato: 'concepto',
    zonas: [],
    texto: [
      'Medir el tiro ayuda solo si comparas muestras del mismo tamaño. Un 40% en 10 tiros y un 40% en 100 tiros no dicen lo mismo.',
      'Fija una serie fija por zona (por ejemplo 25 tiros) y compara sesiones completas. Los saltos de porcentaje entre series de 5 tiros son ruido, no progreso.',
    ],
    autorRevisor: 'Equipo EzyBall',
    fechaCreacion: CREADO,
    actualizadoEn: CREADO,
    publicado: true,
  },
];
