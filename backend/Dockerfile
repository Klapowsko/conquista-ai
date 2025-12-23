FROM golang:1.23-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache git curl

# Instalar Air para live reload (versão compatível com Go 1.23)
RUN go install github.com/cosmtrek/air@v1.49.0
ENV PATH="${PATH}:/go/bin"

# Copiar go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copiar código fonte
COPY . .

# Remover vendor se existir (para evitar conflitos)
RUN rm -rf vendor || true

# Copiar configuração do Air
COPY .air.toml ./.air.toml

# Criar diretório tmp para Air
RUN mkdir -p tmp && chmod 777 tmp

EXPOSE 8080

# Usar Air para live reload
CMD ["air"]

