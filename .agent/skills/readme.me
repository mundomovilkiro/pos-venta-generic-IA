# 🛠️ Catálogo de Skills para el Asistente de IA (.agent/skills)

Bienvenido a la documentación oficial del conjunto de **Skills** (habilidades y directivas técnicas) configuradas para el agente de desarrollo en este proyecto.

Este documento explica de forma clara, detallada y estructurada qué hace cada skill, cuándo se activa y qué reglas de ingeniería garantiza.

---

## 📌 ¿Qué es una Skill y cómo funciona?

Una **Skill** es un archivo de instrucciones especializadas (`SKILL.md`) ubicado dentro de `.agent/skills/<nombre-skill>/`.
Cada archivo contiene:
1. **Metadatos YAML (Frontmatter):** Define el nombre, una descripción precisa y los disparadores (`triggers`) que activan automáticamente la skill según la tarea o palabras clave del usuario.
2. **Directivas de ingeniería:** Reglas y estándares de buenas prácticas que el agente debe respetar rigurosamente al escribir, modificar o revisar código.

---

## 📂 Estructura de Directorios

```text
.agent/
└── skills/
    ├── auth-security-guardian/   # 🔐 Seguridad, autenticación y permisos
    │   └── SKILL.md
    ├── clean-ui-tailwind/        # 🎨 Interfaz de usuario limpia y Tailwind CSS
    │   └── SKILL.md
    ├── cloud-hosting-deploy/     # ☁️ Despliegue en la nube y cPanel sin Docker
    │   └── SKILL.md
    ├── db-data-integrity/        # 🗄️ Integridad de datos, transacciones y SQL
    │   └── SKILL.md
    ├── defensive-backend/        # 🛡️ Backend defensivo y validación de entradas
    │   └── SKILL.md
    ├── docker-deployment/        # 🐳 Contenerización Docker, Compose y VPS con SSL
    │   └── SKILL.md
    ├── minimal-changes/          # ✂️ Modificaciones mínimas y quirúrgicas
    │   └── SKILL.md
    └── web-asset-generator/      # 🖼️ Generación de imágenes y assets limpios para web
        └── SKILL.md
```

---

## 📊 Resumen General de Skills

| Skill | Categoría | Triggers (Disparadores) | Propósito Principal |
| :--- | :--- | :--- | :--- |
| **`minimal-changes`** | Calidad de Código | `refactor`, `fix`, `patch` | Parches quirúrgicos; prohíbe reescribir archivos completos innecesariamente. |
| **`clean-ui-tailwind`** | Frontend / UI | `ui`, `component`, `frontend` | Interfaces modernas con Tailwind CSS, escala de 4px y diseño adaptable (mobile-first). |
| **`defensive-backend`** | Backend / API | `api`, `backend`, `database` | Validación de parámetros entrantes y manejo seguro de errores HTTP sin bloques vacíos. |
| **`db-data-integrity`** | Bases de Datos | `database`, `sql`, `query`, `schema`, `migration`, `transaction` | Consultas parametrizadas (anti-inyección SQL), transacciones ACID con rollback e índices. |
| **`auth-security-guardian`**| Seguridad / Auth | `auth`, `security`, `permissions`, `jwt`, `session`, `env` | Middlewares de protección, prevención de IDOR y gestión estricta de variables de entorno. |
| **`cloud-hosting-deploy`** | Despliegue Cloud | `hosting`, `deploy`, `render`, `railway`, `vercel`, `cpanel`, `production` | Puerto dinámico (`process.env.PORT`), host `0.0.0.0`, scripts npm y rutas multiplataforma. |
| **`docker-deployment`** | DevOps / Docker | `docker`, `dockerfile`, `compose`, `vps`, `nginx`, `caddy`, `ssl`, `container` | Multi-stage Dockerfile, Compose con volúmenes persistentes y VPS con Caddy/Nginx + SSL. |
| **`web-asset-generator`** | Diseño / Assets | `image`, `asset`, `banner`, `hero`, `illustration`, `visual` | Ratios 16:9 y 1:1, espacio negativo para copy, paletas mate no saturadas y sin marcos falsos. |

---

## 🔍 Detalle de Cada Skill

### 1. `minimal-changes` ✂️
> **Ubicación:** `.agent/skills/minimal-changes/SKILL.md`  
> **Objetivo:** Evitar refactorizaciones masivas accidentales o cambios destructivos en el código existente.

