#!/bin/sh
set -e

echo "Waiting for database to be ready..."
# Wait for PostgreSQL to be ready
while ! nc -z db 5432; do
  sleep 1
done
echo "Database is ready!"

echo "Running database migrations..."
npm run db:migrate

echo "Starting application..."
exec "$@"