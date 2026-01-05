FROM node:20-alpine AS builder

WORKDIR /app

# Copiamos solo package.json para instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiamos todo el código
COPY . .

# Compilar TypeScript a dist/
RUN npm run build

# ===== STAGE 2: Runtime =====
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copiar package.json y node_modules optimizado
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

# Copiar código compilado
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/public ./dist/public

# Ajustar permisos y usar usuario no root
RUN chown -R node:node /app
USER node

EXPOSE 3000

# Healthcheck de la aplicación
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=5 CMD wget -qO- http://localhost:3000/api/ping || exit 1

# Ejecutar la app compilada desde dist/
CMD ["node", "dist/index.js"]
