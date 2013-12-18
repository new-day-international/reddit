# I export data from lightnet to yaml files
# run me with `paster run run.ini r2/lib/exporter.py -c 'export_data()'`

from r2.models import *
from r2.lib.utils import fetch_things2, flatten

import yaml

def export_data():
    accounts = Account._query(data=True)
    accounts._sort = desc('_date')
    accounts = list(fetch_things2(accounts))
    print "accounts: ", len(accounts)

    out_accounts = {}
    for account in accounts:
        out_accounts[account._id] = dict(
            name=account.registration_fullname,
            email=account.email,
            profile_photo_uploaded=account.profile_photo_uploaded,
        )

    with file('accounts.yml', 'wb') as outfile:
        yaml.dump(out_accounts, outfile, Dumper=yaml.CDumper, default_flow_style=False)

    spaces = Subreddit._query(data=True)
    spaces._sort = desc('_date')
    spaces = list(fetch_things2(spaces))
    print "spaces: ", len(spaces)

    out_spaces = {}
    for space in spaces:
        out_spaces[space._id] = dict(
            name=space.name,
            lang=space.lang,
            use_rules_from_space=space.use_rules_from_space,
        )

    with file('spaces.yml', 'wb') as outfile:
        yaml.dump(out_spaces, outfile, Dumper=yaml.CDumper)

    links = Link._query(data=True)
    links._sort = desc('_date')
    links = list(fetch_things2(links))
    print "links: ", len(links)

    out_links = {}
    for link in links:
        out_links[int(link._id)] = dict(
            sr_id=link.sr_id,
            author_id=link.author_id,
            kind=link.kind,
            url=link.url,
            title=link.title,
            description=link.selftext,
        )

    with file('links.yml', 'wb') as outfile:
        yaml.dump(out_links, outfile, Dumper=yaml.CDumper)

    comments = Comment._query(data=True)
    comments._sort = desc('_date')
    comments = list(fetch_things2(comments))
    print "comments: ", len(comments)
    # for comment in comments:
    #     print comment
