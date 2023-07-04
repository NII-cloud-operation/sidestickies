import json
import re
import urllib
from urllib.parse import urlencode, quote
from tornado.httpclient import HTTPRequest, AsyncHTTPClient
from traitlets import Unicode

from ..base import BaseAPI


class ScrapboxAPI(BaseAPI):

    ENDPOINT_URL = 'https://scrapbox.io/'

    cookie_connect_sid = Unicode(help='connect.sid of your cookie') \
                             .tag(config=True)

    project_id = Unicode(help='project ID of your project').tag(config=True)

    cell_filename = Unicode(help='filename of code area',
                            default_value='cell.py').tag(config=True)

    def __init__(self, **kwargs):
        super(ScrapboxAPI, self).__init__(**kwargs)

    async def get_summary(self, meme):
        links = await self._get(meme)
        page_content = None
        related = {'1': [], '2': []}
        if links is not None:
            if links['persistent']:
                page_content = self.collect_content({'user': links['user']},
                                                    links)
            related['1'] = self.get_relates(links['relatedPages']['links1hop'])
            related['2'] = self.get_relates(links['relatedPages']['links2hop'])
        summary = await self.summarize(meme, page_content, related)
        return dict(summary=summary, page_content=page_content, related=related)

    def collect_content(self, page, links):
        for item in ['id', 'title', 'updated', 'accessed', 'image',
                     'descriptions']:
            page[item] = links[item]
        for item in ['lines']:
            if item in links:
                page[item] = links[item]
        return page

    def get_relates(self, links):
        return [self.collect_content({}, l) for l in links]

    async def summarize(self, meme, page, related):
        has_page = 1 if page is not None else 0
        count = len(related['1']) + len(related['2']) + has_page
        if page is not None:
            p = page
        elif len(related['1']) > 0:
            p = related['1'][0]
        elif len(related['2']) > 0:
            p = related['2'][0]
        else:
            return None
        if 'lines' in p:
            has_code = len([desc
                            for desc in p['lines']
                            if self._has_code(desc['text'])]) > 0
        else:
            self.log.info('No lines(maybe relatedPages): {}'.format(p['title']))
            details = await self._get(p['title'])
            has_code = len([desc
                            for desc in details['lines']
                            if self._has_code(desc['text'])]) > 0
        return {'description': self.summarized_desc(meme, p),
                'page_url': self._get_view_url(p['title']),
                'title': p['title'],
                'has_code': has_code,
                'count': '{}'.format(count)}

    def summarized_desc(self, meme, page):
        from ..handler import parse_cell_id
        uuid_meme, _ = parse_cell_id(meme)
        meme_regexp = re.compile(uuid_meme + r'(-[0-9]+(-[0-9a-fA-F]{4}){1,10})?')
        if len(re.sub(meme_regexp, '', page['title']).strip()) > 0:
            return re.sub(meme_regexp, '', page['title']).strip()
        desc = page['descriptions']
        code_block = re.compile(r'^\S+')
        while len(desc) > 0 and (desc[0].strip() == '' or
                                 desc[0].startswith('code:')):
            if desc[0].startswith('code:'):
                count = [i for i, l in enumerate(desc[1:])
                         if not code_block.search(l)]
                if len(count) > 0:
                    desc = desc[count[0]:]
            desc = desc[1:]
        if len(desc) == 0:
            return ''
        return re.sub('#' + uuid_meme + r'(-[0-9]+(-[0-9a-fA-F]{4}){1,10})?', '', desc[0]).strip()

    def _has_code(self, text):
        return text.startswith('code:cell.') or text.strip() == 'code:toc.md'

    async def _get(self, meme):
        if not self.project_id:
            raise IOError('project_id not set')
        url = self._scrapbox_endpoint('pages/{}/{}'.format(self.project_id,
                                                           urllib.parse.quote(meme, safe="")))
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

    def _get_view_url(self, title):
        if not self.project_id:
            raise IOError('project_id not set')
        return self.ENDPOINT_URL + self.project_id + '/' + quote(title)

    def get_create_url(self, title, body, max_content_length=1024):
        if len(body) > max_content_length:
            body = body[:max_content_length]
        return self._get_view_url(title) + \
               '?' + urlencode({'body': body}, quote_via=quote)

    def get_default_content(self, cell):
        if cell['cell_type'] == 'code':
            lines = cell['source'].split('\n')
            code = 'code:' + self.cell_filename + '\n' + \
                   '\n'.join(['  ' + l for l in lines])
            return code + '\n'
        elif cell['cell_type'] == 'markdown':
            lines = cell['source'].split('\n')
            code = 'code:cell.md\n' + '\n'.join(['  ' + l for l in lines])
            return code + '\n'
        else:
            return ''

    def _scrapbox_endpoint(self, api_endpoint):
        if api_endpoint.startswith('/'):
            api_endpoint = api_endpoint[1:]
        return self.ENDPOINT_URL + 'api/' + api_endpoint
