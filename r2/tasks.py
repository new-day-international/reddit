from invoke import run, task
from invoke.collection import Collection

test = Collection()

@task
def server():
    run("paster serve run.ini --reload", echo=True)
    
@task
def clean_memcached():
    run("echo 'flush_all' | nc localhost 11212", echo=True)

@task
def clean_postgresql():
    run("sudo -u postgres dropdb reddit_test", echo=True)
    run("sudo -u postgres createdb -O reddit reddit_test", echo=True)
    run("sudo -u postgres psql reddit_test < ../sql/functions.sql", echo=True)

@task
def clean_cassandra():
    run('echo "drop keyspace reddit_test;" | cassandra-cli -B -h localhost', echo=True, warn=True)
    run('echo "create keyspace reddit_test;" | cassandra-cli -B -h localhost', echo=True)
    run("echo \"create column family permacache with column_type = 'Standard' and comparator = 'BytesType';\" | cassandra-cli -B -h localhost -k reddit_test", echo=True)

@task
def clean_rabbitmq():
    run("sudo rabbitmqctl delete_vhost /reddit_test", echo=True, warn=True)
    run("sudo rabbitmqctl add_vhost /reddit_test", echo=True)
    run("sudo rabbitmqctl add_user reddit_test reddit_test", echo=True, warn=True)
    run('sudo rabbitmqctl set_permissions -p /reddit_test reddit_test ".*" ".*" ".*"', echo=True)

@task
def populatedb():
    run("paster run test.ini r2/models/populatedb.py -c 'populate(num_srs = 1, num_users = 1, num_links = 1, num_comments = 1, num_votes = 1)'", echo=True)
    run("paster run test.ini -c 'from r2.lib import sr_pops; sr_pops.run()'", echo=True)

@task('clean_memcached', 'clean_cassandra', 'clean_postgresql', 'clean_rabbitmq', 'populatedb', default=True)
def test():
    run("nosetests", echo=True)

@task('clean_memcached', 'clean_cassandra', 'clean_postgresql', 'clean_rabbitmq', 'populatedb')
def test_for_ci():
    run("nosetests --with-xcoverage --with-xunit --cover-package=r2 --cover-erase", echo=True)

@task
def pylint():
    run("pylint -f parseable r2/ | tee pylint.out", echo=True, warn=True)
    
    