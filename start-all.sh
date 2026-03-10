

#!/bin/bash
# Robust script to start both backend and frontend for Chit Fund Web App
set -e
set -x

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# === HOSTNAME UNIFORMITY OPTION ===
# Choose 'localhost' or 'lan' (for LAN IP) for both frontend and backend
HOST_MODE=${HOST_MODE:-localhost} # set HOST_MODE=lan to use LAN IP
if [ "$HOST_MODE" = "lan" ]; then
	MY_IP=$(ifconfig en0 | awk '/inet /{print $2}' | head -n1)
	if [ -z "$MY_IP" ]; then
		MY_IP=$(ipconfig getifaddr en0 2>/dev/null)
	fi
	if [ -z "$MY_IP" ]; then
		echo "[ERROR] Could not determine LAN IP. Falling back to localhost." >&2
		HOSTNAME="localhost"
	else
		HOSTNAME="$MY_IP"
	fi
else
	HOSTNAME="localhost"
fi
echo "[INFO] Using HOSTNAME: $HOSTNAME (set HOST_MODE=lan for LAN IP, HOST_MODE=localhost for localhost)"

echo "Project root: $PROJECT_ROOT"

# === KILL PROCESSES USING RESERVED PORTS ===
for PORT in 4000 5173; do
	PID=$(lsof -ti tcp:$PORT 2>/dev/null || true)
	if [ -n "$PID" ]; then
		echo "[INFO] Killing process(es) using port $PORT: $PID"
		kill -9 $PID 2>/dev/null || true
	fi
done


# === CRITICAL PRE-FLIGHT CHECKS ===

# === TESTS ===
echo "[INFO] Running all tests (backend & frontend) before startup..."
cd "$PROJECT_ROOT"
# Patch: ensure test:frontend uses jest.config.cjs
sed -i '' 's/jest.config.js/jest.config.cjs/g' package.json
# Run tests and show all output live in terminal, also tee to log file
TEST_LOG="$PROJECT_ROOT/test-run-$(date +%Y%m%d-%H%M%S).log"
if ! npm run test:all 2>&1 | tee "$TEST_LOG"; then
  echo "[ERROR] One or more tests failed. See $TEST_LOG for details. Aborting startup." >&2
  exit 1
fi
echo "[INFO] All tests passed. Proceeding with startup."
# Check node_modules and package-lock.json in backend and frontend, auto-fix if missing
for DIR in "$BACKEND_DIR" "$FRONTEND_DIR"; do
	if [ ! -d "$DIR/node_modules" ] || [ ! -f "$DIR/package-lock.json" ]; then
		echo "[WARN] node_modules or package-lock.json missing in $DIR. Running npm install..."
		(cd "$DIR" && npm install)
		if [ $? -ne 0 ]; then
			echo "[ERROR] npm install failed in $DIR. Aborting startup." >&2
			exit 1
		fi
	fi
done
echo "[INFO] Dependency check complete."

# Check for syntax errors in backend route files
for ROUTE in "$BACKEND_DIR/src/routes/user.js" "$BACKEND_DIR/src/routes/chit.js"; do
	if ! node -c "$ROUTE" >/dev/null 2>&1; then
		echo "[ERROR] Syntax error in $ROUTE. Aborting startup." >&2
		exit 1
	fi
done
echo "[INFO] Route syntax check complete."

################################################################################
# Ensure Postgres user and DB exist before starting backend
if [ -d "$BACKEND_DIR" ]; then
	echo "Ensuring Postgres user and database exist..."
	PG_DB=${PG_DB:-chitfund}
	PG_USER=${PG_USER:-Yashwanth}
	PG_PASS=${PG_PASS:-}
	PG_HOST=${PG_HOST:-localhost}
	PG_PORT=${PG_PORT:-5432}

	# Try to create the user (ignore error if it exists)
	/opt/homebrew/opt/postgresql@14/bin/createuser -s "$PG_USER" 2>/dev/null || echo "User $PG_USER already exists or cannot be created."

	# Try to create the database (ignore error if it exists)
	createdb -U "$PG_USER" -h "$PG_HOST" -p "$PG_PORT" "$PG_DB" 2>/dev/null || echo "Database $PG_DB already exists or cannot be created."

	echo "[INFO] Testing Postgres DB connection..."
	PG_CONN_OUTPUT=$(PGPASSWORD="$PG_PASS" psql -U "$PG_USER" -h "$PG_HOST" -p "$PG_PORT" -d "$PG_DB" -c '\conninfo' 2>&1)
	if [ $? -ne 0 ]; then
		echo "[ERROR] Could not connect to Postgres database $PG_DB as user $PG_USER on $PG_HOST:$PG_PORT. Aborting startup." >&2
		echo "[ERROR] psql output: $PG_CONN_OUTPUT" >&2
		exit 1
	else
		echo "[INFO] Postgres DB connection: SUCCESS"
		echo "[INFO] psql output: $PG_CONN_OUTPUT"
	fi

	echo "Starting backend from $BACKEND_DIR..."
	(
		export PG_DB PG_USER PG_PASS PG_HOST PG_PORT
		export PG_USER=Yashwanth
		cd "$BACKEND_DIR"
		echo "Running DB migrations (custom runner)..."
		node db/migrations/runner.js
		echo "Starting backend..."
		# Listen on selected hostname (0.0.0.0 for LAN, localhost for local)
		if [ "$HOSTNAME" = "localhost" ]; then
			node --inspect src/server.js &
		else
			PORT=4000 node --inspect src/server.js &
		fi
		BACKEND_PID=$!
		echo "Backend started with PID $BACKEND_PID"

		# Wait for backend to be up (max 20s)
		for i in {1..20}; do
			sleep 1
			if nc -z "$HOSTNAME" 4000; then
				echo "[INFO] Backend is up on port 4000."
				break
			fi
			if [ $i -eq 20 ]; then
				echo "[ERROR] Backend failed to start on port 4000 after 20s. Aborting startup." >&2
				kill $BACKEND_PID 2>/dev/null || true
				exit 1
			fi
		done
	)
else
	echo "[ERROR] Backend directory not found at $BACKEND_DIR" >&2
	exit 1
fi

# Start frontend
echo "Both servers running. Press Ctrl+C to stop."

if [ -d "$FRONTEND_DIR" ]; then
	echo "Starting frontend from $FRONTEND_DIR..."
	(cd "$FRONTEND_DIR" && npm run dev -- --host "$HOSTNAME") &
	FRONTEND_PID=$!
	echo "Frontend started with PID $FRONTEND_PID"
else
	echo "[ERROR] Frontend directory not found at $FRONTEND_DIR" >&2
	kill $BACKEND_PID 2>/dev/null || true
	exit 1
fi

echo "Both servers running. Press Ctrl+C to stop."


# === CLEAR COOKIES AND REFRESH BROWSER ===
# Use AppleScript to clear cookies for localhost and refresh Chrome before opening the app
sleep 2 # Give Vite a moment to start
FRONTEND_URL="http://$HOSTNAME:5173/"

echo "[INFO] Clearing Chrome cookies for localhost and refreshing..."
osascript <<EOF
tell application "Google Chrome"
	repeat with w in windows
		repeat with t in tabs of w
			if URL of t starts with "http://localhost" or URL of t starts with "http://127.0.0.1" then
				set URL of t to "chrome://settings/clearBrowserData"
				delay 1
			end if
		end repeat
	end repeat
	delay 2
	set newTab to make new tab at end of window 1 with properties {URL:"$FRONTEND_URL"}
end tell
EOF

trap 'echo "\nStopping servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' SIGINT
wait $BACKEND_PID $FRONTEND_PID
