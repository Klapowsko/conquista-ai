FROM node:20-alpine

WORKDIR /app

# Instalar dependências
COPY package.json package-lock.json* ./
RUN npm ci

# Copiar código fonte
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV development

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Usar dev mode para live reload
CMD ["npm", "run", "dev"]

