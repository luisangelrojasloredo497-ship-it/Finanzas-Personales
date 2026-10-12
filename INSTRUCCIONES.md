# Instrucciones paso a paso (para principiantes)

## 0. ¿Qué es cada archivo?

```
Finanzas-Personales/          ← carpeta del proyecto (ábrela completa en VS Code)
├── index.html                ← la estructura de las 6 pantallas
├── estilos.css               ← colores, tamaños y diseño para celular
├── app.js                    ← toda la lógica: datos iniciales, cálculos, guardar, CSV, respaldo
├── manifest.json             ← nombre, colores e íconos para poder "instalarla"
├── service-worker.js         ← guarda una copia en el teléfono para usarla sin internet
├── iconos/
│   ├── icono-192.png         ← ícono chico
│   ├── icono-512.png         ← ícono grande
│   ├── icono-maskable-512.png← ícono que Android recorta en círculo/forma
│   └── icono-apple-180.png   ← ícono para iPhone
├── README.md
└── INSTRUCCIONES.md          ← este archivo
```

Todos los archivos van **en la misma carpeta** (la raíz del repositorio), excepto los íconos, que van dentro de la carpeta `iconos`. No cambies los nombres: unos archivos llaman a otros por su nombre.

**¿Dónde cambio cosas?**
- Datos iniciales (deudas, compromisos, listas, efectivo inicial): al inicio de `app.js`, sección `1. DATOS INICIALES`. Ojo: estos datos solo se usan la **primera vez** que abres la app (o si presionas "Restablecer datos iniciales"). Después, todo se cambia desde la pantalla **Ajustes**.
- Fórmulas: `app.js`, sección `4. CÁLCULOS`.
- Colores: al inicio de `estilos.css` (`--acento`, `--positivo`, etc.).

---

## 1. Probarla en tu computadora con VS Code + Live Server

1. Instala **Visual Studio Code**: https://code.visualstudio.com
2. Abre VS Code → menú **Archivo → Abrir carpeta…** → elige la carpeta `Finanzas-Personales`.
3. Instala la extensión **Live Server**:
   - Clic en el ícono de cuadritos de la barra izquierda (Extensiones), o `Ctrl+Shift+X`.
   - Busca **Live Server** (autor: Ritwick Dey) → **Instalar**.
4. En la lista de archivos, clic derecho sobre `index.html` → **Open with Live Server**.
   (O el botón **Go Live** abajo a la derecha.)
5. Se abre tu navegador en algo como `http://127.0.0.1:5500/index.html`. ¡Esa es tu app!
6. Para verla como en celular: presiona `F12` → clic en el ícono de teléfono/tablet (o `Ctrl+Shift+M`).
7. Cada vez que guardes un archivo en VS Code (`Ctrl+S`), la página se recarga sola.

**Comprueba los números:** con los datos iniciales, el Panel de octubre 2026 debe mostrar
Dinero disponible **$550.00**, Ingresos **$500.00**, Egresos **$1,676.86**, Disponible en crédito **$542.53**,
Deuda en tarjetas **$18,393.47**, en préstamos **$18,370.00** y DEUDA TOTAL **$36,763.47**.

> Si cambias `app.js` y no ves el cambio, recarga con `Ctrl+Shift+R`.
> Los datos que registres en la computadora se quedan en ese navegador; NO pasan solos al celular
> (usa Respaldo / Restaurar para moverlos).

---

## 2. Publicarla gratis en GitHub Pages

Tu código ya está en GitHub, en el repositorio `Finanzas-Personales`.

### 2.1 Pasar los cambios a la rama principal
La app se subió en la rama `claude/crear-aplicacion-wz8o8u`. GitHub Pages publica desde la rama principal (`main`):

1. Entra a tu repositorio en https://github.com.
2. Verás un aviso amarillo "**claude/crear-aplicacion-wz8o8u had recent pushes**" → **Compare & pull request**.
   (Si no aparece: pestaña **Pull requests → New pull request**, base: `main`, compare: `claude/crear-aplicacion-wz8o8u`.)
3. **Create pull request** → luego **Merge pull request** → **Confirm merge**.

### 2.2 Activar GitHub Pages
1. En el repositorio: **Settings** (Configuración) → en el menú izquierdo **Pages**.
2. En **Source** elige **Deploy from a branch**.
3. En **Branch** elige `main` y carpeta `/ (root)` → **Save**.
4. Espera 1–2 minutos y recarga la página. Arriba aparecerá:
   **"Your site is live at https://TU-USUARIO.github.io/Finanzas-Personales/"**
5. Abre ese enlace para comprobar que funciona.

