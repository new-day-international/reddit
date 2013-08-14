# -*- coding: utf-8 -*-
__author__ = 'myers'

import pprint, os, datetime, pytz
# monkey
import sqlalchemy as sa
from r2.lib.db import tdb_sql
from pylons import g, c, request
from r2.models import Account, Frontpage, Subreddit, Thing, Link, Comment
from r2.controllers.listingcontroller import ActiveController
from r2.lib.template_helpers import JSPreload
from r2.lib.db.operators import asc, desc, timeago
from r2.lib.utils import fetch_things2, flatten
from r2.lib import amqp

from mako.template import Template


def send_summary_emails():
    metadata = tdb_sql.make_metadata(g.dbm.type_db)
    table = tdb_sql.get_data_table(metadata, 'account')
    for ii in sa.select([table]).where(table.c.key == 'email').execute():
        send_account_summary_email(ii.thing_id)

def send_account_summary_email(account_thing_id):
    account = Account._byID(account_thing_id, data=True)
    # Find accounts that haven't gotten an email in the last 24 hours
    a_day_ago = datetime.datetime.now(pytz.utc) - datetime.timedelta(hours=24)
    
    # if we've never sent an email, only tell about the last 24 hours
    if getattr(account, 'last_email_sent_at', None) is None:
        account.last_email_sent_at = a_day_ago
    elif account.last_email_sent_at > a_day_ago:
        return

    #controller = ActiveController()

    # set globals that are needed to render this page.  I figured out what needed to be set by trial and error
    #c.site = Frontpage
    c.content_langs = 'en-US'
    #c.js_preload = JSPreload()
    #c.render_style = "email"
    # request.get = {}
    # request.fullpath = '/'
    # request.environ['pylons.routes_dict'] = {'action': 'mailing_list'}
    # controller.render_params['loginbox'] = False
    # controller.render_params['enable_login_cover'] = False

    # page = controller.build_listing(10, None, False, 5)

    # Find all the "active" links for this user.  Frontpage uses the c.user global
    # to find the right subreddits for the current user
    c.user = account
    c.user_is_loggedin = True
    thing_ids = []
    for link in Frontpage.get_links('active', 'all'):
        thing_ids.append(link)
    active_links_hash = Link._by_fullname(thing_ids, data=True)

    active_links = [active_links_hash[t_id] for t_id in thing_ids if active_links_hash[t_id]._active > account.last_email_sent_at]
    idx = 0
    for ll in active_links:
        idx += 1
        ll.num = idx 
    # for ll in active_links:
    #     # pprint.pprint(dir(ll))
    #     #print ll.author_slow.name
    #     pprint.pprint(dir(ll.author_slow))
    #     #raise 'hell'


    # Find all new spaces created since we last sent the user an email
    new_spaces = list(fetch_things2(Subreddit._query(
        Subreddit.c._date > account.last_email_sent_at,
        sort=asc('_date'))))

    html_email_template = g.mako_lookup.get_template('summary_email.html')
    html_body = html_email_template.render(
        last_email_sent_at=account.last_email_sent_at,
        new_spaces=new_spaces, 
        active_links=active_links)
    # with open('out.html', 'w') as ff:
    #     ff.write(html_body)
    email(account.email, "Today's news", html_body)

    account.last_email_sent_at = datetime.datetime.now(pytz.utc)
    account._commit()


def reset_last_email_sent_at_for_all_accounts():
    metadata = tdb_sql.make_metadata(g.dbm.type_db)
    table = tdb_sql.get_data_table(metadata, 'account')
    for row in sa.select([table]).where(table.c.key == 'email').execute():
        account = Account._byID(row[0], data=True)
        account.last_email_sent_at = None
        account._commit()


import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def email(address, subject, html_body):
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = g.daily_email_from
    msg['To'] = address

    html_part = MIMEText(html_body.encode('utf-8'), 'html')
    msg.attach(html_part)

    server = smtplib.SMTP(g.smtp_server)
    server.starttls()
    server.login(g.smtp_username, g.smtp_password)
    server.sendmail(g.daily_email_from, address, msg.as_string())
    server.quit()

# An short running upstart job, triggered by cron
def queue_summary_emails():
    # find all accounts that should get an email

    # this implementation is slow, as it iterates over all accounts that have an email
    # address.  One idea to make it faster is to turn the "last_email_sent_at" data 
    # attribute into an actual sql column you can query

    metadata = tdb_sql.make_metadata(g.dbm.type_db)
    table = tdb_sql.get_data_table(metadata, 'account')
    for ii in sa.select([table]).where(table.c.key == 'email').execute():
        # using _add_item over add_item as that skips using a daemon thread to talk
        # to the amqp server that might not finish it's job before the process exits
        amqp._add_item('summary_email_q', str(ii.thing_id))

# Run from upstart job as a rabbitmq consumer.
def run_summary_email_q(verbose=False):
    queue_name = 'summary_email_q'

    @g.stats.amqp_processor(queue_name)
    def _run_summary_email(msg):
        account_thing_id = int(msg.body)
        send_account_summary_email(account_thing_id)

    amqp.consume_items(queue_name, _run_summary_email, verbose=verbose)


