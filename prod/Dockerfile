FROM node:20-alpine

WORKDIR /app

# Copiamos solo package.json para instalar dependencias
COPY package*.json ./
ENV NODE_ENV=production
RUN npm ci --omit=dev || npm install --omit=dev

# Copiamos todo el código
COPY . .

# Ajustar permisos y usar usuario no root
RUN chown -R node:node /app
USER node

EXPOSE 3000

# Healthcheck de la aplicación
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=5 CMD wget -qO- http://localhost:3000/api/ping || exit 1

# Ejecutar la app normalmente
CMD ["node", "src/index.js"]
