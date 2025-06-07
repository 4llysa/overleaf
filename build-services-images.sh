#!/bin/bash

# Répertoire de base contenant les sous-dossiers
BASE_DIR="./services"
EXCLUDE_LIST=("git-bridge" "spelling" "web")
# "spelling" "chat"  "clsi"  "contacts"  "docstore"  "document-updater"  "filestore"  "git-bridge"  "history-v1"  "notifications"  "project-history"  "real-time" 
is_excluded() {
  local item="$1"
  echo $1
  for exclude in "${EXCLUDE_LIST[@]}"; do
    if [[ "$item" == "$exclude" ]]; then
      return 0  # L'élément est dans la liste d'exclusion
    fi
  done
  return 1  # L'élément n'est pas dans la liste d'exclusion
}

# Vérifie si le dossier existe
if [ ! -d "$BASE_DIR" ]; then
  echo "Le dossier $BASE_DIR n'existe pas."
  exit 1
fi

# Parcours tous les dossiers dans le répertoire 'service'
for dir in "$BASE_DIR"/*; do
  if [ -d "$dir" ]; then
    # Récupère le nom du dossier (le tag de l'image Docker)
    DIR_NAME=$(basename "$dir")

    echo "IS EXCLUDED ? $DIR_NAME"
    if is_excluded "$DIR_NAME"; then
      echo "Skipping excluded directory: $DIR_NAME"
      continue
    fi


    IMAGE_NAME="overleaf-$DIR_NAME"
    echo "$dir"

    # Vérifie si un Dockerfile existe dans le dossier
    if [ -f "$dir/Dockerfile" ]; then
      echo "Building Docker image for $DIR_NAME..."

      # Construction de l'image Docker avec le tag correspondant au nom du dossier
      docker build -f "$dir/Dockerfile" -t "$IMAGE_NAME" .

      if [ $? -eq 0 ]; then
        echo "Docker image $IMAGE_NAME built successfully!"
      else
        echo "Error building Docker image $IMAGE_NAME."
        exit
      fi
    else
      echo "No Dockerfile found in $dir, skipping."
    fi
  fi
done

# Docker build pour le git-bridge car MONSIEUR ne veut pas le même contexte que les autres
docker build -f "services/git-bridge/Dockerfile" -t "overleaf-git-bridge" ./services/git-bridge
docker build -f "services/web/Dockerfile" -t "overleaf-web" . --target app
docker build -f "services/web/Dockerfile" -t "overleaf-webpack" . --target webpack
docker build -f "services/web/Dockerfile" -t "overleaf-frontend" . --target front
