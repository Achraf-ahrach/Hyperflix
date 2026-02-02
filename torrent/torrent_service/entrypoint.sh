#!/bin/sh

# 1. Export Docker environment variables to a file so Cron can read them
# (Cron runs in a limited shell and won't see your DB passwords otherwise)
printenv > /etc/environment

# 2. Start the Cron service in the background
service cron start

# 3. Django Setup
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Applying migrations..."
python manage.py makemigrations
python manage.py migrate

# 4. Start Gunicorn (The main process that keeps the container alive)
echo "Starting Gunicorn..."
exec gunicorn --bind 0.0.0.0:8000 torrent.wsgi --timeout 300 --reload
