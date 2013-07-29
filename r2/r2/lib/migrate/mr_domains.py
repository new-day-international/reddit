# The contents of this file are subject to the Common Public Attribution
# License Version 1.0. (the "License"); you may not use this file except in
# compliance with the License. You may obtain a copy of the License at
# http://code.reddit.com/LICENSE. The License is based on the Mozilla Public
# License Version 1.1, but Sections 14 and 15 have been added to cover use of
# software over a computer network and provide for limited attribution for the
# Original Developer. In addition, Exhibit A has been modified to be consistent
# with Exhibit B.
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for
# the specific language governing rights and limitations under the License.
#
# The Original Code is reddit.
#
# The Original Developer is the Initial Developer.  The Initial Developer of
# the Original Code is reddit Inc.
#
# All portions of the code written by reddit are Copyright (c) 2006-2013 reddit
# Inc. All Rights Reserved.
###############################################################################

"""
Generate the data for the listings for the time-based Subreddit
queries. The format is eventually that of the CachedResults objects
used by r2.lib.db.queries (with some intermediate steps), so changes
there may warrant changes here
"""

# to run:
"""
export LINKDBHOST=prec01
export USER=ri
export INI=production.ini
cd ~/reddit/r2
time psql -F"\t" -A -t -d newreddit -U $USER -h $LINKDBHOST \
     -c "\\copy (select t.thing_id, 'thing', 'link',
                        t.ups, t.downs, t.deleted, t.spam, extract(epoch from t.date)
                   from reddit_thing_link t
                  where not t.spam and not t.deleted
                  )
                  to 'reddit_thing_link.dump'"
time psql -F"\t" -A -t -d newreddit -U $USER -h $LINKDBHOST \
     -c "\\copy (select d.thing_id, 'data', 'link',
                        d.key, d.value
                   from reddit_data_link d
                  where d.key = 'url' ) to 'reddit_data_link.dump'"
cat reddit_data_link.dump reddit_thing_link.dump | sort -T. -S200m | paster --plugin=r2 run $INI r2/lib/migrate/mr_domains.py -c "join_links()" > links.joined
cat links.joined | paster --plugin=r2 run $INI r2/lib/migrate/mr_domains.py -c "time_listings()" | sort -T. -S200m | paster --plugin=r2 run $INI r2/lib/migrate/mr_domains.py -c "write_permacache()"
"""

import sys

from r2.models import Account, Subreddit, Link
from r2.lib.db.sorts import epoch_seconds, score, controversy, _hot
from r2.lib.db import queries
from r2.lib import mr_tools
from r2.lib.utils import timeago, UrlParser
from r2.lib.jsontemplates import make_fullname # what a strange place
                                               # for this function
def join_links():
    mr_tools.join_things(('url',))


def time_listings(times = ('all',)):
    oldests = dict((t, epoch_seconds(timeago('1 %s' % t)))
                   for t in times if t != "all")
    oldests['all'] = epoch_seconds(timeago('10 years'))

    @mr_tools.dataspec_m_thing(("url", str),)
    def process(link):
        assert link.thing_type == 'link'

        timestamp = link.timestamp
        fname = make_fullname(Link, link.thing_id)

        if not link.spam and not link.deleted:
            if link.url:
                domains = UrlParser(link.url).domain_permutations()
            else:
                domains = []
            ups, downs = link.ups, link.downs

            for tkey, oldest in oldests.iteritems():
                if timestamp > oldest:
                    sc = score(ups, downs)
                    contr = controversy(ups, downs)
                    h = _hot(ups, downs, timestamp)
                    for domain in domains:
                        yield ('domain/top/%s/%s' % (tkey, domain),
                               sc, timestamp, fname)
                        yield ('domain/controversial/%s/%s' % (tkey, domain),
                               contr, timestamp, fname)
                        if tkey == "all":
                            yield ('domain/hot/%s/%s' % (tkey, domain),
                                   h, timestamp, fname)
                            yield ('domain/new/%s/%s' % (tkey, domain),
                                   timestamp, timestamp, fname)

    mr_tools.mr_map(process)

def store_keys(key, maxes):
    # we're building queries using queries.py, but we could make the
    # queries ourselves if we wanted to avoid the individual lookups
    # for accounts and spaces.

    # Note that we're only generating the 'sr-' type queries here, but
    # we're also able to process the other listings generated by the
    # old migrate.mr_permacache for convenience

    userrel_fns = dict(liked = queries.get_liked,
                       disliked = queries.get_disliked,
                       saved = queries.get_saved,
                       hidden = queries.get_hidden)

    if key.startswith('user-'):
        acc_str, keytype, account_id = key.split('-')
        account_id = int(account_id)
        fn = queries.get_submitted if keytype == 'submitted' else queries.get_comments
        q = fn(Account._byID(account_id), 'new', 'all')
        q._insert_tuples([(fname, float(timestamp))
                    for (timestamp, fname)
                    in maxes])

    elif key.startswith('sr-'):
        sr_str, sort, time, sr_id = key.split('-')
        sr_id = int(sr_id)

        if sort == 'controversy':
            # I screwed this up in the mapper and it's too late to fix
            # it
            sort = 'controversial'

        q = queries.get_links(Subreddit._byID(sr_id), sort, time)
        q._insert_tuples([tuple([item[-1]] + map(float, item[:-1]))
                    for item in maxes])
    elif key.startswith('domain/'):
        d_str, sort, time, domain = key.split('/')
        q = queries.get_domain_links(domain, sort, time)
        q._insert_tuples([tuple([item[-1]] + map(float, item[:-1]))
                    for item in maxes])


    elif key.split('-')[0] in userrel_fns:
        key_type, account_id = key.split('-')
        account_id = int(account_id)
        fn = userrel_fns[key_type]
        q = fn(Account._byID(account_id))
        q._insert_tuples([tuple([item[-1]] + map(float, item[:-1]))
                    for item in maxes])


def write_permacache(fd = sys.stdin):
    mr_tools.mr_reduce_max_per_key(lambda x: map(float, x[:-1]), num=1000,
                                   post=store_keys,
                                   fd = fd)
