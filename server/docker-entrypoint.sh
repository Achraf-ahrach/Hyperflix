#!/bin/sh
set -e

echo "Waiting for database to be ready..."
# Wait for PostgreSQL to be ready
while ! nc -z db 5432; do
  sleep 1
done
echo "Database is ready!"

# Skip migrations in production - they should be run manually or via CI/CD
echo "Skipping automatic migrations. Run 'npm run db:migrate' manually if needed."

echo "Starting application..."
exec "$@"