* **Reglas clave:**
  1. **Ediciones dirigidas:** Solo modificar las líneas estrictamente necesarias para resolver la incidencia o añadir la funcionalidad.
  2. **Preservar la arquitectura:** Respetar convenciones de nombres, estructura de carpetas y formato previo del proyecto.
  3. **Sin sobreescritura total:** Nunca reemplazar un archivo entero de cientos de líneas si un parche localizado soluciona el problema.

---

### 2. `clean-ui-tailwind` 🎨
> **Ubicación:** `.agent/skills/clean-ui-tailwind/SKILL.md`  
> **Objetivo:** Garantizar que la interfaz de usuario sea moderna, consistente, accesible y responsiva.

* **Reglas clave:**
  1. **Tokens y espaciado consistente:** Utilizar múltiplos de 4 de Tailwind (`p-2`, `p-4`, `p-6`, `gap-4`).
  2. **Estados interactivos obligatorios:** Cada botón, enlace o elemento interactivo debe contar con estilos claros para `hover:`, `focus-visible:` y `disabled:`.
  3. **Diseño Mobile-First:** Diseñar primero para pantallas móviles y escalar con breakpoints (`sm:`, `md:`, `lg:`), verificando que no existan desbordamientos horizontales de pantalla (`overflow`).

---

### 3. `defensive-backend` 🛡️
> **Ubicación:** `.agent/skills/defensive-backend/SKILL.md`  
> **Objetivo:** Evitar caídas inesperadas del servidor mediante programación defensiva en endpoints y controladores.

* **Reglas clave:**
  1. **Validación temprana de entradas:** Validar el `body`, `headers` y `query params` antes de invocar cualquier lógica de negocio (usando esquemas de validación).
  2. **Manejo seguro de errores:** Prohibido el uso de bloques `catch` vacíos. Responder siempre con códigos de estado HTTP semánticos (`400`, `401`, `404`, `500`) y mensajes seguros.
  3. **Consultas a base de datos seguras:** Comprobar siempre la existencia de registros devueltos y gestionar valores `null` o `undefined` sin romper la ejecución.

---

### 4. `db-data-integrity` 🗄️
> **Ubicación:** `.agent/skills/db-data-integrity/SKILL.md`  
> **Objetivo:** Proteger la coherencia y salud de los datos a nivel de base de datos.

* **Reglas clave:**
  1. **Consultas parametrizadas:** Nunca concatenar valores de usuario en cadenas SQL. Usar siempre sentencias preparadas o bindings del ORM/query builder para prevenir inyecciones SQL.
  2. **Transacciones ACID:** Encapsular operaciones que afecten a múltiples tablas en transacciones atómicas con confirmación explícita (`commit`) y reversión automática en error (`rollback`).
  3. **Integridad referencial:** Configurar llaves foráneas explícitas con políticas de eliminación deliberadas (`ON DELETE CASCADE` o `ON DELETE RESTRICT`) para evitar registros huérfanos.
  4. **Indexación:** Indexar claves foráneas, columnas únicas y campos frecuentemente consultados o filtrados.

---

### 5. `auth-security-guardian` 🔐
> **Ubicación:** `.agent/skills/auth-security-guardian/SKILL.md`  
> **Objetivo:** Blindar la autenticación, autorización y el manejo de credenciales del proyecto.

* **Reglas clave:**
  1. **Protección de rutas:** Denegar acceso por defecto. Solo las rutas públicas explícitas deben saltarse el middleware de autenticación.
  2. **Control de propiedad (Anti-IDOR):** No basta con verificar que el usuario esté logueado; se debe verificar que el recurso consultado pertenezca efectivamente a su `user_id` o `tenant_id`.
  3. **Gestión de variables de entorno:** Ninguna clave privada o secreto puede estar escrita a fuego (hardcoded) en el código. Validar variables requeridas al arrancar la aplicación.
  4. **Seguridad en sesiones y cookies:** Las cookies de sesión deben tener los atributos `httpOnly`, `Secure` y `SameSite`.

---

### 6. `cloud-hosting-deploy` ☁️
> **Ubicación:** `.agent/skills/cloud-hosting-deploy/SKILL.md`  
> **Objetivo:** Preparar el proyecto para despliegue directo en plataformas PaaS (Render, Railway, Vercel) o cPanel sin depender de contenedores Docker.

