#!/bin/sh

set -e
set -x 

sudo initctl emit reddit-stop
echo 'flush_all' | nc localhost 11211

sudo -u postgres dropdb reddit
sudo -u postgres createdb -O reddit reddit
sudo -u postgres psql reddit < ../sql/functions.sql

echo "drop keyspace reddit;" | cassandra-cli -B -h localhost

echo "create keyspace reddit;" | cassandra-cli -B -h localhost

cat <<CASS | cassandra-cli -B -h localhost -k reddit 
create column family permacache with column_type = 'Standard' and
                                     comparator = 'BytesType';
CASS

if ! sudo rabbitmqctl list_vhosts | egrep "^/reddit$"
then
    sudo rabbitmqctl add_vhost /reddit
    sudo rabbitmqctl add_user reddit reddit
    sudo rabbitmqctl set_permissions -p /reddit reddit ".*" ".*" ".*"
fi

paster run development.ini r2/models/load_fixtures.py -c 'load_fixtures()'
paster run development.ini -c 'from r2.lib import sr_pops; sr_pops.run()'

sudo initctl emit reddit-start

