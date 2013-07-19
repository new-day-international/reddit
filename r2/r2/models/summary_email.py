# -*- coding: utf-8 -*-
__author__ = 'myers'


import sqlalchemy as sa
from r2.lib.db import tdb_sql
from pylons import g, c, request
from r2.models import Account, Frontpage, Subreddit
from r2.controllers.listingcontroller import ActiveController
from r2.lib.template_helpers import JSPreload

# 4.      Daily Summary Email:
#
#       a.      For all subscribed SPACES  sorted By SPACE and then by most recently
#               active.  Pride:  Rating, title (as link to Item),  creator, count of new comments in last 24 hours
#
#       b.      For ALL SPACES – new Items, sorted by SPACE:  Rating, title (as link to Item),  total comments
#
#       c.      All new SPACES world readable (ie not "restricted") in last 24 hours.
#

# TODO: Make a better html template with css embedded and no js
# TODO: find only accounts we haven't sent a email in the last 24 hours
# TODO: record when we sent an email

def send_summary_emails():
    metadata = tdb_sql.make_metadata(g.dbm.type_db)
    table = tdb_sql.get_data_table(metadata, 'account')
    for ii in sa.select([table]).where(table.c.key == 'email').execute():
        send_account_summary_email(ii.thing_id)

def send_account_summary_email(account_thing_id):
    account = Account._byID(account_thing_id, data=True)

    controller = ActiveController()

    # set globals that are needed to render this page.  I figured out what needed to be set by trial and error
    c.site = Frontpage
    c.user = account
    c.content_langs = 'en-US'
    c.js_preload = JSPreload()
    c.render_style = "email"
    request.get = {}
    request.fullpath = '/'
    request.environ['pylons.routes_dict'] = {'action': 'mailing_list'}
    controller.render_params['loginbox'] = False
    controller.render_params['enable_login_cover'] = False

    page = controller.build_listing(10, None, False, 5)

    with open('out.html', 'w') as ff:
        ff.write(page)
    #email(account.email, "Today's news", page)
    # print account

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