import requests
from mock import patch
from nbtags.scrapbox import ScrapboxAPI


@patch.object(requests, 'get')
def test_get(requests_get):
    sbapi = ScrapboxAPI()
    sbapi.cookie_connect_sid = 'secret'
    sbapi.project_id = 'some_project'
    sbapi.get('some-meme')
    requests_get.assert_called_with('https://scrapbox.io/api/pages/'
                                    'some_project/some-meme',
                                    cookies={'connect.sid': 'secret'})

@patch.object(requests, 'get')
def test_get_from_public(requests_get):
    sbapi = ScrapboxAPI()
    sbapi.project_id = 'some_project'
    sbapi.get('some-meme')
    requests_get.assert_called_with('https://scrapbox.io/api/pages/'
                                    'some_project/some-meme')

def test_get_view_url():
    sbapi = ScrapboxAPI()
    sbapi.project_id = 'some_project'
    base_url = 'https://scrapbox.io/some_project/'
    assert sbapi.get_view_url('Foo') == base_url + 'Foo'
    assert sbapi.get_view_url('Foo Bar') == base_url + 'Foo%20Bar'

def test_get_create_url():
    sbapi = ScrapboxAPI()
    sbapi.project_id = 'some_project'
    base_url = 'https://scrapbox.io/some_project/'
    body = 'Body'
    assert sbapi.get_create_url('Foo', body) == base_url + 'Foo?body=' + body
    body = 'Body 2'
    abody = 'Body%202'
    assert sbapi.get_create_url('Foo', body) == base_url + 'Foo?body=' + abody
    body = ''.join(['{}'.format(i % 10) for i in range(0, 1025)])
    abody = body[:1024]
    assert sbapi.get_create_url('Foo Bar', body) == base_url + \
           'Foo%20Bar?body=' + abody