> GitHub Pages solo funciona gratis con repositorios **públicos** (en cuentas gratuitas).
> Tus datos NO se suben a GitHub: viven solo en tu teléfono. Lo público es el código.

### 2.3 Publicar cambios futuros desde VS Code
1. Edita y guarda tus archivos.
2. Barra izquierda → ícono de **Control de código fuente** (`Ctrl+Shift+G`).
3. Escribe un mensaje (ej. "Agrego categoría Mascotas") → **Commit** → **Sync Changes / Push**.
4. En 1–2 minutos el sitio se actualiza. En el celular, cierra y abre la app (con internet) para ver la versión nueva.

---

## 3. Instalarla en tu Android

1. Abre **Google Chrome** en el celular.
2. Entra a `https://TU-USUARIO.github.io/Finanzas-Personales/`.
3. Toca el menú **⋮** (tres puntos, arriba a la derecha) → **Instalar app** (o **Agregar a pantalla principal** → **Instalar**).
4. Listo: aparece el ícono **Finanzas** con la moneda dorada en tu pantalla de inicio. Se abre a pantalla completa, como una app normal.
5. Ábrela una vez con internet. A partir de ahí **funciona sin internet**.

---

## 3b. Instalarla en tu iPhone

En iPhone la app **no se descarga de la App Store** ni se copia la carpeta: se instala desde la dirección de GitHub Pages (sección 2).

1. Abre **Safari** (en iPhone, el botón de instalar está garantizado en Safari).
2. Entra a `https://TU-USUARIO.github.io/Finanzas-Personales/` y espera a que cargue completa.
3. Toca el botón **Compartir** (el cuadrito con flecha hacia arriba ⬆️, abajo en el centro).
4. Desliza hacia abajo y toca **Agregar a pantalla de inicio** (o **Agregar a inicio**).
5. Deja el nombre **Finanzas** → toca **Agregar** (arriba a la derecha).
6. Aparece el ícono de la moneda dorada en tu pantalla de inicio. Ábrela desde ahí (no desde Safari):
   se abre a pantalla completa, como app normal, y funciona sin internet.

**Detalles del iPhone que debes saber:**
- Los datos de la app instalada están **separados** de los de Safari. Usa siempre el ícono de la pantalla de inicio.
- Si borras el ícono de la pantalla de inicio, **se borran tus datos**. Haz respaldo antes.
- Al tocar **Hacer respaldo** o **Exportar CSV**, el iPhone te muestra el archivo: toca Compartir ⬆️ →
  **Guardar en Archivos** (o mándalo por WhatsApp/correo). Para restaurar, elige el archivo desde **Archivos**.
- Para pasar tus datos de la computadora al iPhone: en la compu **Hacer respaldo**, mándate el archivo
  (AirDrop, correo, WhatsApp o iCloud Drive), guárdalo en Archivos y en el iPhone **Ajustes → Restaurar respaldo**.

---

## 4. Cuidar tus datos (¡importante!)

- Todo se guarda **solo en el teléfono**, dentro de Chrome.
- Si desinstalas la app, borras los datos de Chrome o cambias de teléfono, **se pierden**.
- Por eso: **Ajustes → Hacer respaldo** cada semana. Se descarga un archivo `respaldo-finanzas-AAAA-MM-DD.json`;
  guárdalo en Google Drive o mándatelo por correo/WhatsApp.
- Para recuperar: **Ajustes → Restaurar respaldo** y eliges ese archivo.
- **Exportar CSV** te da los movimientos para abrirlos en Excel. **Importar CSV** acepta el mismo formato
  (columnas: Fecha, Tipo, Categoría/Fuente, Concepto, Cuenta/Deuda, Pagado con, Monto; fecha en dd/mm/aaaa).
  - *agregar*: suma los movimientos del archivo a los que ya tienes.
  - *reemplazar*: borra tus movimientos y deja solo los del archivo.

---

## 5. Problemas comunes

| Problema | Solución |
|---|---|
| No aparece "Instalar app" | Debe abrirse desde la dirección `https://…github.io/…` (no desde un archivo). Espera unos segundos después de cargar, o usa "Agregar a pantalla principal". |
| El sitio de GitHub Pages dice 404 | Espera 2–3 minutos; revisa que en Settings → Pages esté la rama `main` y `/ (root)`, y que `index.html` esté en la raíz. |
| Publiqué cambios y el celular sigue igual | Abre la app con internet, ciérrala por completo y vuelve a abrirla. |
| Los números no cuadran con el Excel | Revisa el **Mes a consultar** (Panel o Ajustes) y que los nombres en "Cuenta/Deuda" y "Pagado con" sean idénticos a los de tus deudas/compromisos. |
| Live Server no abre | Asegúrate de haber abierto la **carpeta** (no solo el archivo) en VS Code. |
