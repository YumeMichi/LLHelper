#!/bin/bash

set -e

do_download_livedb=
do_download_unitdb=
do_cleanup=
livedb=livenewjp.db_
unitdb=unitnewjp.db_

download_file() {
  local target="$1"
  local source_url="$2"
  if command -v wget >/dev/null 2>&1; then
    wget -O "$target" "$source_url"
  elif command -v curl >/dev/null 2>&1; then
    curl -L -o "$target" "$source_url"
  else
    python3 -c "import urllib.request; urllib.request.urlretrieve('$source_url', '$target')"
  fi
}

if [ "$1" = "local" ]; then
  if [ ! -f "$livedb" ]; then
    do_download_livedb=y
  fi
  if [ ! -f "$unitdb" ]; then
    do_download_unitdb=y
  fi
else
  do_download_livedb=y
  do_download_unitdb=y
  do_cleanup=y
fi

if [ "$do_download_livedb" = "y" ]; then
  download_file "$livedb" "https://r.llsif.win/db/live/live.db_"
fi
if [ "$do_download_unitdb" = "y" ]; then
  download_file "$unitdb" "https://r.llsif.win/db/unit/unit.db_"
fi

python3 updatenewcard.py
python3 updatenewlive.py
# argument is thread number, 1 to use single-thread mode
#python3 updateweight2.py 1
python3 updateweight2.py 10
python3 updatemetadata.py
python3 updatesis.py
python3 updateaccessory.py

if [ "$do_cleanup" = "y" ]; then
  rm $livedb
  rm $unitdb
fi
