#!/usr/bin/env bash

set -e

/build-development/env.sh
/build-development/ssh.sh
/build-development/sqlite3.sh
/build-development/cleanup.sh
