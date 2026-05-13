#!/bin/sh
set -e
# Ensure tables exist (compose does not run migrations; first boot has an empty DB).
npx prisma db push
# Demo data anchored to UTC "today" (seed replaces rows so the calendar matches the run date).
if [ "${SKIP_AUTO_SEED}" != "1" ]; then
  npx tsx prisma/seed.ts
fi
exec node dist/src/main.js
