#!/bin/bash
echo "🖥️ Iniciando Backend Taskin..."
cd backend
mvn clean install
mvn spring-boot:run