* **Reglas clave:**
  1. **Puerto dinámico:** Usar obligatoriamente `const PORT = process.env.PORT || 3000;` y escuchar en `0.0.0.0` para permitir el enrutamiento de proxies inversos.
  2. **Scripts limpios en `package.json`:**
     - `"build"`: Compila el código fuente o frontend en una carpeta estática (`dist`).
     - `"start"`: Ejecuta la aplicación compilada con Node (`node dist/index.js` o `node server.js`), sin herramientas de desarrollo como `nodemon`.
  3. **Rutas multiplataforma:** Prohibido usar rutas fijas de sistema operativo (como `C:\...`). Utilizar siempre `path.join(__dirname, ...)` o `path.resolve(...)` para compatibilidad total entre Windows y servidores Linux.
  4. **Archivos estáticos en monolitos:** Servir la carpeta compilada (`express.static`) y proporcionar una ruta de fallback para aplicaciones SPA (`index.html`).

---

### 7. `docker-deployment` 🐳
> **Ubicación:** `.agent/skills/docker-deployment/SKILL.md`  
> **Objetivo:** Estandarizar la contenerización profesional para despliegues en servidores dedicados o VPS con Docker y Docker Compose.

* **Reglas clave:**
  1. **Dockerfiles multi-stage:** Separar la etapa de compilación (`builder`) de la etapa de ejecución (`runner`) usando imágenes mínimas (`alpine`/`distroless`) para reducir peso y vulnerabilidades.
  2. **Ejecución sin privilegios:** Configurar el contenedor para correr con un usuario no-root (`USER node`).
  3. **Persistencia en Compose:** Declarar volúmenes nombrados para bases de datos para evitar pérdida de información al reiniciar o actualizar contenedores.
  4. **Orquestación y Healthchecks:** Usar `healthcheck` y `depends_on: { condition: service_healthy }` para asegurar que el backend espere a que la base de datos esté lista antes de arrancar.
  5. **Proxy Inverso y SSL:** Exponer únicamente puertos `80` y `443` hacia el exterior, gestionando certificados SSL automáticos con Caddy o Nginx + Certbot.

---

### 8. `web-asset-generator` 🖼️
> **Ubicación:** `.agent/skills/web-asset-generator/SKILL.md`  
> **Objetivo:** Generar imágenes, banners y mockups limpios, modernos y listos para landing pages y sitios web.

* **Reglas clave:**
  1. **Ratios de aspecto estrictos:** `16:9` para secciones hero y banners principales; `1:1` para tarjetas de características, avatares e iconos.
  2. **Espacio negativo (Copy-Safe):** Diseñar deliberadamente un 30%–45% de espacio libre o sutil en un lateral para montar textos, títulos y botones CTA sin conflictos de contraste.
  3. **Estética moderna y sin saturación:** Evitar estéticas hiper-saturadas de neón o brillos plásticos artificiales. Favorecer tonos mate, paletas neutras (pizarra, grises cálidos) e iluminación suave de estudio.
  4. **Sin marcos falsos de dispositivos:** Prohibido añadir marcos 3D de ordenadores portátiles, teléfonos inclinados o manos sosteniendo pantallas a menos que se solicite explícitamente. Renderizar solo el lienzo limpio de la interfaz.

---

## 💡 ¿Cómo funcionan los Triggers y cómo se usan las Skills?

### 🤖 1. ¿Cómo funcionan los "Triggers" (Disparadores)?

**¡Sí se ejecutan solas!** Pero es importante entender **cómo y cuándo**:

1. **Inyección en el contexto:** El agente de IA (Antigravity) lee permanentemente la lista de skills disponibles en el proyecto junto con su descripción y lista de `triggers`.
2. **Activación contextual automática:** Cuando tú le escribes al asistente una petición natural como:
   > *"Genera un banner hero para una cafetería"* o *"Crea una photo para el perfil"*
   El sistema de la IA reconoce los términos clave (como `banner`, `photo`, `hero`, `image`) definidos en `triggers`.
