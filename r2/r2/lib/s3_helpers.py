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

import os
import sys
import simplejson 

from boto.s3.key import Key

HADOOP_FOLDER_SUFFIX = '_$folder$'


def _to_path(bucket, key):
    if not bucket:
        raise ValueError
    return 's3://%s/%s' % (bucket, key)


def _from_path(path):
    """Return bucket and key names from an s3 path.

    Path of 's3://BUCKET/KEY/NAME' would return 'BUCKET', 'KEY/NAME'.

    """

    if not path.startswith('s3://'):
        raise ValueError('Bad S3 path %s' % path)

    r = path[len('s3://'):].split('/', 1)
    bucket = key = None

    if len(r) == 2:
        bucket, key = r[0], r[1]
    else:
        bucket = r[0]

    if not bucket:
        raise ValueError('Bad S3 path %s' % path)

    return bucket, key


def get_text_from_s3(s3_connection, path):
    """Read a file from S3 and return it as text."""
    bucket_name, key_name = _from_path(path)
    bucket = s3_connection.get_bucket(bucket_name)
    k = Key(bucket)
    k.key = key_name
    txt = k.get_contents_as_string()
    return txt


def mv_file_s3(s3_connection, src_path, dst_path):
    """Move a file within S3."""
    src_bucket_name, src_key_name = _from_path(src_path)
    dst_bucket_name, dst_key_name = _from_path(dst_path)

    src_bucket = s3_connection.get_bucket(src_bucket_name)
    k = Key(src_bucket)
    k.key = src_key_name
    k.copy(dst_bucket_name, dst_key_name)
    k.delete()


def s3_key_exists(s3_connection, path):
    bucket_name, key_name = _from_path(path)
    bucket = s3_connection.get_bucket(bucket_name)
    key = bucket.get_key(key_name)
    return bool(key)


def copy_to_s3(s3_connection, local_path, dst_path, verbose=False):
    def callback(trans, total):
        sys.stdout.write('%s/%s' % trans, total)
        sys.stdout.flush()

    dst_bucket_name, dst_key_name = _from_path(dst_path)
    bucket = s3_connection.get_bucket(dst_bucket_name)

    filename = os.path.basename(local_path)
    if not filename:
        return

    key_name = os.path.join(dst_key_name, filename)
    k = Key(bucket)
    k.key = key_name

    kw = {}
    if verbose:
        print 'Uploading %s to %s' % (local_path, dst_path)
        kw['cb'] = callback

    k.set_contents_from_filename(logfile, **kw)


# adapted from http://aws.amazon.com/articles/1434?_encoding=UTF8&jiveRedirect=1
import base64
import hmac, hashlib
def encode_and_sign_upload_policy(policy, aws_secret_key):
    encoded_policy = base64.b64encode(simplejson.dumps(policy).replace('\n', '').replace('\r', ''))
    encoded_policy_signature = base64.b64encode(hmac.new(aws_secret_key, encoded_policy, hashlib.sha1).digest())
    return encoded_policy, encoded_policy_signature

import threading

def get_user_upload_bucket():
    local_thread = threading.local()
    if not hasattr(local_thread, 'user_upload_bucket'):
        connection = S3Connection(g.S3KEY_ID or None, g.S3SECRET_KEY or None)
        local_thread.user_upload_bucket = connection.get_bucket(g.s3_user_files_bucket, validate=True)
    return local_thread.user_upload_bucket

from boto.s3.connection import S3Connection
from pylons import g
def list_user_uploads_bucket(username):
    rs = bucket.list(prefix='u/%s/' % (username,))

    for key in rs:
        print key.name, key.size

def find_nonconflicting_key(key_name):
    """
    If they've already uploaded a file named "u/User/file.txt" we don't
    want them to overwrite that file.  A second upload with the 
    same name should be "u/User/file.1.text"
    """
    base, ext = os.path.splitext(key_name)
    rs = get_user_upload_bucket().list(prefix=base)
    key_names = [key.name for key in rs]

    counter = 0
    while key_name in key_names:
        counter += 1
        key_name = "%s.%s%s" % (base, counter, ext)
    return key_name

def rename_user_submitted_file_to_space(url, subreddit):
    bucket = get_user_upload_bucket()
    user_files_url = "http://%s/" % (g.s3_user_files_host,)
    assert url.startswith(user_files_url)
    key_name = url[len(user_files_url):]
    base, filename = os.path.split(key_name)
    new_key_name = find_nonconflicting_key("space/%s/%s" % (subreddit.name, filename,))
    old_key = bucket.get_key(key_name)
    old_key.copy(bucket, new_key_name)
    old_key.delete()
    new_key_url = "%s%s" % (user_files_url, new_key_name,)
    return new_key_url

