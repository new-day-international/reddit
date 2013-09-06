import unittest

from r2.tests import TestCaseSnakeCaseMethods, RedditTestCase
from r2.lib import s3_helpers

from mock import Mock, PropertyMock, MagicMock, patch, call
from boto.s3.bucket import Bucket

class S3HelperTest(unittest.TestCase, TestCaseSnakeCaseMethods):
    def create_key_mock(self, key_name):
        m = Mock(name="mock_key: %r" % (key_name,))
        m.configure_mock(name=key_name)
        return m

    @patch('r2.lib.s3_helpers.get_user_upload_bucket')
    def test_find_nonconflicting_key(self, mock_bucket_factory):
        mock_bucket_factory.return_value = Mock(name="mock_bucket", spec=Bucket, **{
            'list.return_value': [
                self.create_key_mock("space/TestSpace/filename.txt"),
                self.create_key_mock("space/TestSpace/filename.1.txt"),
            ]
        })
        self.assert_equal("space/TestSpace/filename.2.txt", s3_helpers.find_nonconflicting_key('space/TestSpace/filename.txt'))

    @patch('r2.lib.s3_helpers.g')
    @patch('r2.lib.s3_helpers.get_user_upload_bucket')
    def test_rename_user_submitted_file_to_space(self, mock_bucket_factory, mock_g):
        mock_g.configure_mock(s3_user_files_host="files.host")
        mock_old_key = self.create_key_mock("space/TestSpace/filename.txt")
        mock_bucket = Mock(name="mock_bucket", spec=Bucket, **{
            'get_key.return_value': mock_old_key,
            'list.return_value': [
                self.create_key_mock("space/TestSpace/filename.txt"),
                self.create_key_mock("space/TestSpace/filename.1.txt"),
            ]
        })
        mock_bucket_factory.return_value = mock_bucket
        mock_sr = Mock()
        mock_sr.configure_mock(name='TestSpace')
        new_key_url = s3_helpers.rename_user_submitted_file_to_space('http://files.host/u/filename.txt', mock_sr)
        self.assert_equal('http://files.host/space/TestSpace/filename.2.txt', new_key_url)
        mock_old_key.assert_has_calls([
            call.copy(mock_bucket, 'space/TestSpace/filename.2.txt'),
            call.delete()
        ])
