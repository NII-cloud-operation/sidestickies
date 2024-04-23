import json
import urllib
from urllib.parse import urlencode, quote
from tornado.httpclient import HTTPRequest, AsyncHTTPClient
from traitlets import Unicode

from ..base import BaseAPI


class EpWeaveAPI(BaseAPI):

    apikey = Unicode(help='The value of APIKEY.txt of your etherpad').tag(config=True)

    url = Unicode(help='The URL of your etherpad').tag(config=True)

    api_url = Unicode(help='The API URL of your etherpad(Default: `url`)').tag(config=True)

    def __init__(self, **kwargs):
        super(EpWeaveAPI, self).__init__(**kwargs)

    async def get_summary(self, meme):
        url = self._endpoint('ep_weave/api/search?q={}'.format(urllib.parse.quote(f'hash:"#{meme}"', safe="")), api=True)
        http_client = AsyncHTTPClient()
        if self.apikey:
            req = HTTPRequest(url=f'{url}&apikey={self.apikey}')
        else:
            req = HTTPRequest(url=url)
        resp = await http_client.fetch(req, raise_error=True)
        self.log.info(f'Result: {resp.body}')
        r = json.loads(resp.body)
        if 'docs' not in r:
            raise ValueError('Invalid response(docs missing): {}'.format(r))
        docs = r['docs']
        if len(docs) == 0:
            return None
        num_found = r['numFound']
        pad = self._get_pad_with_title(meme, docs)
        desc = pad['title']
        if desc == meme and 'shorttext' in pad:
            desc = pad['shorttext'].split('\n')[0]
        return {
            'summary': {
                'description': desc,
                'page_url': self._endpoint('p/' + pad['id']),
                'title': pad['title'],
                'has_code': False,
                'count': num_found,
            },
        }

    def _get_pad_with_title(self, meme, results):
        results_ = [r for r in results if 'title' in r and r['title'] != meme]
        if len(results_) == 0:
            return results[0]
        return results_[0]

    def get_create_url(self, title, body, max_content_length=1024):
        if len(body) > max_content_length:
            body = body[:max_content_length]
        return self._endpoint('t/' + quote(title)) + \
               '?' + urlencode({'body': body}, quote_via=quote)

    def get_default_content(self, cell):
        if cell['cell_type'] == 'code':
            lines = cell['source'].split('\n')
            code = '```\n' + '\n'.join(lines) + '\n```'
            return code + '\n'
        elif cell['cell_type'] == 'markdown':
            lines = cell['source'].split('\n')
            code = '```\n' + '\n'.join(lines) + '\n```'
            return code + '\n'
        else:
            return ''

    def _endpoint(self, api_endpoint, api=False):
        if api_endpoint.startswith('/'):
            api_endpoint = api_endpoint[1:]
        if api and self.api_url:
            url = self.api_url
        else:
            if not self.url:
                raise IOError('url is not set')
            url = self.url
        if url.endswith('/'):
            url = url[:-1]
        return url + '/' + api_endpoint
