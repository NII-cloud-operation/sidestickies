import json
from urllib.parse import urlencode, quote
from tornado.httpclient import HTTPRequest, AsyncHTTPClient
from traitlets import Unicode
from traitlets.config import LoggingConfigurable


class ScrapboxAPI(LoggingConfigurable):

    ENDPOINT_URL = 'https://scrapbox.io/'

    cookie_connect_sid = Unicode(help='connect.sid of your cookie') \
                             .tag(config=True)

    project_id = Unicode(help='project ID of your project').tag(config=True)

    cell_filename = Unicode(help='filename of code area',
                            default_value='cell.py').tag(config=True)

    def __init__(self, **kwargs):
        super(ScrapboxAPI, self).__init__(**kwargs)

    async def get(self, meme):
        url = self._scrapbox_endpoint('pages/{}/{}'.format(self.project_id,
                                                               meme))
        http_client = AsyncHTTPClient()
        if self.cookie_connect_sid:
            req = HTTPRequest(url=url, headers={'Cookie': f'connect.sid={self.cookie_connect_sid}'})
        else:
            req = HTTPRequest(url=url)
        resp = await http_client.fetch(req, raise_error=False)
        if resp.code == 404:
            return None
        if resp.error is not None:
            raise resp.error
        return json.loads(resp.body)

    def get_view_url(self, title):
        return self.ENDPOINT_URL + self.project_id + '/' + quote(title)

    def get_create_url(self, title, body, max_content_length=1024):
        if len(body) > max_content_length:
            body = body[:max_content_length]
        return self.get_view_url(title) + \
               '?' + urlencode({'body': body}, quote_via=quote)

    def _scrapbox_endpoint(self, api_endpoint):
        if api_endpoint.startswith('/'):
            api_endpoint = api_endpoint[1:]
        return self.ENDPOINT_URL + 'api/' + api_endpoint
