#!/bin/sh

set -x 

echo 'flush_all' | nc localhost 11212

sudo -u postgres dropdb reddit_test
sudo -u postgres createdb -O reddit reddit_test
sudo -u postgres psql reddit_test < ../sql/functions.sql

echo "drop keyspace reddit_test;" | cassandra-cli -B -h localhost

echo "create keyspace reddit_test;" | cassandra-cli -B -h localhost

cat <<CASS | cassandra-cli -B -h localhost -k reddit_test 
create column family permacache with column_type = 'Standard' and
                                     comparator = 'BytesType';
CASS

if ! sudo rabbitmqctl list_vhosts | egrep "^/reddit_test$"
then
    sudo rabbitmqctl add_vhost /reddit_test
    sudo rabbitmqctl add_user reddit_test reddit_test
    sudo rabbitmqctl set_permissions -p /reddit_test reddit_test ".*" ".*" ".*"
fi

paster run test.ini r2/models/populatedb.py -c 'populate(num_srs = 1, num_users = 1, num_links = 1, num_comments = 1, num_votes = 1)'
paster run test.ini -c 'from r2.lib import sr_pops; sr_pops.run()'

nosetests --with-xcoverage --with-xunit --cover-package=r2 --cover-erase
pylint -f parseable r2/ | tee pylint.out
