#!/bin/bash -e

###############################################################################

###############################################################################
# The New Day reddit data cleaner / updater
# --------------------
# This script will refresh the database and caches by dropping tables and
# keyspaces and clearing caches and then reloading the sample or test data.
#
###############################################################################

# Bail if any command returns an error (i.e. exit >0 )
set -e

###############################################################################
# Sanity Checks
###############################################################################
if [[ $EUID -ne 0 ]]; then
    echo "ERROR: Must be run with root privileges."
    exit 1
fi

# seriously! these checks aren't here for no reason. the packages from the
# reddit ppa aren't built for anything but precise (12.04) right now, so
# if you try and use this install script on another release you're gonna
# have a bad time.
source /etc/lsb-release
if [ "$DISTRIB_ID" != "Ubuntu" -o "$DISTRIB_RELEASE" != "12.04" ]; then
    echo "ERROR: Only Ubuntu 12.04 is supported."
    exit 1
fi

###############################################################################
# Install prerequisites
###############################################################################
set -x

###############################################################################
# Make sure all the services are up
###############################################################################

# check each port for connectivity
echo "Checking for services, see source for port meanings..."
# 11211 - memcache
# 5432 - postgres
# 5672 - rabbitmq
# 9160 - cassandra
for port in 11211 5432 5672 9160; do
	nc -z localhost $port 1>/dev/null 2>&1; result=$?;
	if [ $result -ne 0 ]; then
        echo "Service at port $port is not up. Terminating script."
		exit 1
    fi
done

###############################################################################
# Stop Reddit
###############################################################################

initctl emit reddit-stop

###############################################################################
# Refresh Cassandra
###############################################################################

# Drop the keyspace if there is one.
if echo | cassandra-cli -h localhost -k reddit &> /dev/null; then
	
	cat <<CASS | cassandra-cli -B -h localhost || true
drop keyspace reddit;
CASS

fi

# Create a new empty one.
echo "create keyspace reddit;" | cassandra-cli -h localhost -B

# Create the permacache.
cat <<CASS | cassandra-cli -B -h localhost -k reddit || true
create column family permacache with column_type = 'Standard' and
                                     comparator = 'BytesType';
CASS

###############################################################################
# Refresh PostgreSQL
###############################################################################
SQL="SELECT COUNT(1) FROM pg_catalog.pg_database WHERE datname = 'reddit';"
IS_DATABASE_CREATED=$(sudo -u postgres psql -t -c "$SQL")

# Drop the database if there is one.
if [ $IS_DATABASE_CREATED -eq 1 ]; then
	
	# Revoke connection privileges so reconnects don't keep us from
	# dropping the database.
	echo "killing all connections to database 'reddit'"
	echo "REVOKE CONNECT ON DATABASE reddit FROM PUBLIC, reddit;" | sudo -u postgres psql

	# Kill all connections to the reddit database.
	cat <<KILLCONNECT_SCRIPT | sudo -u postgres psql
SELECT pg_terminate_backend(pg_stat_activity.procpid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'TARGET_DB';
KILLCONNECT_SCRIPT

	# Drop the database.
    echo "DROP DATABASE reddit;" | sudo -u postgres psql
fi

# Create the new database.
cat <<CREATE_SCRIPT | sudo -u postgres psql
CREATE DATABASE reddit WITH ENCODING = 'utf8' TEMPLATE template0;
GRANT CONNECT ON DATABASE reddit TO PUBLIC, reddit;
CREATE_SCRIPT

# Add the Postgres functions to the database.
sudo -u postgres psql reddit < ../sql/functions.sql

###############################################################################
# Check the RabbitMQ Configuration
###############################################################################
if ! rabbitmqctl list_vhosts | egrep "^/$"
then
    rabbitmqctl add_vhost /
fi

if ! rabbitmqctl list_users | egrep "^reddit"
then
    rabbitmqctl add_user reddit reddit
fi

rabbitmqctl set_permissions -p / reddit ".*" ".*" ".*"

###############################################################################
# Clear Memcached
###############################################################################

echo "flush_all" | nc -q 2 localhost 11211 
sleep 2

###############################################################################
# Restart Reddit
###############################################################################

initctl emit reddit-stop
initctl emit reddit-start
sleep 5

###############################################################################
# Populate the database with the default New Day spaces.
###############################################################################

cd ../r2
paster run run.ini r2/models/create_default_newday_spaces.py -c 'populate()'
paster run run.ini -c 'from r2.lib import sr_pops; sr_pops.run()'
