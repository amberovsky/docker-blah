#!/usr/bin/env bash

set -e

apt-get update

# Allow su to root for www-data
sed -i '/auth       sufficient pam_rootok.so/a auth sufficient  pam_succeed_if.so use_uid user = www-data' /etc/pam.d/su
