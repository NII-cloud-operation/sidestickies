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
                                    cookie={'connect.sid': 'secret'})
