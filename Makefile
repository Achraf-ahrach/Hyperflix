.PHONY: setup start stop clean migrate seed

# Complete setup for new developers
setup:
	docker compose up --build 
	@echo "Waiting for database to be ready..."
	sleep 15
	docker compose exec backend npx drizzle-kit migrate
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
	docker compose exec backend npx drizzle-kit migrate

# Seed database
seed:
	docker compose exec backend npm run db:seed