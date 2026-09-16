# Pizarra Táctica de Fútbol Animada

Herramienta online para crear pizarras tácticas de fútbol animadas y exportarlas como GIF.

## 🚀 Cómo Usar

### Opción 1: Servidor Local (Recomendado para exportar GIF)

1. Haz doble clic en `iniciar_servidor.bat`
2. Abre tu navegador en `http://localhost:8000`
3. ¡Listo! Ahora puedes usar todas las funcionalidades incluyendo exportar GIF

### Opción 2: Abrir directamente (sin exportación GIF)

- Abre `index.html` directamente en tu navegador
- **Nota:** La exportación a GIF no funcionará debido a restricciones de seguridad del navegador

## 🎨 Características

### 1. Añadir Elementos
- **Local**: Jugador del equipo local
- **Visitante**: Jugador del equipo visitante
- **Pelota**: Balón de fútbol
- **Cono**: Cono de entrenamiento

### 2. Herramientas
- **Mover** ✋: Arrastra cualquier elemento en la cancha
- **Flecha** ➡️: Dibuja flechas para indicar movimientos
- **Área** ⬜: Crea zonas rectangulares transparentes
- **Eliminar** 🗑️: Haz clic en elementos para borrarlos

### 3. Animación
- **Guardar Escena**: Captura la posición actual de los elementos
- **Reproducir**: Muestra la animación entre escenas
- **Limpiar**: Borra todo y reinicia
- **Descargar GIF**: Exporta tu animación como archivo GIF

### 4. Colores
Selecciona entre 4 colores para jugadores, conos y flechas:
- 🔵 Azul
- 🔴 Rojo
- 🟢 Verde
- 🟡 Amarillo

## ⚽ Características de la Cancha

- Proporciones FIFA reales (105m x 68m)
- Patrón de césped vertical profesional
- Áreas de penalti, áreas de meta y círculo central a escala
- Arcos de penalti y esquinas
- Diseño adaptativo que se ajusta al tamaño de pantalla

## 📱 Compatibilidad

- ✅ Escritorio (Chrome, Firefox, Edge, Safari)
- ✅ Tablet
- ✅ Móvil (con controles optimizados)

## 🎯 Casos de Uso

- **Entrenadores**: Explica jugadas y estrategias a tu equipo
- **Analistas**: Crea contenido táctico para redes sociales
- **Creadores**: Genera material visual para videos y blogs
- **Aficionados**: Diseña tus propias jugadas y compártelas

## 🔧 Archivos del Proyecto

- `index.html` - Página principal
- `app.js` - Lógica de la aplicación
- `gif.worker.js` - Worker para exportación de GIF
- `iniciar_servidor.bat` - Script para iniciar servidor local

## ⚠️ Solución de Problemas

### El GIF no se descarga
**Causa:** Estás abriendo el archivo directamente desde el sistema de archivos.

**Solución:** Usa el servidor local ejecutando `iniciar_servidor.bat`

### Los botones no responden
**Solución:** Recarga la página (F5) y asegúrate de que `app.js` esté en la misma carpeta.

### La cancha se ve muy pequeña
**Solución:** Maximiza la ventana del navegador o ajusta el zoom.

## 💰 Monetización

La aplicación incluye espacios publicitarios de Google AdSense:

- **Banner horizontal** debajo de la herramienta principal
- **Banner mid-content** entre las secciones informativas
- **Notificación** en la esquina inferior derecha (aparece después de 5 segundos)
- **Pop-up** al descargar GIF (se cierra automáticamente)

### Configuración de AdSense

El script de AdSense está configurado con el ID: `ca-pub-6606573660886956`

**Para cambiar los anuncios:**
1. Accede a tu cuenta de Google AdSense
2. Crea nuevas unidades de anuncios
3. Reemplaza los `data-ad-slot` en el código HTML con tus IDs

**Ubicaciones de los anuncios en el código:**
- Banner superior: Línea ~360 del `index.html`
- Banner mid-content: Línea ~410 del `index.html`
- Notificación: Línea ~520 del `index.html`
- Pop-up descarga: Línea ~535 del `index.html`

## 📄 Licencia

Uso libre para fines educativos y comerciales.

---

¿Preguntas o sugerencias? Reporta issues en el repositorio del proyecto.
