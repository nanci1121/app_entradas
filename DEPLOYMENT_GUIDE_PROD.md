# 🚀 Guía de Despliegue a Producción (Método Imagen Compilada)

Esta guía detalla el proceso para llevar la aplicación al nuevo servidor **empaquetando la imagen Docker** localmente y transfiriéndola. Esto garantiza que exactamente lo que validas aquí es lo que corre allá.

## 📋 Resumen del Proceso

1.  **Origen (.12)**: Compilar App, Crear Imagen Docker, Exportar Imagen, Exportar Datos.
2.  **Transferencia**: Copiar archivos al nuevo servidor.
3.  **Destino (Nuevo)**: Cargar Imagen, Levantar Base de Datos, Importar Datos, Arrancar App.

---

## 📍 Fase A: En el Servidor Actual (Origen)

### 1. Validar y Construir la Imagen
Asegúrate de estar en la raíz de `ServidorAppEntradas`.

```bash
# 1. Compilar TypeScript y asegurar que no hay errores
npm ci
npm run build

# 2. Construir la imagen de Docker (etiqueta: srv_alpine:prod)
# Nota: Usamos el Dockerfile de producción
docker build -t srv_alpine:prod -f prod/Dockerfile .
```

### 2. Exportar la Imagen a un Archivo
En lugar de compilar en el otro servidor, guardamos la imagen ya compilada.

```bash
# Esto creará un archivo grande (~200MB - 1GB)
docker save srv_alpine:prod | gzip > app_production_image.tar.gz
```

### 3. Exportar los Datos (Solo Datos)
Como la estructura de BD es nueva, exportamos solo la data.

```bash
# Exportar datos excluyendo la tabla nueva vacía (salidas_tornos) y esquemas
pg_dump -h 10.192.92.12 -U vmv \
  --data-only \
  --column-inserts \
  --disable-triggers \
  --exclude-table=salidas_tornos \
  firstapi > datos_migracion.sql
```

### 4. Preparar Archivos de Configuración
Empaquetamos el docker-compose y las variables de entorno.

```bash
# Crear carpeta para envío
mkdir -ppaquete_despliegue
cp prod/docker-compose.yml paquete_despliegue/
cp .env paquete_despliegue/.env  # Asegúrate de revisar claves antes
cp datos_migracion.sql paquete_despliegue/
mv app_production_image.tar.gz paquete_despliegue/

# Comprimir todo para enviar
tar czf deploy_pack.tar.gz paquete_despliegue/
```

---

## 🚚 Fase B: Transferencia

Envía el paquete al nuevo servidor.

```bash
scp deploy_pack.tar.gz usuario@nuevo-servidor:/home/usuario/
```

---

## 📍 Fase C: En el Nuevo Servidor (Destino)

### 1. Preparar el Entorno
Conéctate por SSH y descomprime.

```bash
ssh usuario@nuevo-servidor
tar xzf deploy_pack.tar.gz
cd paquete_despliegue
```

### 2. Ajustar `docker-compose.yml` (CRÍTICO)
El `docker-compose.yml` original monta el código fuente (`volumes: - ../app:/app`). **Esto debe eliminarse** porque estamos usando una imagen autocontenida y no copiaremos el código fuente `app/` al servidor nuevo.

Edita el archivo:
```bash
nano docker-compose.yml
```

**Modificación necesaria:**
Busca la sección `volumes` del servicio `app` y **elimina o comenta** las líneas de mapeo de código, dejando solo volúmenes de datos si los hubiera (en este caso, probablemente ninguno sea necesario para la app, solo para la DB).

```yaml
  app:
    image: srv_alpine:prod
    # ... otros ajustes ...
    # ELIMINAR ESTO:
    # volumes:
    #   - ../app:/app
    #   - /app/node_modules
```

Asegúrate también de revisar user/pass e IPs en `.env`.

### 3. Cargar la Imagen Docker
Importa la imagen que construimos en el origen.

```bash
gunzip -c app_production_image.tar.gz | docker load
# Debería decir: Loaded image: srv_alpine:prod
```

### 4. Iniciar Base de Datos e Importar Datos

```bash
# 1. Levantar solo la DB
docker compose up -d db

# 2. Esperar a que esté lista (healthcheck healthy)
docker compose ps db

# 3. Limpiar datos por defecto (si la imagen postgres creó algo) y asegurar estado limpio
# Opcional si es primera vez, pero recomendado
docker compose exec db psql -U vmv -d firstapi -c "TRUNCATE users, empresas_exteriores, entradas_vehiculos CASCADE;"

# 4. Importar los datos antiguos
cat datos_migracion.sql | docker compose exec -T db psql -U vmv -d firstapi
```

### 5. Iniciar la Aplicación

```bash
docker compose up -d app
```

### 6. Verificación Final

```bash
# Ver logs
docker compose logs -f app

# Probar conexión (desde el servidor)
curl http://localhost:7202/api/ping
```
