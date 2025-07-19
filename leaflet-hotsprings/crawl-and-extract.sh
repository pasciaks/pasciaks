#!/bin/bash

# Prompt to crawl
read -p "Do you want to crawl? (yes or no): " do_crawl

if [[ "$do_crawl" == "yes" ]]; then
  # Ask if downloads folder should be removed (renamed)
  read -p "Do you want to remove the downloads folder? (yes or no): " remove_downloads

  if [[ "$remove_downloads" == "yes" ]]; then
    if [[ -d "downloaded" ]]; then
      timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
      safe_name=$(echo "$timestamp" | sed 's/[^a-zA-Z0-9_\-]/_/g')
      mv downloaded "archived_$safe_name"
      echo "Renamed 'downloaded' to 'archived_$safe_name'"
    else
      echo "'downloaded' folder does not exist, skipping rename."
    fi
  fi

  echo "Running crawl.js..."
  node crawl.js
  ls -l downloaded

  # Prompt to extract
  read -p "Do you want to extract? (yes or no): " do_extract

  if [[ "$do_extract" == "yes" ]]; then
    echo "Running extract-all-lat-long.js..."
    node extract-all-lat-long.js
  fi
fi

# Always run the app at the end
echo "Starting app..."
npm run start
