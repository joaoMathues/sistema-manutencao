@echo off
setlocal

rem --- Ajuste estes caminhos se necessário ---
set "PROJ_DIR=C:\Users\joao.borba\Downloads\sistema-manutencao"
set "OPCUA_DIR=C:\Users\joao.borba\Downloads\esse_funciona 1\esse_funciona"
set "FRONTEND_PORT=8000"
set "BACKEND_PORT=5000"

rem --- (Opcional) definir Twilio temporariamente ---
rem set "TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx"
rem set "TWILIO_AUTH_TOKEN=your_auth_token"
rem set "TWILIO_WHATSAPP_FROM=whatsapp:+55xxxxxxxxxx"

rem --- Backend (Flask) ---
start "Backend" /D "%PROJ_DIR%" cmd /k "if not exist .venv\Scripts\activate.bat (echo criando virtualenv... && python -m venv .venv) && call .venv\Scripts\activate.bat && if exist requirements.txt (echo instalando dependências... && pip install -r requirements.txt) && echo Iniciando backend (porta %BACKEND_PORT%)... && python backend_server.py"

rem --- Frontend (static server) ---
start "Frontend" /D "%PROJ_DIR%" cmd /k "echo Iniciando servidor estático (porta %FRONTEND_PORT%)... && python -m http.server %FRONTEND_PORT%"

rem --- OPC UA backend (Node) ---
start "OPCUA" /D "%OPCUA_DIR%" cmd /k "if exist package.json (echo npm install... && npm install) && echo Iniciando opcua_backend.js... && node opcua_backend.js"

rem --- abrir navegador para o backend ---
timeout /t 1 >nul
start "" "http://localhost:%BACKEND_PORT%"

endlocal