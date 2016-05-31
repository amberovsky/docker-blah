#!/usr/bin/env bash

set -e

mv /build-development/conf/ssh_host_rsa_key /etc/ssh/ssh_host_rsa_key
chmod 0600 /etc/ssh/ssh_host_rsa_key

passwd -d www-data
passwd -d root

echo 'PermitEmptyPasswords yes' >> /etc/ssh/sshd_config

# enable sshd
rm /etc/service/sshd/down

mkdir -p /var/www/.ssh /root/.ssh

chown www-data:www-data -R /var/www/.ssh
chmod go-rwx -R /var/www/.ssh /root/.ssh
