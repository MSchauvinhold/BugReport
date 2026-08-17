# Bug Report Generator

Una herramienta que armé para mi trabajo de QA: cargar bugs bien redactados en segundos, llevar los casos de prueba con su estado, y tener las métricas del proyecto a mano sin armar un Excel cada vez que alguien pregunta "¿cómo venimos?".

**🔗 Demo: [bug-report-pied.vercel.app](https://bug-report-pied.vercel.app/)**

La idea nació de algo muy concreto. Reportar bugs es tedioso: siempre los mismos campos, siempre el mismo formato, y después copiar y pegar a mano para Jira, para el mail, para Slack. Quería escribir en dos líneas lo que vi y quedarme con un reporte prolijo, guardado y exportable a donde haga falta.

![Panel de métricas del proyecto](docs/dashboard.png)

## Qué hace

**Escribís en lenguaje natural, sale un reporte estándar.** Le tirás "en el checkout, si el cliente no tiene CUIT, al confirmar tira 500" y te arma título, descripción, pasos para reproducir, resultado esperado vs. actual, severidad, prioridad, ambiente, módulo y hasta una hipótesis de causa raíz. Después lo revisás y lo corregís — el borrador es un punto de partida, no la última palabra.

**Los estados siguen el ciclo de vida real de un defecto:** Nuevo → Asignado → Corregido → Cerrado, con *Reabierto* para cuando una corrección no funcionó. Cada cambio queda registrado en el historial del bug con quién lo hizo y cuándo.

**Casos de prueba que viven en el proyecto.** Se generan a partir de una user story (camino feliz, casos límite, validaciones, negativos) y se guardan con su estado: *Pendiente / Pasó / Falló / Bloqueado*. Si uno falla, de ahí sale un bug ya precargado con el título y los pasos. Esa trazabilidad caso → falla → bug es la parte que más uso.

**Un panel que responde lo que siempre te preguntan:** cuántos críticos siguen sin resolver, hace cuánto están abiertos en promedio, qué porcentaje de las correcciones terminó reabierto, y cómo viene la carga de bugs semana a semana.

**Exportá a donde lo necesites.** Markdown (con secciones y emojis, listo para pegar en un issue), Jira Wiki Markup, texto plano y PDF con la evidencia incluida. Copiás o descargás el archivo.

También tiene búsqueda global con ⌘K, duplicar bugs para los casos parecidos, edición de bugs cargados, evidencia en imágenes y modo claro/oscuro.

## Capturas

| Listado de bugs | Detalle con historial |
|---|---|
| ![Listado de bugs](docs/bugs.png) | ![Detalle del bug](docs/bug-detail.png) |

| Casos de prueba | Asistente de redacción |
|---|---|
| ![Casos de prueba](docs/test-cases.png) | ![Asistente de IA](docs/ai-assist.png) |

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **Prisma 7** + **Neon PostgreSQL** (driver adapter `@prisma/adapter-neon`)
- **Anthropic SDK** (Claude Sonnet) con salida estructurada por JSON Schema
- **Cloudinary** para la evidencia
- **Zustand** para el estado del formulario
- Autenticación propia por sesiones (scrypt + cookie `httpOnly` + tabla `Session`), sin librerías de terceros

## Autenticación y usuarios

Es multiusuario: cada uno ve **solo sus proyectos**. No hay registro público, las cuentas se crean por script:

```bash
npm run create-user -- <usuario> <contraseña>
```

Tres decisiones que me importaban:

- Las contraseñas van hasheadas con **scrypt**, nunca en texto plano.
- La sesión vive en una cookie `httpOnly` + la tabla `Session`, así se puede revocar borrando la fila. Dura 30 días.
- Todo está scopeado por `userId`: si alguien mete la URL de un recurso ajeno, recibe un 404.

## Variables de entorno

Creá un `.env` en la raíz:

```bash
# Neon PostgreSQL — el connection string sale del dashboard de Neon
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Anthropic — para la generación con IA (https://console.anthropic.com)
ANTHROPIC_API_KEY="tu_api_key"

# Cloudinary — https://cloudinary.com/console
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="tu_api_key"
CLOUDINARY_API_SECRET="tu_api_secret"
```

> El `.env` está en el `.gitignore`. No subas claves al repo.

## Cómo correrlo local

```bash
npm install                                  # 1. dependencias
# 2. creá el .env con las variables de arriba
npx prisma migrate dev                       # 3. migraciones
npm run create-user -- tu_usuario "tu_clave" # 4. tu primer usuario
npm run dev                                  # 5. a andar
```

Queda en [http://localhost:3000](http://localhost:3000).

## Estructura

```
app/
  actions/          # Server Actions (proyectos, bugs, casos de prueba)
  api/
    ai/             # Generación con IA (bugs y casos de prueba)
    search/         # Búsqueda global (⌘K)
    upload/         # Evidencia a Cloudinary
  login/            # Pantalla de acceso
  projects/[id]/
    dashboard/      # Métricas del proyecto
    test-cases/     # Generar y gestionar casos de prueba
    bugs/
      [bugId]/      # Detalle + exportación + historial
        edit/       # Editar el bug
        print/      # Vista imprimible / PDF
      new/          # Nuevo bug (también duplicar y "desde caso")
    edit/           # Editar/eliminar proyecto

lib/
  ai.ts             # Prompts + schemas de la generación
  auth.ts           # Sesiones, getCurrentUser, requireUser
  bugStatus.ts      # Ciclo de vida del defecto (estados, colores, validación)
  exporters.ts      # Markdown / Jira / texto plano
  prisma.ts         # PrismaClient con el adapter de Neon
  store/            # Zustand (formulario, toasts)

prisma/
  schema.prisma     # User, Session, Project, Bug, BugEvent, TestCase
```

## Formatos de exportación

| Formato | Dónde lo pegás |
|---|---|
| **Markdown** | GitHub Issues, GitLab, tarjeta de Trello |
| **Jira Wiki Markup** | Campo descripción al crear el issue |
| **Texto plano** | Slack, mail, cualquier editor |
| **PDF** | Vista imprimible con evidencia, para adjuntar |

## Deploy en Vercel

1. Subí el repo a GitHub y conectalo en [vercel.com](https://vercel.com).
2. En **Settings → Environment Variables** cargá `DATABASE_URL` (el connection string **pooled**, termina en `-pooler`), `DIRECT_URL` (el **directo**, sin `-pooler`, lo usan las migraciones), `ANTHROPIC_API_KEY` y las tres de Cloudinary.
3. Deploy.

No hace falta tocar el build command. El `package.json` ya trae:

```json
"build": "prisma generate && prisma migrate deploy && next build"
```

En cada deploy se genera el cliente Prisma y se aplican las migraciones pendientes solas. El `postinstall` corre `prisma generate` para que el cliente esté disponible después del `npm install` del build.

---

Hecho por **Mateo Schauvinhold**. Si tenés feedback o se te ocurre algo para sumarle, escribime por [LinkedIn](https://www.linkedin.com/).
