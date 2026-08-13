#!/usr/bin/env bash

# Fetches a CSV with retries and stubs a valid fallback if the fetch returns
# empty, HTML, or non-CSV content so downstream DuckDB reads never break.
fetch_csv() {
  local url="$1"
  local dest="$2"
  local fallback_header="$3"

  curl -sL --retry 3 --retry-delay 2 -A "Mozilla/5.0" "$url" -o "$dest"

  # Strip UTF-8 BOM, which otherwise breaks DuckDB header detection on
  # files whose first header cell is quoted (e.g. "last_name, first_name")
  sed -i '1s/^\xef\xbb\xbf//' "$dest"

  # Check if file is empty, has <= 1 line, contains HTML, or is not
  # CSV-shaped at all (no commas) -> treat as failure and stub it
  if [ ! -s "$dest" ] || [ $(wc -l < "$dest") -le 1 ] || grep -q -i "<html" "$dest" || ! grep -q ',' "$dest"; then
    echo "$fallback_header" > "$dest"
    # Append a row of commas matching header count to ensure DuckDB detects a valid CSV structure
    echo "$fallback_header" | awk -F',' '{for(i=1;i<NF;i++) printf ","; print ""}' >> "$dest"
  fi
}
