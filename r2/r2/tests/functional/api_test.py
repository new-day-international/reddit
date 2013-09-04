from r2.tests import *
import json
import datetime

class TestApiController(RedditTestCase):
    default_username = 'reddit_007'
    default_password = 'password'
    default_subreddit = 'reddit_test0'

    def tear_down(self):
        self.app.reset() #clear cookies

    def test_user_upload_permission_requires_a_user(self):
        response = self.api_post('/api/user_upload_permission.json', {})
        response = self.get_json_body(response)
        self.assert_has_error(response, 'USER_REQUIRED')
        # assert len(response['errors']) == 1
        # assert response['errors'][0][0] == 'USER_REQUIRED'

    def test_user_upload_permission_happy_path(self):
        self.login()
        response = self.api_post('/api/user_upload_permission.json', dict(filename='foobar.txt'))
        self.assert_equal('Foobar [TXT]', response['suggested_link_title'])
        self.assert_equal('text/plain', response['content_type'])
        self.assert_equal('text/plain', response['content_type'])
        self.assert_equal('u/%s/foobar.txt' % (self.default_username,), response['key'])

    def test_POST_submit_happy_path_for_self(self):
        self.login()
        response = self.api_post('/api/submit', dict(
            uh=self.default_username,
            title="Test Post",
            kind="self",
            thing_id="",
            text="This is a test posts",
            sr=self.default_subreddit,
            sendreplies="true",
            resubmit="",
            id="#newlink",
            renderstyle='html'))
        response = self.get_json_body(response)
        self.assert_no_errors(response)
        assert response['data'].has_key('url')

    def test_POST_submit_happy_path_for_files(self):
        self.login()
        response = self.api_post('/api/submit', dict(
            uh=self.default_username,
            title="Test File Link",
            kind="file",
            thing_id="",
            url="http://files.host/u/monkey/file%s.txt" % (self.seconds_since_epoc(),),
            sr=self.default_subreddit,
            sendreplies="true",
            resubmit="",
            id="#newlink",
            renderstyle='html'))
        response = self.get_json_body(response)
        self.assert_no_errors(response)
        assert response['data'].has_key('url')

    def test_submitting_files_two_times_in_a_row(self):
        self.login()
        file_url = "http://files.host/u/monkey/file%s.txt" % (self.seconds_since_epoc(),)
        response = self.api_post('/api/submit', dict(
            uh=self.default_username,
            title="Test File Link",
            kind="file",
            thing_id="",
            url=file_url,
            sr=self.default_subreddit,
            sendreplies="true",
            resubmit="",
            id="#newlink",
            renderstyle='html'))
        response = self.get_json_body(response)
        self.assert_no_errors(response)
        assert response['data'].has_key('url')
        response = self.api_post('/api/submit', dict(
            uh=self.default_username,
            title="Test File Link",
            kind="file",
            thing_id="",
            url=file_url,
            sr=self.default_subreddit,
            sendreplies="true",
            resubmit="",
            id="#newlink",
            renderstyle='html'))
        response = self.get_json_body(response)
        self.assert_has_error(response, 'ALREADY_SUB')

    def test_GET_me(self):
        self.login()
        response = self.app.get('/api/me.json')
        self.assert_equal('application/json; charset=UTF-8', response.header('Content-Type'))
        json_response = json.loads(response.response.body.decode('utf-8'))
        self.assert_equal(self.default_username, json_response['data']['name'])

    def assert_has_error(self, response, error):
        assert len(response['errors']) == 1
        assert response['errors'][0][0] == error

    def assert_no_errors(self, response):
        self.assert_equal(0, len(response['errors']), "Errors in response to api call %r" % (response['errors'],))

    def api_post(self, url, params):
        params.update(dict(api_type="json"))
        response = self.app.post(url, params)
        self.assert_equal('application/json; charset=UTF-8', response.header('Content-Type'))
        json_response = json.loads(response.response.body.decode('utf-8'))
        return json_response

    def get_json_body(self, json_response):
        assert len(json_response.keys()) == 1, "%r" % (json_response,)
        assert json_response.has_key(u'json')
        return json_response[u'json']        

    def login(self, username=None, password=None):
        username = username or self.default_username
        password = password or self.default_password
        response = self.api_post('/api/login', dict(
          user=username, 
          passwd=password))
        response = self.get_json_body(response)
        self.assert_no_errors(response)
        return response
        
    def seconds_since_epoc(self):
        return datetime.datetime.now().strftime('%s.%f')

