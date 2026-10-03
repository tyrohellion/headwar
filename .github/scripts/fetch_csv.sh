#!/usr/bin/env bash
# Fetches a CSV with retries and stubs a valid fallback if the fetch returns
# empty, HTML, or non-CSV content so downstream DuckDB reads never break.
#
# The stub is only safe for Savant leaderboards, where older seasons legitimately
# have no rows. Use fetch_csv_strict for files that must contain data, so a
# blocked/rate-limited download fails loudly instead of silently becoming NULLs.

# Shared validity check. Echoes a reason on failure, nothing on success.
_csv_unusable_reason() {
  local dest="$1" http_code="$2"
  if [ "$http_code" != "200" ]; then
    echo "HTTP $http_code"
  elif [ ! -s "$dest" ]; then
    echo "empty response body"
  elif [ "$(wc -l < "$dest")" -le 1 ]; then
    echo "no data rows ($(wc -l < "$dest") line(s))"
  elif grep -q -i "<html" "$dest"; then
    echo "response is HTML, not CSV"
  elif ! grep -q ',' "$dest"; then
    echo "response has no commas, so it is not CSV"
  fi
}

_curl_to_dest() {
  local url="$1" dest="$2"
  # %-{http_code} so the status is captured without polluting the file.
  curl -sL --retry 3 --retry-delay 2 -A "Mozilla/5.0" -w '%{http_code}' "$url" -o "$dest"
}

fetch_csv() {
  local url="$1"
  local dest="$2"
  local fallback_header="$3"

  local http_code
  http_code="$(_curl_to_dest "$url" "$dest")"

  # Strip UTF-8 BOM, which otherwise breaks DuckDB header detection on
  # files whose first header cell is quoted (e.g. "last_name, first_name")
  sed -i '1s/^\xef\xbb\xbf//' "$dest"

  local reason
  reason="$(_csv_unusable_reason "$dest" "$http_code")"
  if [ -n "$reason" ]; then
    echo "WARNING: $url unusable ($reason); stubbing $dest" >&2
    echo "$fallback_header" > "$dest"
    # Append a row of commas matching header count to ensure DuckDB detects a valid CSV structure
    echo "$fallback_header" | awk -F',' '{for(i=1;i<NF;i++) printf ","; print ""}' >> "$dest"
  fi
}

# Same as fetch_csv but aborts the step instead of stubbing. Use for any input
# where "no rows" is a failure rather than an expected empty season.
fetch_csv_strict() {
  local url="$1"
  local dest="$2"
  local fallback_header="${3:-}"

  local http_code
  http_code="$(_curl_to_dest "$url" "$dest")"

  sed -i '1s/^\xef\xbb\xbf//' "$dest"

  local reason
  reason="$(_csv_unusable_reason "$dest" "$http_code")"
  if [ -n "$reason" ]; then
    {
      echo "ERROR: could not fetch required CSV data."
      echo "  url:  $url"
      echo "  file: $dest"
      echo "  why:  $reason"
      echo "  first bytes: $(head -c 200 "$dest" | tr -d '\n')"
      echo "This source is usually rate limiting a repeat request. Wait a few"
      echo "minutes and re-run, or run the other data workflow first."
    } >&2
    exit 1
  fi
}
