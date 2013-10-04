#!/bin/bash
# simpler version of gen_time_listings.sh

. /etc/default/reddit

PGPASSWORD=$(sed -n 's/.*db_pass *= *\([^ ]*.*\)/\1/p' < $REDDIT_INI)

export PGPASSWORD='password'
USER=$(sed -n 's/.*db_user *= *\([^ ]*.*\)/\1/p' < $REDDIT_INI)
LINKDBHOST='localhost'
LINKDBNAME='reddit'
LINK_THING_DUMP="$REDDIT_SCRATCH/reddit_thing_link.dump"
LINK_DATA_DUMP="$REDDIT_SCRATCH/reddit_data_link.dump"
JOINED="$REDDIT_SCRATCH/reddit_link.joined"

cd $REDDIT_ROOT
LINK_THING_DUMP="$REDDIT_SCRATCH/reddit_thing_link.dump"
LINK_DATA_DUMP="$REDDIT_SCRATCH/reddit_data_link.dump"
JOINED="$REDDIT_SCRATCH/reddit_link.joined"
time psql -F"\t" -A -t -d $LINKDBNAME -U $USER -h $LINKDBHOST \
     -c "\\copy (select t.thing_id, 'thing', 'link',
        t.ups, t.downs, t.deleted, t.spam, extract(epoch from t.date)
        from reddit_thing_link t
        where not t.spam and not t.deleted
        and t.date > now() - interval '1 year'
        )
        to '$LINK_THING_DUMP'"
time psql -F"\t" -A -t -d $LINKDBNAME -U $USER -h $LINKDBHOST \
     -c "\\copy (select d.thing_id, 'data', 'link',
        d.key, d.value
        from reddit_data_link d, reddit_thing_link t
        where t.thing_id = d.thing_id
        and not t.spam and not t.deleted
        and (d.key = 'url' or d.key = 'sr_id')
        and t.date > now() - interval '1 year'
        )
        to '$LINK_DATA_DUMP'"
cat $LINK_DATA_DUMP $LINK_THING_DUMP | sort -T. -S200m | paster --plugin=r2 run $REDDIT_INI r2/lib/mr_top.py -c "join_links()" > $JOINED
cat $JOINED | paster --plugin=r2 run $REDDIT_INI r2/lib/mr_top.py -c "time_listings()" | sort -T. -S200m | paster --plugin=r2 run $REDDIT_INI r2/lib/mr_top.py -c "write_permacache()"

rm $LINK_THING_DUMP $LINK_DATA_DUMP $JOINED

