# 🚀 KiroPOS - Sistema de Punto de Venta Profesional

<p align="center">
  <strong>Sistema POS integral, reactivo y de máxima calidad desarrollado con arquitectura limpia (Express + SQLite ACID + React 18 + Tailwind CSS).</strong><br>
  Diseñado para control de ventas, inventario, precios diferenciados, clientes categorizados, control de deudores con abonos, facturación térmica (58mm/80mm), exportación a PDF, factura virtual con QR/WhatsApp y modo oscuro.
</p>

---

## 📋 Tabla de Contenidos
1. [Credenciales de Acceso](#-credenciales-de-acceso-predeterminadas)
2. [Instalación y Puesta en Marcha](#-c%C3%B3mo-iniciar-el-sistema)
3. [Acceso desde Red Local (Celulares y Tablets)](#-uso-en-red-local-celulares-tablets-o-m%C3%BAltiples-pcs)
4. [Copias de Seguridad (Backups)](#-copias-de-seguridad-backup-de-base-de-datos)
5. [Despliegue con Docker](#-despliegue-con-docker)
6. [Funcionalidades Principales](#-funcionalidades-implementadas)
7. [Catálogo de Skills para el Asistente de IA (.agent/skills)](#-cat%C3%A1logo-de-skills-para-el-asistente-de-ia-agentskills)
8. [Cómo Funcionan los Triggers y Prompts de Control](#-c%C3%B3mo-funcionan-los-triggers-y-c%C3%B3mo-se-usan-las-skills)
9. [Estructura del Proyecto](#-estructura-del-proyecto)

---

## 🔑 Credenciales de Acceso Predeterminadas

| Rol | Usuario | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin` | `admin123` | Control total: Ventas, Compras, Gastos, Inventario, Deudores, Ajustes, Reportes, Configuración de Negocio y Gestión de Cajeros. |
| **Cajero** | `cajero` | `cajero123` | Punto de Venta (POS), Directorio de Clientes, Registro de Abonos y Arqueo/Cierre de su turno de caja. |

---

## ⚡ Cómo Iniciar el Sistema

### Requisitos Previos
- **Node.js**: Versión 18 o superior.
- **npm**: Incluido con Node.js.

### 1. Instalación de Dependencias
```bash
# Instalar dependencias del servidor y raíz
npm install

# Instalar dependencias del cliente React
npm --prefix client install
```

### 2. Compilar Frontend para Producción
```bash
npm run build
```

### 3. Iniciar el Servidor
```bash
npm start
```
> El sistema se ejecutará en **`http://localhost:3000`** (o en la IP de tu red local).

### Modo Desarrollo (Hot-Reload)
Para trabajar con recarga automática simultánea en cliente y servidor:
```bash
npm run dev
```

---

## 📱 Uso en Red Local (Celulares, Tablets o Múltiples PCs)

El servidor está configurado por defecto para escuchar en `0.0.0.0:3000`, permitiendo cobrar y operar desde cualquier dispositivo conectado a la misma red WiFi:

1. Abre una terminal en tu PC principal y obtén tu dirección IP:
   - **Windows:** `ipconfig` (ejemplo: `192.168.1.50`).
   - **Linux / Mac:** `ifconfig` o `ip a`.
2. Desde tu celular, tablet o laptop conectada al mismo WiFi, abre el navegador web.
3. Ingresa: `http://192.168.1.50:3000` (sustituye por la IP de tu PC).
4. Inicia sesión con las credenciales y podrás registrar ventas en tiempo real.

---

## 💾 Copias de Seguridad (Backup de Base de Datos)

Toda la base de datos es autónoma y se almacena en SQLite con soporte completo ACID:
- **Ubicación del archivo:** `server/data/pos.sqlite`
- **Respaldar:** Simplemente copia el archivo `pos.sqlite` a una memoria USB, Google Drive o Dropbox.
- **Restaurar:** Coloca el archivo respaldado en la carpeta `server/data/pos.sqlite` y reinicia el servidor.

---

## 🐳 Despliegue con Docker

El proyecto incluye un entorno contenerizado listo para producción:

```bash
# Construir y levantar contenedores
docker compose up -d --build

# Ver logs en tiempo real
docker compose logs -f

# Detener contenedores
docker compose down
```

---

## 🌟 Funcionalidades Implementadas

### 1. Control de Ventas, Compras y Gastos
- **Punto de Venta (POS):** Escaneo de códigos de barra o búsqueda rápida por nombre, atajos de teclado (`Enter`), cantidades incrementales, descuento global y por ítem, cálculo de IVA configurable, desglose de formas de pago (Efectivo, Tarjeta, Transferencia, Crédito), botones rápidos de billetes (`+$5`, `+$10`, `+$20`, etc.) y cálculo instantáneo de vuelto/cambio.
- **Control de Compras:** Registro de compras a proveedores con costo unitario, cantidad, reposición automática de stock y cálculo de costo promedio.
- **Control de Gastos:** Clasificación por categorías operativas (Alquiler, Servicios, Nómina, Suministros, Transporte, etc.) sincronizadas con el efectivo de la caja activa.
- **Arqueo y Cierre de Turno de Caja:** Apertura con fondo inicial, cálculo en tiempo real del saldo teórico esperado (`Fondo inicial + Ventas efectivo + Abonos efectivo - Gastos efectivo = Esperado`), arqueo físico y cálculo de diferencias (sobrante o faltante).

### 2. Control de Inventario y Precios Diferenciados
- Catálogo de productos con código de barra / SKU, nombre, descripción, categoría y unidad de medida.
- **Precios diferenciados por categoría de cliente:**
  - **Precio Regular:** Para compras estándar de mostrador.
  - **Precio Frecuente:** Tarifa preferencial para clientes habituales.
  - **Precio Mayorista:** Tarifa por volumen al por mayor.
- **Indicadores visuales de stock:** En existencia, Alerta de bajo stock (`stock <= min_stock`) y Agotado.
- **Kardex de Auditoría:** Historial cronológico inmutable de movimientos (`VENTA`, `COMPRA`, `AJUSTE_ENTRADA`, `AJUSTE_SALIDA`) con fecha, cantidad, stock previo, nuevo stock, motivo y usuario responsable.
- **Ajustes Manuales:** Módulo para regularizar diferencias físicas por merma o avería.

### 3. Directorio de Clientes y Categorización
- Registro de clientes con documento de identidad (DNI, RUC, RFC o Cédula), teléfono, correo y dirección.
- **Categorías fijas integradas:** `mayorista`, `frecuente` y `simple`.
- **Selector Inteligente:** Tarjeta de cliente fija en el POS con badge de categoría, opción de **Edición Rápida** y botón directo de **Ver Deuda**.
- Asignación de límites de crédito personalizados por cliente.

### 4. Control de Deudores y Función de Abonos
- **Cartera de Deudores:** Módulo especializado para monitorear ventas al crédito / fiadas (`is_credit = 1`).
- Indicadores KPI: Total global por cobrar, clientes con deuda activa, facturas vencidas y abonos recaudados en el mes.
- Estado de cuenta por cliente con listado de facturas, fechas de vencimiento y saldos.
- **Función de Abonos:**
  - Modal para abonar a una factura específica o al saldo general.
  - Registro de pagos en efectivo (sumándose automáticamente a la caja de turno), transferencia o tarjeta.
  - Emisión inmediata del **Comprobante de Abono** (`ABO-XXXXXX`) con detalle de saldo anterior, abono y saldo pendiente restante.
  - Impresión térmica y exportación a PDF del recibo de abono.

### 5. Facturas Térmicas, Exportación a PDF y Factura Virtual
- **Ticket Térmico (58mm / 80mm):**
  - Formato ESC/POS adaptable para rollos térmicos de 80mm y 58mm portátil/bluetooth.
  - Directiva `@media print` optimizada para enviar directamente a la impresora con `window.print()` sin encabezados ni márgenes del navegador.
  - Código QR dinámico de verificación impreso en el ticket.
- **Exportación a PDF:**
  - Generación de comprobante formal tamaño **A4** corporativo con tablas, sellos de estado y datos fiscales vía jsPDF.
- **Factura Virtual:**
  - Comprobante digital interactivo accesible vía `/factura/:numero_factura`.
  - Botón **"Enviar por WhatsApp"** con mensaje formal prediseñado y enlace único al comprobante web.
  - Código QR interactivo en pantalla.

### 6. Modo Oscuro & Diseño de Alta Gama (`taste-skill`)
- Selector de **Modo Oscuro / Modo Claro** en la barra superior con persistencia en `localStorage` y detección automática de preferencia del sistema.
- Cifras con números tabulares (`font-variant-numeric: tabular-nums`) para evitar movimientos visuales en cifras financieras.
- Feedback táctil instantáneo (`active:scale-95`) y paleta slate refinada.
- Impresión térmica blindada en blanco y negro puro para impresoras térmicas.

---

# 🛠️ Catálogo de Skills para el Asistente de IA (.agent/skills)

Este proyecto incorpora un sistema de **Skills** (directivas de ingeniería técnica) que guían al asistente de inteligencia artificial para asegurar ediciones quirúrgicas, alta fidelidad visual y cero regresiones.

```text
.agent/
└── skills/
    ├── taste-skill/              # 🎯 Anti-slop UI, diseño visual de alta gama y modo oscuro
    │   └── SKILL.md
    ├── minimal-changes/          # ✂️ Modificaciones mínimas y quirúrgicas
    │   └── SKILL.md
    ├── clean-ui-tailwind/        # 🎨 Interfaz de usuario limpia y Tailwind CSS
    │   └── SKILL.md
    ├── defensive-backend/        # 🛡️ Backend defensivo y validación de entradas
    │   └── SKILL.md
    ├── db-data-integrity/        # 🗄️ Integridad de datos, transacciones ACID y SQLite
    │   └── SKILL.md
    ├── auth-security-guardian/   # 🔐 Seguridad, autenticación JWT y permisos
    │   └── SKILL.md
    ├── cloud-hosting-deploy/     # ☁️ Despliegue en la nube y servidores sin Docker
    │   └── SKILL.md
    ├── docker-deployment/        # 🐳 Contenerización Docker, Compose y VPS con SSL
    │   └── SKILL.md
    └── web-asset-generator/      # 🖼️ Generación de imágenes y assets limpios para web
        └── SKILL.md
```

---

## 📊 Resumen General de Skills

| Skill | Categoría | Triggers (Disparadores) | Propósito Principal |
| :--- | :--- | :--- | :--- |
| **`minimal-changes`** | Calidad de Código | `refactor`, `fix`, `patch`, `minimal` | Parches quirúrgicos; prohíbe reescribir archivos completos innecesariamente. |
| **`taste-skill`** | Frontend / Estilo | `design`, `taste`, `ui`, `dark-mode`, `polish` | Estética profesional anti-slop, consistencia de paleta, feedback táctil y tipografía tabular. |
| **`clean-ui-tailwind`** | Frontend / UI | `ui`, `component`, `frontend`, `tailwind` | Interfaces modernas con Tailwind CSS, escala de 4px y diseño adaptable (mobile-first). |
| **`defensive-backend`** | Backend / API | `api`, `backend`, `database`, `controller` | Validación de parámetros entrantes y manejo seguro de errores HTTP sin bloques vacíos. |
| **`db-data-integrity`** | Bases de Datos | `database`, `sql`, `query`, `schema`, `transaction` | Consultas parametrizadas (anti-inyección SQL), transacciones ACID con rollback e índices. |
| **`auth-security-guardian`**| Seguridad / Auth | `auth`, `security`, `permissions`, `jwt`, `env` | Middlewares de protección, prevención de IDOR y gestión estricta de variables de entorno. |
| **`cloud-hosting-deploy`** | Despliegue Cloud | `hosting`, `deploy`, `render`, `railway`, `vercel` | Puerto dinámico (`process.env.PORT`), host `0.0.0.0`, scripts npm y rutas multiplataforma. |
| **`docker-deployment`** | DevOps / Docker | `docker`, `dockerfile`, `compose`, `vps`, `ssl` | Multi-stage Dockerfile, Compose con volúmenes persistentes y VPS con Caddy/Nginx + SSL. |
| **`web-asset-generator`** | Diseño / Assets | `image`, `asset`, `banner`, `hero`, `illustration` | Ratios 16:9 y 1:1, espacio negativo para copy, paletas mate no saturadas y sin marcos falsos. |

---

## 🔍 Detalle de Cada Skill

### 1. `minimal-changes` ✂️
> **Ubicación:** [`.agent/skills/minimal-changes/SKILL.md`](.agent/skills/minimal-changes/SKILL.md)  
> **Objetivo:** Evitar refactorizaciones masivas accidentales o cambios destructivos en el código existente.

* **Reglas clave:**
  1. **Ediciones dirigidas:** Solo modificar las líneas estrictamente necesarias para resolver la incidencia o añadir la funcionalidad.
  2. **Preservar la arquitectura:** Respetar convenciones de nombres, estructura de carpetas y formato previo del proyecto.
  3. **Sin sobreescritura total:** Nunca reemplazar un archivo entero de cientos de líneas si un parche localizado soluciona el problema.

---

### 2. `taste-skill` 🎯
> **Ubicación:** [`.agent/skills/taste-skill/SKILL.md`](.agent/skills/taste-skill/SKILL.md)  
> **Objetivo:** Garantizar acabados de diseño de alta gama, evitando clichés de IA (como gradientes morados genéricos o tarjetas desiguales).

* **Reglas clave:**
  1. **Tipografía con números tabulares:** Utilizar `tabular-nums` en montos y precios para alineación perfecta en cajas.
  2. **Bloqueo de paleta:** Un color de acento principal por pantalla, respetando contraste WCAG AA.
  3. **Respuesta táctil:** Efecto `active:scale-[0.98]` en botones de checkout y selector de billetes.
  4. **Modo Oscuro coordinado:** Fondos oscuros de alta densidad (`#0b0f17`) sin alterar los comprobantes de impresión térmica.

---

### 3. `clean-ui-tailwind` 🎨
> **Ubicación:** [`.agent/skills/clean-ui-tailwind/SKILL.md`](.agent/skills/clean-ui-tailwind/SKILL.md)  
> **Objetivo:** Garantizar que la interfaz de usuario sea moderna, consistente, accesible y responsiva.

* **Reglas clave:**
  1. **Tokens y espaciado consistente:** Utilizar múltiplos de 4 de Tailwind (`p-2`, `p-4`, `p-6`, `gap-4`).
  2. **Estados interactivos obligatorios:** Cada botón, enlace o elemento interactivo debe contar con estilos claros para `hover:`, `focus-visible:` y `disabled:`.
  3. **Diseño Mobile-First:** Diseñar primero para pantallas móviles y escalar con breakpoints (`sm:`, `md:`, `lg:`), verificando que no existan desbordamientos horizontales de pantalla (`overflow`).

---

### 4. `defensive-backend` 🛡️
> **Ubicación:** [`.agent/skills/defensive-backend/SKILL.md`](.agent/skills/defensive-backend/SKILL.md)  
> **Objetivo:** Evitar caídas inesperadas del servidor mediante programación defensiva en endpoints y controladores.

* **Reglas clave:**
  1. **Validación temprana de entradas:** Validar el `body`, `headers` y `query params` antes de invocar cualquier lógica de negocio.
  2. **Manejo seguro de errores:** Prohibido el uso de bloques `catch` vacíos. Responder siempre con códigos de estado HTTP semánticos (`400`, `401`, `404`, `500`) y mensajes seguros.
  3. **Consultas a base de datos seguras:** Comprobar siempre la existencia de registros devueltos y gestionar valores `null` o `undefined` sin romper la ejecución.

---

### 5. `db-data-integrity` 🗄️
> **Ubicación:** [`.agent/skills/db-data-integrity/SKILL.md`](.agent/skills/db-data-integrity/SKILL.md)  
> **Objetivo:** Proteger la coherencia y salud de los datos a nivel de base de datos.

* **Reglas clave:**
  1. **Consultas parametrizadas:** Nunca concatenar valores de usuario en cadenas SQL. Usar siempre sentencias preparadas para prevenir inyecciones SQL.
  2. **Transacciones ACID:** Encapsular operaciones que afecten a múltiples tablas en transacciones atómicas con confirmación explícita (`commit`) y reversión automática en error (`rollback`).
  3. **Integridad referencial:** Configurar llaves foráneas explícitas con políticas de eliminación deliberadas (`ON DELETE RESTRICT` o `ON DELETE CASCADE`) para evitar registros huérfanos.
  4. **Indexación:** Indexar claves foráneas, columnas únicas y campos frecuentemente consultados o filtrados.

---

### 6. `auth-security-guardian` 🔐
> **Ubicación:** [`.agent/skills/auth-security-guardian/SKILL.md`](.agent/skills/auth-security-guardian/SKILL.md)  
> **Objetivo:** Blindar la autenticación, autorización y el manejo de credenciales del proyecto.

* **Reglas clave:**
  1. **Protección de rutas:** Denegar acceso por defecto. Solo las rutas públicas explícitas deben saltarse el middleware de autenticación.
  2. **Control de propiedad (Anti-IDOR):** Verificar que el recurso consultado pertenezca efectivamente al usuario o empresa correspondiente.
  3. **Gestión de variables de entorno:** Ninguna clave privada o secreto puede estar escrita a fuego en el código fuente.
  4. **Seguridad en sesiones y cookies:** Atributos `httpOnly`, `Secure` y `SameSite`.

---

### 7. `cloud-hosting-deploy` ☁️
> **Ubicación:** [`.agent/skills/cloud-hosting-deploy/SKILL.md`](.agent/skills/cloud-hosting-deploy/SKILL.md)  
> **Objetivo:** Preparar el proyecto para despliegue directo en plataformas PaaS (Render, Railway, Vercel) o servidores compartidos sin Docker.

* **Reglas clave:**
  1. **Puerto dinámico:** Usar `const PORT = process.env.PORT || 3000;` y escuchar en `0.0.0.0`.
  2. **Scripts limpios en `package.json`:**
     - `"build"`: Compila el frontend en la carpeta estática (`client/dist`).
     - `"start"`: Ejecuta la aplicación con Node (`node server/index.js`), sin herramientas de desarrollo como `nodemon`.
  3. **Rutas multiplataforma:** Prohibido usar rutas fijas de sistema operativo (como `C:\...`). Utilizar siempre `path.join(__dirname, ...)` o `path.resolve(...)` para compatibilidad total con servidores Linux.
  4. **Archivos estáticos en monolitos:** Servir la carpeta compilada (`express.static`) y proporcionar una ruta de fallback para aplicaciones SPA (`index.html`).

---

### 8. `docker-deployment` 🐳
> **Ubicación:** [`.agent/skills/docker-deployment/SKILL.md`](.agent/skills/docker-deployment/SKILL.md)  
> **Objetivo:** Estandarizar la contenerización profesional para despliegues en servidores dedicados o VPS con Docker y Docker Compose.

* **Reglas clave:**
  1. **Dockerfiles multi-stage:** Separar la etapa de compilación (`builder`) de la etapa de ejecución (`runner`) usando imágenes mínimas (`alpine`) para reducir peso y vulnerabilidades.
  2. **Ejecución sin privilegios:** Configurar el contenedor para correr con usuario no-root (`USER node`).
  3. **Persistencia en Compose:** Declarar volúmenes nombrados para la base de datos para evitar pérdida de información al reiniciar contenedores.
  4. **Proxy Inverso y SSL:** Exponer únicamente puertos `80` y `443` hacia el exterior con certificados SSL automáticos.

---

### 9. `web-asset-generator` 🖼️
> **Ubicación:** [`.agent/skills/web-asset-generator/SKILL.md`](.agent/skills/web-asset-generator/SKILL.md)  
> **Objetivo:** Generar imágenes, banners y mockups limpios, modernos y listos para landing pages y sitios web.

* **Reglas clave:**
  1. **Ratios de aspecto estrictos:** `16:9` para secciones hero y banners principales; `1:1` para tarjetas de características, avatares e iconos.
  2. **Espacio negativo (Copy-Safe):** Diseñar deliberadamente un 30%–45% de espacio libre en un lateral para montar textos y botones CTA sin conflictos de contraste.
  3. **Estética moderna y sin saturación:** Evitar estéticas hiper-saturadas de neón. Favorecer tonos mate, paletas neutras e iluminación suave de estudio.
  4. **Sin marcos falsos de dispositivos:** Renderizar solo el lienzo limpio de la interfaz, sin marcos falsos de ordenadores o teléfonos a menos que se soliciten explícitamente.

---

## 💡 ¿Cómo Funcionan los Triggers y Cómo se Usan las Skills?

### 🤖 1. ¿Cómo funcionan los "Triggers" (Disparadores)?
1. **Inyección en el contexto:** El agente de IA lee permanentemente la lista de skills disponibles en el proyecto junto con su descripción y lista de triggers.
2. **Activación contextual automática:** Cuando solicitas una tarea usando términos afines (ej. *"crea una ruta en la api"*, *"haz el componente de inventario"*), el sistema activa automáticamente las directivas pertinentes.
3. **Carga y cumplimiento estricto:** El asistente adopta las reglas técnicas correspondientes sin necesidad de recordárselas manualmente.

---

### 🚀 2. Las Dos Formas de Usar las Skills

#### Modo A: Activación Automática (Recomendado)
- **Para Frontend:** *"Diseña el componente de tarjeta de precios en el frontend."* *(Dispara: `clean-ui-tailwind` y `taste-skill`).*
- **Para Backend / Base de Datos:** *"Crea el endpoint de compras y actualiza el stock en la base de datos."* *(Dispara: `defensive-backend` y `db-data-integrity`).*
- **Para Despliegues:** *"Prepara la app para desplegar en Render."* *(Dispara: `cloud-hosting-deploy`).*

#### Modo B: Invocación Explícita (Máximo Control y Rigor)
- *"Corrige este error aplicando la skill **minimal-changes** y no toques otros archivos."*
- *"Revisa este controlador con la skill **auth-security-guardian**."*
- *"Mejora el contraste visual aplicando la skill **taste-skill**."*

---

## 📂 Estructura del Proyecto

```text
pos-de-venta/
├── .agent/
│   └── skills/                 # Skills técnicas para el asistente de IA
├── client/
│   ├── public/                 # Archivos estáticos
│   ├── src/
│   │   ├── api/client.js       # Cliente HTTP centralizado para la API
│   │   ├── components/         # Modales, tickets térmicos, navbar y arqueo
│   │   ├── context/AuthContext # Estado global de autenticación y turno de caja
│   │   ├── pages/              # POS, Inventario, Deudores, Compras, Gastos, etc.
│   │   ├── index.css           # Estilos globales Tailwind y soporte Modo Oscuro
│   │   └── App.jsx             # Enrutador principal de la aplicación
│   ├── index.html              # HTML con precarga anti-flicker de tema
│   ├── tailwind.config.js      # Configuración de colores, fuentes y darkMode
│   └── vite.config.js          # Configuración del bundler Vite
├── server/
│   ├── data/
│   │   └── pos.sqlite          # Base de datos SQLite autónoma y persistente
│   ├── db/
│   │   ├── index.js            # Conector sql.js (WebAssembly) con transacciones ACID
│   │   ├── schema.js           # Esquema relacional con llaves foráneas e índices
│   │   └── seed.js             # Datos iniciales (usuarios, productos, categorías)
│   ├── middleware/             # Verificación de JWT y roles
│   ├── routes/                 # Rutas de ventas, inventario, deudores, caja, etc.
│   └── index.js                # Servidor Express (escucha en 0.0.0.0:3000)
├── docker-compose.yml          # Orquestador Docker Compose para producción
├── Dockerfile                  # Multi-stage build optimizado
├── Guia_Maestra_Desarrollo.pdf # Guía técnica imprimible para desarrollo futuro
├── package.json                # Dependencias y scripts de ejecución
└── README.md                   # Documentación oficial del proyecto
```

---

<p align="center">
  <strong>KiroPOS</strong> • Desarrollado con los más altos estándares de calidad e ingeniería de software.
</p>