3. **Carga y cumplimiento estricto:** Al activarse el disparador, el agente consulta internamente el archivo [`SKILL.md`](file:///c:/Users/kiro/Documents/kiro/prueba/.agent/skills/web-asset-generator/SKILL.md) correspondiente y adopta **automáticamente** todas sus directivas (en este caso: ratio 16:9, sin texto distorsionado, formato WebP, espacio negativo, etc.) sin que tengas que recordarle cada regla a mano.

---

### 🚀 2. Las Dos Formas de Usar las Skills

#### Modo A: Activación Automática (Recomendado / Flujo Natural)
Solo describe lo que necesitas usando palabras afines a la tarea. Los triggers harán que la IA adopte las reglas por sí sola:

* **Para Imágenes / UI:**
  - *"Crea una **photo** y un **banner** para el landing page de mi producto."*  
    *(Dispara: `web-asset-generator` -> generará formato 16:9, tonos mate, sin textos deformes incrustados).*
* **Para Frontend:**
  - *"Diseña el **component** de tarjeta de precios en el **frontend**."*  
    *(Dispara: `clean-ui-tailwind` -> aplicará múltiplos de 4, hover/focus states y mobile-first).*
* **Para Backend / Base de Datos:**
  - *"Haz el endpoint de la **api** para crear pedidos y guarda en la **database**."*  
    *(Dispara: `defensive-backend` y `db-data-integrity` -> validará inputs, usará transacciones ACID y consultas parametrizadas).*
* **Para Despliegues:**
  - *"Prepara la app para desplegar en **Render**"* o *"Crea el archivo **dockerfile** y **compose**"*.  
    *(Dispara: `cloud-hosting-deploy` o `docker-deployment` -> usará process.env.PORT dinámico, multi-stage, non-root, etc.).*

---

#### Modo B: Invocación Explícita (Máximo Control y Rigor)
Si quieres asegurarte al 100% de que la IA aplique una directiva estricta en una tarea crítica o delicada, puedes invocar la skill directamente por su nombre:

* **Ejemplo 1 (Surgical fix / Sin romper código):**
  > *"Corrige este error en login.js aplicando la skill **minimal-changes**."*  
  *(La IA tendrá prohibido reescribir todo el archivo y solo modificará las 2 líneas del bug).*

* **Ejemplo 2 (Seguridad y permisos):**
  > *"Revisa este controlador con la skill **auth-security-guardian**."*  
  *(La IA auditará que se verifique la propiedad del usuario sobre el registro para evitar IDOR y revisará tokens/env).*

* **Ejemplo 3 (Despliegue en VPS):**
  > *"Configura el despliegue con la skill **docker-deployment** y proxy SSL con Caddy."*  
  *(La IA creará la arquitectura multi-stage, docker-compose con volúmenes nombrados y Caddyfile).*

---

### 🧪 Ejemplos Prácticos de Prompts de Usuario

| Lo que quieres hacer | Prompt sugerido que activa la skill | Skill activada | Resultado asegurado |
| :--- | :--- | :--- | :--- |
| **Generar banner de cabecera** | *"Crea un hero banner para la portada web"* | [`web-asset-generator`](file:///c:/Users/kiro/Documents/kiro/prueba/.agent/skills/web-asset-generator/SKILL.md) | Formato 16:9 o 21:9, espacio negativo lateral, guardado en `public/images/`. |
| **Crear botón o card UI** | *"Crea el componente de Card de producto en React"* | [`clean-ui-tailwind`](file:///c:/Users/kiro/Documents/kiro/prueba/.agent/skills/clean-ui-tailwind/SKILL.md) | Estilos con clases Tailwind, estados `:hover` y `:disabled`, espaciado coherente. |
| **Hacer consulta SQL segura** | *"Crea la función para transferir saldo entre dos cuentas"* | [`db-data-integrity`](file:///c:/Users/kiro/Documents/kiro/prueba/.agent/skills/db-data-integrity/SKILL.md) | Transacción SQL con commit/rollback, bloqueo de saldo y queries parametrizadas. |
| **Añadir endpoint privado** | *"Crea la ruta para descargar las facturas de un usuario"* | [`auth-security-guardian`](file:///c:/Users/kiro/Documents/kiro/prueba/.agent/skills/auth-security-guardian/SKILL.md) | Middleware de sesión + comprobación de que la factura pertenezca a `req.user.id`. |
| **Corregir un pequeño bug** | *"Aplica minimal-changes y arregla la validación de email"* | [`minimal-changes`](file:///c:/Users/kiro/Documents/kiro/prueba/.agent/skills/minimal-changes/SKILL.md) | Modificación exclusiva de la línea con la regex o comprobación, sin tocar nada más. |

---

*Documentación generada y mantenida automáticamente para el entorno de desarrollo.*
