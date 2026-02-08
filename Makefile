.PHONY: setup start stop clean migrate seed

# Complete setup for new developers
setup:
	docker compose up --build -d
	@echo "Waiting for services to be ready (npm install + database)..."
	sleep 30
	docker compose exec backend npm run db:migrate
	docker compose exec backend npm run db:seed
	@echo "✅ Setup complete! Visit http://localhost:3000"

# Start containers
start:
	docker compose up -d

# Stop containers
stop:
	docker compose down

# Clean everything (including volumes)
clean:
	docker compose down -v

# Run migrations
migrate:
	docker compose exec backend npm run db:migrate

# Seed database
seed:
	docker compose exec backend npm run db:seed