from r2.tests import *
import json
import datetime
from mock import Mock, patch, call

from r2.models import summary_email
from r2.models import Account, Link, Subreddit
from r2.lib.db import queries 

class SummaryEmailTest(RedditTestCase):

    def get_test_user(self):
        account = Account._byID(1, data=True)
        if not account.email:
            account.email = 'test@example.com'
            account._commit()
        Subreddit.subscribe_defaults(account)
        return account

    def test_sending_an_email(self):
        sr = Subreddit._by_name('reddit_test0')
        account = self.get_test_user()
        sr.add_subscriber(account)
        self.assertIn(sr._id, account.spaces)

        summary_email.reset_last_email_sent_at_for_all_accounts()
        assert summary_email.should_send_activity_summary_email(account)

        link_url = self.make_unique_url()
        new_link = Link._submit("test_get_links", link_url, account, sr, '127.0.0.1', kind='link')
        queries.new_link(new_link, foreground=True)

        send_email = Mock()
        summary_email.send_account_summary_email(1, send_email=send_email)
        self.assert_equal(1, send_email.call_count)
        self.assert_equal('test@example.com', send_email.call_args[0][0])