# 📦 Guía de Migración al Nuevo Servidor

Esta guía proporciona un checklist paso a paso para migrar la aplicación al nuevo servidor de forma segura.

## ✅ Checklist Pre-Migración

### En el Servidor Origen

- [ ] Hacer backup completo de la base de datos
- [ ] Verificar que no hay operaciones críticas en curso
- [ ] Documentar puertos y configuraciones actuales
- [ ] Exportar variables de entorno actuales

### En el Servidor Destino

- [ ] Docker y Docker Compose instalados
- [ ] Puertos necesarios disponibles (7202)
- [ ] Firewall configurado correctamente
- [ ] Suficiente espacio en disco (mínimo 10GB)
- [ ] Acceso SSH configurado

---

## 🔄 Proceso de Migración

### 1. Preparar el Servidor Destino

```bash
# Conectar al nuevo servidor
ssh usuario@nuevo-servidor

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Cerrar sesión y volver a conectar para aplicar permisos
exit
ssh usuario@nuevo-servidor

# Verificar instalación
docker --version
docker compose version
```

### 2. Backup de Base de Datos (Servidor Origen)

```bash
# Conectar al servidor origen
ssh usuario@servidor-origen
cd /ruta/ServidorAppEntradas

# Opción A: Si Postgres está en Docker
docker compose -f prod/docker-compose.yml exec -T db pg_dump -U vmv firstapi > backup_$(date +%Y%m%d_%H%M%S).sql

# Opción B: Si Postgres está nativo
pg_dump -U vmv -h localhost -p 7200 firstapi > backup_$(date +%Y%m%d_%H%M%S).sql

# Comprimir backup
gzip backup_*.sql

# Verificar tamaño del backup
ls -lh backup_*.sql.gz
```

### 3. Transferir Archivos al Servidor Destino

```bash
# En el servidor origen
cd /ruta/ServidorAppEntradas

# Crear tarball del código
tar czf app-codigo.tar.gz app/ prod/ docker-compose.yml .env.example

# Transferir código y backup
scp app-codigo.tar.gz usuario@nuevo-servidor:/home/usuario/
scp backup_*.sql.gz usuario@nuevo-servidor:/home/usuario/
```

### 4. Configurar Servidor Destino

```bash
# En el servidor destino
cd /home/usuario
mkdir ServidorAppEntradas
cd ServidorAppEntradas

# Extraer código
tar xzf ../app-codigo.tar.gz

# Crear archivo .env
cp .env.example .env
nano .env
```

**Configurar .env con valores del nuevo servidor**:
```env
# App
PORT=3000
NODE_ENV=production
CORS_ORIGIN=http://tu-nuevo-dominio.com
JWT_KEY=nueva_clave_secreta_generada

# Postgres - CAMBIAR CREDENCIALES
PGHOST=db
PGUSER=nuevo_usuario_db
PGDATABASE=nombre_base_datos
PGPASSWORD=nueva_contraseña_segura
PGPORT=5432

POSTGRES_USER=nuevo_usuario_db
POSTGRES_PASSWORD=nueva_contraseña_segura
```

### 5. Construir Imagen Docker

```bash
# En el servidor destino
cd /home/usuario/ServidorAppEntradas

# Construir imagen de producción
docker build -t srv_alpine:prod -f prod/Dockerfile app

# Verificar imagen creada
docker images | grep srv_alpine
```

### 6. Iniciar Base de Datos y Restaurar Backup

```bash
# Levantar solo la base de datos primero
docker compose -f prod/docker-compose.yml up -d db

# Esperar a que PostgreSQL esté listo (verificar health)
docker compose -f prod/docker-compose.yml ps db

# Esperar unos segundos adicionales
sleep 10

# Descomprimir backup
gunzip ../backup_*.sql.gz

# Copiar backup al contenedor
docker cp ../backup_*.sql $(docker compose -f prod/docker-compose.yml ps -q db):/backup.sql

# Restaurar backup
docker compose -f prod/docker-compose.yml exec db psql -U nuevo_usuario_db -d nombre_base_datos -f /backup.sql

# Verificar restauración
docker compose -f prod/docker-compose.yml exec db psql -U nuevo_usuario_db -d nombre_base_datos -c "\dt"
docker compose -f prod/docker-compose.yml exec db psql -U nuevo_usuario_db -d nombre_base_datos -c "SELECT COUNT(*) FROM users;"
```

### 7. Levantar la Aplicación

```bash
# Levantar todos los servicios
docker compose -f prod/docker-compose.yml --env-file .env up -d

# Verificar que todos los servicios están healthy
docker compose -f prod/docker-compose.yml ps

# Ver logs de inicio
docker compose -f prod/docker-compose.yml logs -f app
```

### 8. Verificación Post-Migración

