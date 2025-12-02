# PathXpress Driver Backend API

Backend API para la aplicación de conductor PathXpress.

## 🚀 Configuración Inicial

### 1. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `backend`:

```bash
# Database
DATABASE_URL="mysql://root:TU_PASSWORD@localhost:3306/pathxpress_driver"

# JWT
JWT_SECRET="cambia-esto-por-una-clave-super-secreta-y-larga"
JWT_EXPIRES_IN="7d"

# Cloudinary (Regístrate en cloudinary.com)
CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="tu_api_key"
CLOUDINARY_API_SECRET="tu_api_secret"

# Server
PORT=3000
NODE_ENV="development"
```

### 2. Crear la base de datos en MySQL

Abre **MySQL Workbench** y ejecuta:

```sql
CREATE DATABASE pathxpress_driver CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Ejecutar migraciones de Prisma

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 4. Crear un conductor de prueba

Ejecuta el servidor y luego haz una petición POST para crear un conductor:

```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "driver",
  "password": "12345",
  "fullName": "Conductor de Prueba",
  "email": "driver@pathxpress.com",
  "phone": "+971501234567",
  "vehicleNumber": "DXB-4523"
}
```

## 📡 Endpoints Disponibles

### Autenticación
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registrar conductor

### Rutas
- `GET /api/routes` - Listar rutas del conductor
- `GET /api/routes/:routeId` - Obtener ruta específica
- `PUT /api/routes/:routeId/status` - Actualizar estado de ruta

### Entregas
- `GET /api/deliveries/:id` - Obtener entrega
- `PUT /api/deliveries/:id/status` - Actualizar estado + foto

### Reportes
- `POST /api/reports` - Crear reporte
- `GET /api/reports` - Listar reportes
- `GET /api/reports/:id` - Ver reporte específico

## 🎯 Comandos NPM

```bash
npm run dev          # Iniciar en modo desarrollo
npm run build        # Compilar TypeScript
npm start            # Ejecutar en producción
npm run prisma:studio # Abrir Prisma Studio (ver BD)
```

## 📦 Registro en Cloudinary

1. Ve a https://cloudinary.com
2. Crea una cuenta gratuita
3. En Dashboard, copia:
   - Cloud Name
   - API Key
   - API Secret
4. Pégalos en tu archivo `.env`

## 🔐 Seguridad

- Cambia `JWT_SECRET` por una clave larga y aleatoria
- Nunca compartas tu archivo `.env`
- En producción, usa variables de entorno del hosting

## 🌐 Deploy en Render

1. Sube tu código a GitHub
2. Crea una cuenta en render.com
3. Conecta tu repositorio
4. Configura las variables de entorno
5. Deploy automático

## 📝 Estructura de Base de Datos

- **drivers** - Conductores
- **routes** - Rutas asignadas
- **deliveries** - Entregas individuales
- **reports** - Reportes de problemas
