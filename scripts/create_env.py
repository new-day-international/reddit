#!/usr/bin/env python

import sys
from ConfigParser import SafeConfigParser

from pycassa.system_manager import *

def create_cassandra_keyspace(config):
    sys = SystemManager(config.get('DEFAULT', 'cassandra_seeds'))
    if config.get('DEFAULT', 'cassandra_keyspace') in sys.list_keyspaces():
        print "found keyspace %r, not creating" % (config.get('DEFAULT', 'cassandra_keyspace'),)
        return
    print "creating %r" % (config.get('DEFAULT', 'cassandra_keyspace'),)
    sys.create_keyspace(config.get('DEFAULT', 'cassandra_keyspace'), replication_factor=1)

def create_cassandra_permacache_column_family(config):
    sys = SystemManager(config.get('DEFAULT', 'cassandra_seeds'))
    if 'permacache' in sys.get_keyspace_column_families(config.get('DEFAULT', 'cassandra_keyspace')).keys():
        print "found permacache, not creating"
        return
    print "creating %r / 'permacache'" % (config.get('DEFAULT', 'cassandra_keyspace'),)
    sys.create_column_family(config.get('DEFAULT', 'cassandra_keyspace'), 'permacache', super=False, comparator_type=BYTES_TYPE, row_cache_provider='org.apache.cassandra.cache.ConcurrentLinkedHashCacheProvider')
    print "created permacache"

def create_rabbitmq_vhost():
    pass

def create_rabbitmq_user():
    pass

def create_postgresql_database():
    pass

def create_env(config):
    create_cassandra_keyspace(config)
    create_cassandra_permacache_column_family(config)

if __name__ == '__main__':
    config = SafeConfigParser()
    config.read(sys.argv[1])
    create_env(config)

