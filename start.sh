#!/bin/sh
set -e

echo "Running database migrations..."
npx drizzle-kit generate 2>/dev/null || true
npx drizzle-kit migrate
echo "Migrations complete."

echo "Starting server..."
exec node dist/index.js
