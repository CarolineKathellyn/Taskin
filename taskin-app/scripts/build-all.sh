#!/bin/bash
echo "🏗️ Build completo do Taskin..."

echo "📦 Instalando dependências do mobile..."
cd mobile && npm install && cd ..

echo "🖥️ Compilando backend..."
cd backend && mvn clean install && cd ..

echo "✅ Build concluído!"
