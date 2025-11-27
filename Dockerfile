# 1. Definir la imagen base de Python (usamos 'slim' para que sea más pequeña)
FROM python:3.13-slim

# 2. Comando para instalar librerías de sistema (Apt-get)
#    Esto se ejecuta con permisos de superusuario dentro del contenedor
#    e instala la dependencia SDL2 necesaria para Pygame.
RUN apt-get update && \
    apt-get install -y libsdl2-dev gcc && \
    rm -rf /var/lib/apt/lists/*

# 3. Establecer el directorio de trabajo donde estará la aplicación
WORKDIR /usr/src/app

# 4. Copiar e instalar las dependencias de Python
#    Instalamos esto primero para aprovechar el caché de Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copiar el resto de los archivos del proyecto (app.py, reports.py, etc.)
COPY . .

# 6. Exponer el puerto que usará el servidor (Gunicorn usará 8000 por defecto)
EXPOSE 8000

# 7. Comando de inicio (El Start Command de Render)
#    Esto es lo último que se ejecuta cuando el contenedor arranca.
CMD ["gunicorn", "app:app"]