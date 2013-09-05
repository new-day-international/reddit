import unittest

from r2.tests import TestCaseSnakeCaseMethods, RedditTestCase
from r2.lib import s3_helpers

from mock import Mock, PropertyMock, MagicMock
from boto.s3.bucket import Bucket

class S3HelperTest(unittest.TestCase, TestCaseSnakeCaseMethods):
    def test_find_nonconflicting_filename(self):
        def create_file_mock(filename):
            m = Mock(name="mock with %r" % (filename,))
            type(m).name = PropertyMock(return_value=filename)
            return m
        mock_bucket = Mock(name="mock_bucket", spec=Bucket, **{'list.return_value': [
            create_file_mock("space/TestSpace/filename.txt"),
            create_file_mock("space/TestSpace/filename.1.txt"),
        ]})
        subreddit_name = "TestSpace"
        self.assert_equal("filename.2.txt", s3_helpers.find_nonconflicting_filename(subreddit_name, "filename.txt", lambda: mock_bucket))
