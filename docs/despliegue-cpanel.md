# Despliegue en cPanel

Este proyecto no es un sitio estatico: necesita un servidor Node.js activo, acceso a MySQL y variables de entorno.

## Requisitos del hosting

- cPanel con **Application Manager** o **Setup Node.js App** habilitado.
- Node.js **20.9 o superior**.
- MySQL 8 o una base compatible accesible desde la cuenta.
- Acceso para subir archivos y ejecutar comandos desde Terminal o SSH.

Si tu plan solo permite subir archivos a `public_html` y no ofrece Node.js, este proyecto no podra ejecutarse ahi sin cambiar de hosting o arquitectura.

## 1. Crear la base de datos

En cPanel:

1. Abre **Database Wizard** o **MySQL Database Wizard**.
2. Crea una base, por ejemplo `usuario_sicop`.
3. Crea un usuario, por ejemplo `usuario_sicop_user`.
4. Dale **ALL PRIVILEGES** sobre la base.

Guarda estos datos:

- nombre completo de la base
- usuario completo
- contrasena
- host de base de datos, normalmente `localhost`

## 2. Preparar variables de entorno

Configura estas variables en la aplicacion Node.js de cPanel:

```env
NODE_ENV=production
DATABASE_URL=mysql://USUARIO:CLAVE@localhost:3306/BASE
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=una-clave-larga-y-aleatoria
UPLOAD_MAX_MB=10
RATE_LIMIT_LOGIN=5
LOG_LEVEL=info
TZ=America/Lima
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_EMAIL=admin@tu-dominio.com
SEED_ADMIN_PASSWORD=CAMBIA_ESTA_CLAVE
```

Para generar `NEXTAUTH_SECRET`, puedes usar:

```bash
openssl rand -base64 32
```

## 3. Subir el proyecto

Sube el proyecto a una carpeta fuera de `public_html`, por ejemplo:

```text
/home/USUARIO/sicop
```

No subas:

- `.next`
- `node_modules`
- `.env`
- archivos Excel de prueba si no los necesitas en produccion

Si subes por ZIP, descomprimelo en esa carpeta.

## 4. Registrar la app Node.js

En cPanel:

1. Ve a **Application Manager** o **Setup Node.js App**.
2. Crea una app apuntando a la carpeta del proyecto.
3. Usa el dominio o subdominio deseado.
4. Selecciona Node.js 20 o 22 si esta disponible.
5. Define como archivo de inicio:

```text
server.js
```

6. Agrega las variables de entorno del paso 2.

## 5. Instalar y construir

Desde Terminal o SSH, dentro de la carpeta del proyecto:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm run prisma:seed
```

Si ya existe un administrador real en produccion, ejecuta el seed solo una vez o ajusta primero sus datos.

## 6. Reiniciar la aplicacion

Desde cPanel, reinicia o despliega la app.

Luego prueba:

```text
https://tu-dominio.com/api/health
https://tu-dominio.com/login
```

## 7. Primera carga de datos

Puedes cargar un Excel desde el panel administrativo o por terminal:

```bash
npm run import:excel -- archivo.xlsx
```

## Problemas comunes

### El hosting solo tiene Node.js 18

La version actual del proyecto usa Next.js 16, que requiere Node.js 20.9 o superior. Debes pedir Node.js 20/22 al proveedor o usar otro servidor.

### La app abre pero falla al consultar datos

Revisa:

- `DATABASE_URL`
- que el usuario MySQL tenga permisos sobre la base
- que ya ejecutaste `npx prisma migrate deploy`

### Error 500 al iniciar

Revisa los logs de la app en la carpeta `logs/` o en el panel de Node.js de cPanel.

### Subidas de Excel fallan

La app usa el directorio temporal del servidor para procesar archivos. Verifica permisos y limites de carga del hosting.