```bash
# 1. Health check básico
curl http://localhost:7202/api/ping
# Debe responder: pong

# 2. Verificar que la app responde
curl -I http://localhost:7202/

# 3. Test de login (ajustar credenciales)
curl -X POST http://localhost:7202/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","password":"password"}'

# 4. Verificar health checks
docker compose -f prod/docker-compose.yml ps

# 5. Revisar logs por errores
docker compose -f prod/docker-compose.yml logs app | grep -i error
docker compose -f prod/docker-compose.yml logs db | grep -i error

# 6. Verificar conexión de base de datos
docker compose -f prod/docker-compose.yml exec app sh -c 'nc -zv db 5432'

# 7. Probar un endpoint protegido (necesita token válido)
# Primero hacer login y obtener token, luego:
curl http://localhost:7202/api/users \
  -H "x-token: TOKEN_OBTENIDO_DEL_LOGIN"
```

### 9. Configurar Firewall y Red

```bash
# Configurar firewall (si aplica)
sudo ufw allow 7202/tcp
sudo ufw enable
sudo ufw status

# Si usas nginx/apache como reverse proxy
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 10. Configurar Reverse Proxy (Opcional)

Si deseas usar un dominio público con HTTPS:

```bash
# Instalar nginx
sudo apt update
sudo apt install nginx

# Crear configuración
sudo nano /etc/nginx/sites-available/app-entradas
```

Contenido del archivo nginx:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:7202;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:7202/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/app-entradas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Instalar certificado SSL con Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

### 11. Configurar Backups Automáticos

```bash
# Crear script de backup
sudo nano /usr/local/bin/backup-app-entradas.sh
```

Contenido del script:
```bash
#!/bin/bash
BACKUP_DIR="/home/usuario/backups"
DATE=$(date +%Y%m%d_%H%M%S)
COMPOSE_FILE="/home/usuario/ServidorAppEntradas/prod/docker-compose.yml"

mkdir -p $BACKUP_DIR

# Backup de base de datos
docker compose -f $COMPOSE_FILE exec -T db pg_dump -U nuevo_usuario_db nombre_base_datos | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Mantener solo los últimos 7 backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completado: $BACKUP_DIR/db_backup_$DATE.sql.gz"
```

```bash
# Dar permisos de ejecución
sudo chmod +x /usr/local/bin/backup-app-entradas.sh

# Configurar cron para backup diario a las 2 AM
sudo crontab -e
# Agregar línea:
0 2 * * * /usr/local/bin/backup-app-entradas.sh >> /var/log/backup-app-entradas.log 2>&1
```

---

## 🔄 Rollback (Si algo sale mal)

Si necesitas volver al servidor anterior:

```bash
# En el servidor nuevo
docker compose -f prod/docker-compose.yml down

# En el servidor anterior
docker compose -f prod/docker-compose.yml up -d

# Redirigir tráfico de vuelta al servidor anterior
```

---

## 📋 Post-Migración

### Actualizar DNS (si aplica)

- [ ] Actualizar registros A/CNAME al nuevo servidor
- [ ] Esperar propagación DNS (24-48h)
- [ ] Verificar acceso desde diferentes ubicaciones

### Actualizar Documentación

- [ ] Documentar nueva IP del servidor
- [ ] Actualizar credenciales en gestor de contraseñas
- [ ] Notificar al equipo del cambio

### Monitoreo

- [ ] Configurar alertas de uptime
- [ ] Configurar monitoreo de logs
- [ ] Verificar que los backups automáticos funcionan

### Limpieza del Servidor Anterior

```bash
# Después de confirmar que todo funciona (esperar al menos 1 semana)

# En el servidor anterior
docker compose -f prod/docker-compose.yml down -v

# Mantener backups por si acaso
# NO eliminar hasta estar 100% seguro
```

---

## 🆘 Solución de Problemas Durante la Migración

### Error: "Cannot connect to database"

```bash
# Verificar que la DB está corriendo
docker compose -f prod/docker-compose.yml ps db

# Verificar variables de entorno
docker compose -f prod/docker-compose.yml exec app env | grep PG

# Revisar logs de DB
docker compose -f prod/docker-compose.yml logs db
```

### Error: "Port already in use"

```bash
# Ver qué está usando el puerto
sudo ss -tulpn | grep 7202

# Cambiar puerto en docker-compose si es necesario
# o detener el servicio que lo está usando
```

### Error: Backup muy grande o lento

```bash
# Hacer backup por tablas
docker compose -f prod/docker-compose.yml exec -T db pg_dump -U vmv -t users firstapi > users.sql
docker compose -f prod/docker-compose.yml exec -T db pg_dump -U vmv -t entradas firstapi > entradas.sql

# Usar compresión más agresiva
docker compose -f prod/docker-compose.yml exec -T db pg_dump -U vmv firstapi | gzip -9 > backup.sql.gz
```

### Health check fallando

```bash
# Verificar endpoint de ping
curl http://localhost:7202/api/ping

# Si falla, revisar logs
docker compose -f prod/docker-compose.yml logs app

# Verificar que las dependencias se instalaron
docker compose -f prod/docker-compose.yml exec app npm list
```

---

## 📞 Contacto y Soporte

Si encuentras problemas durante la migración, documenta:
1. Comando exacto que ejecutaste
2. Error completo (screenshot o copiar texto)
3. Logs relevantes: `docker compose logs`
4. Estado de servicios: `docker compose ps`

---

**Tiempo estimado de migración**: 1-2 horas  
**Downtime estimado**: 30 minutos - 1 hora  
**Fecha de creación**: 22 de diciembre de 2025
