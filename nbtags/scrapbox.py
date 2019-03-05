import requests
from traitlets import Unicode
from traitlets.config import LoggingConfigurable


class ScrapboxAPI(LoggingConfigurable):

    cookie_connect_sid = Unicode(help='connect.sid of your cookie') \
                             .tag(config=True)

    project_id = Unicode(help='project ID of your project').tag(config=True)

    def __init__(self, **kwargs):
        super(ScrapboxAPI, self).__init__(**kwargs)

    def get(self, meme):
        url = self._scrapbox_endpoint('pages/{}/{}'.format(self.project_id,
                                                               meme))
        resp = requests.get(url, cookies={'connect.sid': self.cookie_connect_sid})
        return resp.json()

    def _scrapbox_endpoint(self, api_endpoint):
        if api_endpoint.startswith('/'):
            api_endpoint = api_endpoint[1:]
        return 'https://scrapbox.io/api/' + api_endpoint
