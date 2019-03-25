from urllib.parse import urlencode, quote_plus
import requests
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

    def get(self, meme):
        url = self._scrapbox_endpoint('pages/{}/{}'.format(self.project_id,
                                                               meme))
        resp = requests.get(url, cookies={'connect.sid': self.cookie_connect_sid})
        return resp.json()

    def get_view_url(self, title):
        return self.ENDPOINT_URL + self.project_id + '/' + quote_plus(title)

    def get_create_url(self, title, body):
        return self.get_view_url(title) + \
               '?' + urlencode({'body': body}, quote_via=quote_plus)

    def _scrapbox_endpoint(self, api_endpoint):
        if api_endpoint.startswith('/'):
            api_endpoint = api_endpoint[1:]
        return self.ENDPOINT_URL + 'api/' + api_endpoint
