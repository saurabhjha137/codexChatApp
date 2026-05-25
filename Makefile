.PHONY: setup run backend frontend check-node clean

setup:
	python3.12 -m venv backend/.venv || python3 -m venv backend/.venv
	backend/.venv/bin/pip install -r backend/requirements.txt
	cd frontend && npm install

run:
	./scripts/start.sh

backend:
	test -d backend/.venv || (python3.12 -m venv backend/.venv || python3 -m venv backend/.venv)
	backend/.venv/bin/pip install -r backend/requirements.txt
	cd backend && .venv/bin/python run.py

frontend: check-node
	cd frontend && npm run dev -- --host 0.0.0.0

check-node:
	@command -v npm >/dev/null 2>&1 || ( \
		echo "Missing npm. Install Node.js 20+ with npm, then run make run again."; \
		echo "Ubuntu/Debian option: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"; \
		echo "nvm option: nvm install 20 && nvm use 20"; \
		exit 127; \
	)

clean:
	rm -rf backend/.venv frontend/node_modules frontend/dist backend/lan_chat.db
