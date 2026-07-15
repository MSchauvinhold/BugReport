# Bug Report Generator

Una herramienta que armé para mi propio trabajo de QA: cargar bugs bien redactados en segundos, generar casos de prueba, y tener las métricas del proyecto a mano sin tener que armar un Excel a mano cada vez que alguien pregunta "¿cómo venimos?".

La idea nació de un problema muy concreto. Reportar bugs es tedioso: siempre los mismos campos, siempre repitiendo el mismo formato, y después copiar y pegar a mano para Jira, para el mail, para Slack. Quería algo donde escribo lo que vi en dos líneas y me queda un reporte prolijo, exportable a donde haga falta.

![Panel de métricas del proyecto](docs/dashboard.png)

## Qué hace

- **Reportes de bug con ayuda de IA.** Escribís la descripción informal ("el botón de guardar no hace nada en Firefox cuando el título está vacío") y te arma el reporte completo: título, severidad, prioridad, pasos para reproducir, resultado esperado vs. actual, ambiente y módulo. Después lo editás si hace falta.
- **Casos de prueba automáticos.** A partir de una funcionalidad o user story genera entre 4 y 8 casos (camino feliz, casos límite, validaciones, negativos). Los podés guardar en el proyecto y llevarles el estado: *Pendiente / Pasó / Falló / Bloqueado*.
- **Del caso que falla al bug, sin recargar nada.** Si un caso queda en *Falló*, con un click abrís un formulario de bug ya precargado con el título y los pasos de ese caso. El loop de QA de todos los días.
- **Dashboard del proyecto.** Bugs por severidad, por estado y por módulo, cuántos quedan sin resolver vs. cerrados, y la tendencia de las últimas 8 semanas. Sirve para reportar el estado de calidad sin pelearse con una planilla.
- **Ciclo de vida del defecto.** Los estados siguen el flujo real de QA: *Nuevo → Asignado → Corregido → Cerrado*, con *Reabierto* cuando una corrección falla.
- **Exportación a varios formatos.** Markdown, Jira Wiki Markup y texto plano. Copiás y pegás donde lo necesites.
- **Export a PDF.** Vista limpia y lista para imprimir/guardar como PDF, con la evidencia incluida. Para adjuntar a un mail o un documento formal.
- **Búsqueda global (⌘K).** Atajo de teclado para saltar a cualquier bug (por título o ID) o proyecto sin navegar.
- **Duplicar bugs.** Para esos casos parecidos que solo cambian en un detalle: duplicás y editás lo poco que difiere.
- **Historial de cambios.** Cada bug guarda quién cambió el estado y cuándo. Un pequeño audit trail que le da seriedad.
- **Evidencia.** Subís screenshots que quedan asociados al bug (se guardan en Cloudinary).
- **Modo claro y oscuro.**

## Capturas

|  |  |
|---|---|
| ![Lista de proyectos](docs/projects.png) | ![Formulario de bug](docs/bug-form.png) |
| ![Detalle del bug](docs/bug-detail.png) | ![Casos de prueba](docs/test-cases.png) |

Y la búsqueda con ⌘K:

![Búsqueda global](docs/command-palette.png)

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **Prisma 7** + **Neon PostgreSQL** (con el driver adapter `@prisma/adapter-neon`)
- **Anthropic SDK** (Claude Sonnet) para generar bugs y casos de prueba, con salida estructurada por JSON Schema
- **Cloudinary** para la evidencia
- **Zustand** para el estado del formulario
- Autenticación propia basada en sesiones (scrypt + cookie `httpOnly` + tabla `Session`), sin librerías de auth de terceros

## Autenticación y usuarios

La app es multiusuario: cada uno entra con usuario y contraseña y ve **solo sus proyectos**. No hay registro público — las cuentas se crean con un script:

```bash
npm run create-user -- <usuario> <contraseña>
# ejemplo:
npm run create-user -- mateo "MiClaveSegura"
```

Algunas decisiones que me importaban:

- Las contraseñas se guardan hasheadas con **scrypt**, nunca en texto plano.
- La sesión vive en una cookie `httpOnly` + la tabla `Session`, así se puede revocar borrando la fila. Dura 30 días.
- Toda la data está scopeada por `userId`: si alguien mete la URL de un recurso ajeno, recibe un 404. No hay forma de ver bugs de otro usuario.

## Variables de entorno

Creá un archivo `.env` en la raíz con:

```bash
# Neon PostgreSQL — el connection string lo copiás del dashboard de Neon
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Anthropic — para la generación con IA (https://console.anthropic.com)
ANTHROPIC_API_KEY="tu_api_key"

# Cloudinary — están en https://cloudinary.com/console
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="tu_api_key"
CLOUDINARY_API_SECRET="tu_api_secret"
```

> El `.env` está en el `.gitignore`. No subas claves al repo.

## Cómo correrlo local

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el .env con las variables de arriba

# 3. Aplicar las migraciones
npx prisma migrate dev

# 4. Crear tu primer usuario
npm run create-user -- tu_usuario "tu_contraseña"

# 5. Levantar el server
npm run dev
```

Queda andando en [http://localhost:3000](http://localhost:3000).

## Estructura

```
app/
  actions/          # Server Actions (proyectos, bugs, casos de prueba)
  api/
    ai/             # Endpoints de generación con IA (bug y casos de prueba)
    search/         # Búsqueda global (⌘K)
    upload/         # Subida de evidencia a Cloudinary
  projects/
    [id]/
      dashboard/    # Métricas del proyecto
      test-cases/   # Generar y gestionar casos de prueba
      bugs/
        [bugId]/     # Detalle + exportación + historial
          print/     # Vista imprimible / PDF
        new/         # Nuevo bug (también duplicar y "desde caso")
      edit/          # Editar/eliminar proyecto
  generated/prisma/ # Cliente Prisma generado (no se toca a mano)

components/          # Componentes React
lib/
  ai.ts             # Prompts + schemas de la generación con IA
  auth.ts           # Sesiones, getCurrentUser, requireUser
  prisma.ts         # PrismaClient con el adapter de Neon
  exporters.ts      # Markdown / Jira / texto plano
  store/            # Stores de Zustand (formulario, toasts)

prisma/
  schema.prisma     # Modelos: User, Session, Project, Bug, BugEvent, TestCase
```

## Formatos de exportación

| Formato | Dónde lo pegás |
|---------|----------------|
| **Markdown** | GitHub Issues, GitLab, descripción de tarjeta en Trello |
| **Jira Wiki Markup** | Campo descripción al crear un issue en Jira |
| **Texto plano** | Slack, mail, cualquier editor |
| **PDF** | Vista imprimible con evidencia, para adjuntar |

## Deploy en Vercel

1. Subí el repo a GitHub.
2. Creá un proyecto en [vercel.com](https://vercel.com) y conectá el repo.
3. En **Settings → Environment Variables** cargá:
   - `DATABASE_URL` — connection string **pooled** de Neon (termina en `-pooler`)
   - `DIRECT_URL` — connection string **directo** de Neon (sin `-pooler`, lo usan las migraciones)
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Deploy.

No hace falta tocar el build command. El `package.json` ya trae:

```json
"build": "prisma generate && prisma migrate deploy && next build"
```

En cada deploy se genera el cliente Prisma y se aplican las migraciones pendientes solas. La primera vez crea las tablas; después solo aplica lo nuevo. El `postinstall` corre `prisma generate` para que el cliente esté disponible tras el `npm install` del build.

---

Hecho por Mateo. Si tenés feedback o se te ocurre algo para sumarle, escribime.
