FROM golang:1.23-alpine AS builder

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache git

# Copiar go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copiar código fonte
COPY . .

# Compilar aplicação
RUN CGO_ENABLED=0 GOOS=linux go build -mod=mod -a -installsuffix cgo -o bin/server ./cmd/server
RUN CGO_ENABLED=0 GOOS=linux go build -mod=mod -a -installsuffix cgo -o bin/migrate ./cmd/migrate

# Stage final
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

# Copiar binários
COPY --from=builder /app/bin/server .
COPY --from=builder /app/bin/migrate .
RUN chmod +x server migrate
RUN chown -R root:root /app

# Copiar migrations
COPY --from=builder /app/migrations ./migrations

EXPOSE 8080

CMD ["./server"]

