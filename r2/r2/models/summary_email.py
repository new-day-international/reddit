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
from pylons.i18n import _
from mako.template import Template

from time import strftime

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# useful for testing sending emails: paster run run.ini r2/models/summary_email.py -c 'test_send_summary_emails()'
def test_send_summary_emails():
    accounts = fetch_things2(Account._query(Account.c.email != None, sort=asc('_date')))
    for account in accounts:
        a_day_ago = datetime.datetime.now(pytz.utc) - datetime.timedelta(hours=24)
        account.last_email_sent_at = a_day_ago
        account._commit()
        send_account_summary_email(account._id, verbose=True)

# useful for testing sending emails: paster run run.ini r2/models/summary_email.py -c 'reset_last_email_sent_at_for_all_accounts()'
def reset_last_email_sent_at_for_all_accounts():
    start_of_epoc = pytz.utc.localize(datetime.datetime.utcfromtimestamp(0))

    accounts = fetch_things2(Account._query(Account.c.email != None, sort=asc('_date')))
    for account in accounts:
        account.last_email_sent_at = start_of_epoc
        account._commit()

# An short running crontab launched upstart job
def queue_summary_emails():
    start = datetime.datetime.now()
    # find all accounts that should get an email

    # this implementation is slow, as it iterates over all accounts that have an email
    # address.  One idea to make it faster is to turn the "last_email_sent_at" data 
    # attribute into an actual sql column you can query

    accounts = fetch_things2(Account._query(Account.c.email != None, sort=asc('_date')))
    for account in accounts:
        if should_send_activity_summary_email(account):
            # using _add_item over add_item as that skips using a daemon thread to talk
            # to the amqp server that might not finish it's job before the process exits
            amqp._add_item('summary_email_q', str(account._id))
    end = datetime.datetime.now()
    print "Time to scan accounts to queue emails: %s" % (end - start)

# Run from upstart job as a rabbitmq consumer.
def run_summary_email_q(verbose=False):
    queue_name = 'summary_email_q'

    @g.stats.amqp_processor(queue_name)
    def _run_summary_email(msg):
        account_thing_id = int(msg.body)
        send_account_summary_email(account_thing_id)

    amqp.consume_items(queue_name, _run_summary_email, verbose=verbose)

def should_send_activity_summary_email(account):
    if not account.pref_send_activity_summary_email:
        return False

    about_a_day_ago = datetime.datetime.now(pytz.utc) - datetime.timedelta(hours=23)

    start_of_epoc = pytz.utc.localize(datetime.datetime.utcfromtimestamp(0))
    if getattr(account, 'last_email_sent_at', start_of_epoc) > about_a_day_ago:
        return False
    # if not getattr(account, 'email_verified', False):
    #     return False

    return True

def send_account_summary_email(account_thing_id, verbose=False):
    account = Account._byID(account_thing_id, data=True)
    if not should_send_activity_summary_email(account):
        return

    # if we've never sent an email, only tell about the last 24 hours
    a_day_ago = datetime.datetime.now(pytz.utc) - datetime.timedelta(hours=24)
    if getattr(account, 'last_email_sent_at', None) is None:
        account.last_email_sent_at = a_day_ago

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

    # don't bother sending email if there's noting to report.
    if len(new_spaces) == 0 and len(active_links) == 0:
        return

    # Get the date and time
    date_string = strftime("%A %B %d, %Y")
    time_string = strftime("%I:%M %p")

    # Render the template
    html_email_template = g.mako_lookup.get_template('summary_email.html')
    html_body = html_email_template.render(
        last_email_sent_at=account.last_email_sent_at,
        new_spaces=new_spaces, 
        active_links=active_links,
        date_string=date_string,
        time_string=time_string)

    # with open('out.html', 'w') as ff:
    #     ff.write(html_body)
    if verbose:
        print "sending email to %s" % (account.email,)
    send_email(account.email, html_body, date_string)

    account.last_email_sent_at = datetime.datetime.now(pytz.utc)
    account._commit()

def send_email(address, html_body,date_string):
    msg = MIMEMultipart('alternative')
    msg['Subject'] = _("Lightnet summary for %s") % date_string
    msg['From'] = '"%s" <%s>' % (g.summary_email_from_name, g.share_reply,)
    msg['To'] = address

    html_part = MIMEText(html_body.encode('utf-8'), 'html', 'utf-8')
    msg.attach(html_part)

    server = smtplib.SMTP(g.smtp_server)
    server.starttls()
    server.login(g.smtp_username, g.smtp_password)
    server.sendmail(g.share_reply, address, msg.as_string())
    server.quit()

