from r2.tests import TestCaseSnakeCaseMethods, RedditTestCase

from r2.lib.utils import fetch_things2

class QueriesTest(RedditTestCase, TestCaseSnakeCaseMethods):
    def test_get_links(self):
        from r2.lib.db import queries
        from r2.models import Subreddit, Account, Link, Thing

        account = Account._by_name('reddit_007')
        sr = Subreddit._by_name('reddit_test0')
        link_url = self.make_unique_url()

        new_link = Link._submit("test_get_links", link_url, account, sr, '127.0.0.1', kind='link')
        queries.new_link(new_link, foreground=True)

        res = Thing._by_fullname(queries.get_links(sr, 'new', 'all'), return_dict=False)
        self.assert_true(len(res) > 0, "no links returned")
        self.assert_equal(new_link._id, res[0]._id)

    def test_get_files(self):
        from r2.lib.db import queries
        from r2.models import Subreddit, Account, Link, Thing

        account = Account._by_name('reddit_007')
        sr = Subreddit._by_name('reddit_test0')
        link_url = self.make_unique_url()

        new_link = Link._submit("test_get_files", link_url, account, sr, '127.0.0.1', kind='file')
        queries.new_link(new_link, foreground=True)

        # make sure it returns like a normal link
        res = Thing._by_fullname(queries.get_links(sr, 'new', 'all'), return_dict=False)
        self.assert_true(len(res) > 0, "no links returned")
        self.assert_equal(new_link._id, res[0]._id)

        # should return with a kind = 'file' filter
        res = list(queries.get_files(sr))
        self.assert_true(len(res) > 0, "no links returned")
        self.assert_equal(new_link._id, res[0]._id)



