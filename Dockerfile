FROM node:20-alpine AS builder

ARG VERSION=0.1.0
WORKDIR /build
COPY ./web .
RUN npm install # Instaliraj npm pakete
RUN VITE_VERSION=${VERSION} npm run build # Izgradi frontend aplikaciju


FROM golang:alpine AS builder2

ARG VERSION=0.1.0
ARG AUTHOR=bukizzz
ENV GO111MODULE=on \
    CGO_ENABLED=0 \
    GOOS=linux

WORKDIR /build

ADD go.mod go.sum ./
RUN go mod download
# Preuzmi Go module zavisnosti

COPY . .
# Kopiraj izgrađeni frontend u Go projekat
COPY --from=builder /build/dist ./web/dist
# Izgradi Go aplikaciju
RUN go build -ldflags "-s -w -X MAPIK/internal/version.Version=${VERSION}" -o MAPIK


FROM alpine

WORKDIR /app
LABEL maintainer="bukizzz"
RUN apk upgrade --no-cache \
    && apk add --no-cache ca-certificates tzdata \
    && update-ca-certificates
# Instaliraj sertifikate i vremenske zone

# Kopiraj izgrađenu Go aplikaciju
COPY --from=builder2 /build/MAPIK .
# Izloži port 3001
EXPOSE 3001
# Pokreni aplikaciju
ENTRYPOINT ["/app/MAPIK"]
