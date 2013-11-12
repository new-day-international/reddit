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

from r2.models import *
from r2.lib.utils import fetch_things2
from pylons import g
from r2.lib.db import queries


import string, inspect, os, pprint
import random
import yaml

def load_fixture(thing_type):
    fixtures_dir_path = os.path.join(os.path.dirname(os.path.abspath(inspect.getsourcefile(load_fixture))), '../tests/fixtures')
    return yaml.safe_load(open(os.path.join(fixtures_dir_path, '%s.yml' % (thing_type,))))

def load_fixtures(num_votes = 10):
    accounts = []
    for name, account_data in load_fixture('accounts').items():
        print "creating account %r" % (name,)
        try:
            a = Account._by_name(name)
        except NotFound:
            a = Account(name=name, password=bcrypt_password(account_data['password']))
            # new accounts keep the profanity filter settings until opting out
        for key, val in account_data.items():
            if key in ('password',):
                continue
            setattr(a, key, val)
        a._commit()

        # clear the caches
        Account._by_name(name, _update = True)
        Account._by_name(name, allow_deleted = True, _update = True)
        accounts.append(a)

    for name, subreddit_data in load_fixture('subreddits').items():
        print "creating subreddit %r" % (name,)
        try:
            sr = Subreddit._by_name(name)
        except NotFound:
            author = Account._by_name(subreddit_data['author'])
            sr = Subreddit._new(name = name, 
                title = subreddit_data['title'], 
                author_id = author._id, 
                ip = subreddit_data['ip'])

        for key, val in subreddit_data.items():
            if key in ('author', 'ip', 'title', 'subscribers'):
                continue
            if val is None or val == '':
                continue
            setattr(sr, key, val)
        sr._downs = 10
        sr._commit()

        for sub_name in subreddit_data.get('subscribers', []):
            subscriber = Account._by_name(sub_name)
            Subreddit.subscribe_defaults(subscriber)
            if sr.add_subscriber(subscriber):
                sr._incr('_ups', 1)
            queries.changed(sr, True)

        for mod_name in subreddit_data.get('moderators', []):
            moderator = Account._by_name(mod_name)
            sr.add_moderator(moderator)

    # defined here so it has access to the 'authors' var
    def load_comments(link, comments, parent_comment=None):
        for comment_data in comments:
            comment_author = Account._by_name(comment_data['author'])
            (c, inbox_rel) = Comment._new(comment_author, link, parent_comment, comment_data['body'], comment_data['ip'])
            queries.new_comment(c, inbox_rel)

            for i in range(int(random.betavariate(2, 8) * 10)):
                another_user = random.choice(accounts)
                v = Vote.vote(another_user, c, True, '127.0.0.1')
                queries.new_vote(v)
            
            if comment_data.has_key('comments'):
                load_comments(link, comment_data['comments'], c)

    for link_label, link_data in load_fixture('links').items():
        print "creating link for %r" % (link_data['title'],)
        author = Account._by_name(link_data['author'])
        sr = Subreddit._by_name(link_data['sr'])
        link = Link._submit(link_data['title'], link_data['url'], author, sr, link_data['ip'])
        for key, val in link_data.items():
            if key in ('title', 'url', 'author', 'sr', 'comments'):
                continue
            if val is None or val == '':
                continue
            setattr(link, key, val)
        link._commit()
        queries.new_link(link)

        like = random.randint(50,100)
        for i in range(int(random.betavariate(2, 8) * 5 * num_votes)):
            user = random.choice(accounts)
            v = Vote.vote(user, link, random.randint(0, 100) <= like, '127.0.0.1')
            queries.new_vote(v)
        if link_data.has_key('comments'):
            load_comments(link, link_data['comments'])

    queries.worker.join()

