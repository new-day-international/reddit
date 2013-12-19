# I export data from lightnet to yaml files
# run me with `paster run run.ini r2/lib/exporter.py -c 'export_data()'`

from r2.models import *
from r2.lib.utils import fetch_things2, flatten

import yaml, pprint

def dump_to_file(name_of_type, data):
    with file('%s.yml' % (name_of_type,), 'wb') as outfile:
        yaml.dump(data, outfile, Dumper=yaml.CDumper, default_flow_style=False)

def thing_to_dict(thing):
    ret = dict(
        _date=thing._date,
        _spam=thing._spam,
        _deleted=thing._deleted,
        _ups=thing._ups,
        _downs=thing._downs,
    )
    for k, v in thing.__dict__['_t'].items():
        ret[k] = v
    return ret

def export_data():
    print Subreddit.__bases__


    accounts = Account._query(data=True, allow_deleted=True)
    accounts._sort = asc('_date')
    accounts = list(fetch_things2(accounts))
    print "accounts: ", len(accounts)

    out = {}
    for account in accounts:
        out[account.name] = thing_to_dict(account)
        out[account.name]['id'] = int(account._id)
    dump_to_file('accounts', out)

    subreddits = Subreddit._query(data=True)
    subreddits._sort = asc('_date')
    subreddits = list(fetch_things2(subreddits))
    print "subreddits: ", len(subreddits)

    out = {}
    for subreddit in subreddits:
        out[subreddit.name] = thing_to_dict(subreddit)
        for rel in ['moderator_ids', 'moderator_invite_ids', 'contributor_ids', 'subscriber_ids', 'banned_ids', 'wikibanned_ids', 'wikicontributor_ids']:
            accounts = []
            for ii in getattr(subreddit, rel)():
                try:
                    accounts.append(Account._byID(ii).name)
                except AttributeError:
                    print "missing account for relation %r: Account id %r" % (rel, ii,)
            if len(accounts):
                out[subreddit.name][rel.replace('_id', '')] = accounts

    dump_to_file('subreddits', out)

    links = Link._query(data=True)
    links._sort = asc('_date')
    links = list(fetch_things2(links))
    print "links: ", len(links)

    out = {}
    # TODO: Votes
    for link in links:
        out[int(link._id)] = thing_to_dict(link)

    dump_to_file('links', out)

    comments = Comment._query(data=True)
    comments._sort = asc('_date')
    comments = list(fetch_things2(comments))
    print "comments: ", len(comments)

    out = {}
    # TODO: Votes
    for comment in comments:
        out[int(comment._id)] = thing_to_dict(comment)
        out[int(comment._id)]['author'] = comment.author_slow.name
        out[int(comment._id)]['subreddit'] = comment.subreddit_slow.name
    dump_to_file('comments', out)

    # wiki
    # WikiPagesBySR.query([sr._id36]