# Podrazumevani cilj
.DEFAULT_GOAL := help

# ==============================================================================
# Pokretanje i razvoj
# ==============================================================================
.PHONY: run
run: ## Izgradi frontend i pokreni server
	@echo "--- Izgradnja frontenda... ---"
	cd web && npm install && npm run build
	@echo "--- Priprema backenda... ---"
	@echo "--- Pokretanje backenda... ---"
	go run ./main.go

.PHONY: dev
dev: ## Pokreni u razvojnom modu (sa detekcijom trke)
	@echo "🔧 Pokretanje u razvojnom modu..."
	go run -race ./main.go

.PHONY: help
help: ## Prikaži ovu pomoćnu poruku
	@awk 'BEGIN {FS = ":.*?## "; printf "Upotreba:\n  make \033[36m<cilj>\033[0m\n\nCiljevi:\n"} /^[a-zA-Z0-9_-]+:.*?## / { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
