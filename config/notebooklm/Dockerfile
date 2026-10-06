# WAPPY NotebookLM FastMCP Server
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias necesarias para FastMCP y NotebookLM
RUN pip install --no-cache-dir "notebooklm-py[mcp]"

# Copiar el servidor FastMCP multi-usuario
COPY multi_user_server.py /app/multi_user_server.py

# Variables de entorno por defecto
ENV PYTHONUNBUFFERED=1
ENV NOTEBOOKLM_HOME=/root/.notebooklm
ENV NOTEBOOKLM_MCP_HOST=0.0.0.0
ENV NOTEBOOKLM_MCP_PORT=9420

EXPOSE 9420

CMD ["python", "/app/multi_user_server.py"]
