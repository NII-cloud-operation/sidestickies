from mock import patch, AsyncMock
from tornado.httpclient import AsyncHTTPClient, HTTPResponse
from pytest import mark
from io import BytesIO

from nbtags.scrapbox import ScrapboxAPI


async def dummy_fetch(req, **kwargs):
    res = HTTPResponse(req, code=200, buffer=BytesIO())
    res._body = '{}'
    return res

@mark.asyncio
@patch.object(AsyncHTTPClient, 'fetch', new_callable=AsyncMock, side_effect=dummy_fetch)
async def test_get(http_client):
    sbapi = ScrapboxAPI()
    sbapi.cookie_connect_sid = 'secret'
    sbapi.project_id = 'some_project'
    await sbapi.get('some-meme')
    assert http_client.call_args is not None
    req = http_client.call_args[0][0]
    assert req.url == 'https://scrapbox.io/api/pages/some_project/some-meme'
    assert str(req.headers) == "{'Cookie': 'connect.sid=secret'}"

@mark.asyncio
@patch.object(AsyncHTTPClient, 'fetch', new_callable=AsyncMock, side_effect=dummy_fetch)
async def test_get_from_public(http_client):
    sbapi = ScrapboxAPI()
    sbapi.project_id = 'some_project'
    await sbapi.get('some-meme')
    assert http_client.call_args is not None
    req = http_client.call_args[0][0]
    assert req.url == 'https://scrapbox.io/api/pages/some_project/some-meme'
    assert str(req.headers) == ''

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
