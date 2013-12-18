# I export data from lightnet to yaml files
# run me with `paster run run.ini r2/lib/exporter.py -c 'export_data()'`

from r2.models import *
from r2.lib.utils import fetch_things2, flatten

import yaml

def dump_to_file(name_of_type, data):
    with file('%s.yml' % (name_of_type,), 'wb') as outfile:
        yaml.dump(data, outfile, Dumper=yaml.CDumper)

def export_data():
    accounts = Account._query(data=True)
    accounts._sort = asc('_date')
    accounts = list(fetch_things2(accounts))
    print "accounts: ", len(accounts)

    # TODO: created at, modified at
    out_accounts = {}
    for account in accounts:
        out_accounts[account.name] = dict(
            name=account.registration_fullname,
            email=account.email,
            profile_photo_uploaded=account.profile_photo_uploaded,
        )

    dump_to_file('accounts', out_accounts)

    spaces = Subreddit._query(data=True)
    spaces._sort = asc('_date')
    spaces = list(fetch_things2(spaces))
    print "spaces: ", len(spaces)

    out_spaces = {}
    for space in spaces:
        out_spaces[space.name] = dict(
            lang=space.lang,
            use_rules_from_space=space.use_rules_from_space,
        )
    dump_to_file('spaces', out_spaces)

    # TODO: created at, modified at
    links = Link._query(data=True)
    links._sort = asc('_date')
    links = list(fetch_things2(links))
    print "links: ", len(links)

    out_links = {}
    # TODO: Votes
    for link in links:
        out_links[int(link._id)] = dict(
            space=link.subreddit_slow.name,
            author=link.author_slow.name,
            kind=link.kind,
            url=link.url,
            title=link.title,
            description=link.selftext.decode('utf-8'),
        )

    dump_to_file('links', out_links)

    comments = Comment._query(data=True)
    comments._sort = asc('_date')
    comments = list(fetch_things2(comments))
    print "comments: ", len(comments)
    out_comments = {}

    # TODO: Votes
    for comment in comments:
        out_comments[int(comment._id)] = dict(
            parent_id=comment.parent_id,
            link_id=comment.link_id,
            body=comment.body,
            ip=comment.ip,
            author=comment.author_slow.name,
        )
    dump_to_file('comments', out_comments)
