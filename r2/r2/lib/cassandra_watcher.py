#!/usr/bin/env python

import ConfigParser, os, sys, time
from pycassa import pool

# keep attempting to connect to cassandra until sucessful.  This is useful as an upstart job that will start the reddit jobs after this exits
def cassandra_watcher():
    config = ConfigParser.ConfigParser()
    config.readfp(open(sys.argv[1]))
    cassandra_seeds = config.get('DEFAULT', 'cassandra_seeds').split(':')
    while True:
        try:
            p = pool.ConnectionPool(
                config.get('DEFAULT', 'cassandra_keyspace'),
                server_list=cassandra_seeds,
                timeout=4,
                max_retries=1,
            )
            break
        except pool.AllServersUnavailable:
            print "Failed to connect, retrying in a second"
            time.sleep(1)

if __name__ == '__main__':
    cassandra_watcher()