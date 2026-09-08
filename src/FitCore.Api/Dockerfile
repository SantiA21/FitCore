# ── Etapa 1: Build ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /repo

# Copiamos los archivos de proyecto primero para aprovechar el cache de capas
COPY src/FitCore.Domain/FitCore.Domain.csproj           src/FitCore.Domain/
COPY src/FitCore.Application/FitCore.Application.csproj src/FitCore.Application/
COPY src/FitCore.Infrastructure/FitCore.Infrastructure.csproj src/FitCore.Infrastructure/
COPY src/FitCore.Api/FitCore.Api.csproj                 src/FitCore.Api/

RUN dotnet restore src/FitCore.Api/FitCore.Api.csproj

# Copiamos el resto del código fuente
COPY src/ src/

# Publicamos en modo Release
RUN dotnet publish src/FitCore.Api/FitCore.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish

# ── Etapa 2: Runtime ─────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Usuario no-root para mayor seguridad (Debian syntax)
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser
USER appuser

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "FitCore.Api.dll"]
