
# Usage ./create-user.sh admin@test.fr true
# Usage ./create-user.sh user@test.fr false

docker exec custom_production-web-1 /bin/bash -ce "cd /overleaf/services/web && node modules/server-ce-scripts/scripts/create-user $2 --email=$1"
