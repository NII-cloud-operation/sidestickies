import json
import re
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

    async def get_summary(self, meme, headings=None):
        # Build Lucene query with OR operator
        query_parts = [f'hash:"#{meme}"']

        heading_titles = set()

        # Add heading queries if provided
        if headings:
            for heading in headings:
                # Convert markdown heading to hashtag format
                # "# Title" -> "#Title", "## Subtitle" -> "#Subtitle"
                heading_tag = self._heading_to_hashtag(heading)
                query_parts.append(f'hash:"{heading_tag}"')
                heading_text = self._heading_text(heading)
                if heading_text:
                    heading_titles.add(heading_text)
                    escaped_title = self._escape_lucene(heading_text)
                    query_parts.append(f'title:"{escaped_title}"')

        # Join with OR operator
        search_query = ' OR '.join(query_parts)

        url = self._endpoint('ep_weave/api/search?q={}'.format(urllib.parse.quote(search_query, safe="")), api=True)
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
        shorttext = pad.get('shorttext')
        if shorttext and (desc == meme or desc in heading_titles):
            desc = shorttext.split('\n')[0]
        return {
            'summary': {
                'description': desc,
                'page_url': self._endpoint('p/' + pad['id']),
                'title': pad['title'],
                'has_code': False,
                'count': num_found,
            },
        }

    def _heading_to_hashtag(self, heading):
        """Convert markdown heading to hashtag format
        "# Title" -> "#Title"
        "## Subtitle" -> "#Subtitle"
        """
        # Remove leading hashes and spaces, then add single hash
        text = heading.lstrip('#').strip()
        return f'#{text}'

    def _heading_text(self, heading):
        return heading.lstrip('#').strip()

    def _escape_lucene(self, text):
        return text.replace('"', '\\"')

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

            # Extract headings and convert to hashtags
            hashtags = []
            for line in lines:
                # Match lines that start with one or more # followed by a space
                match = re.match(r'^(#+)\s+(.+)', line)
                if match:
                    heading_text = match.group(2).strip()
                    hashtags.append(f'#{heading_text}')

            code = '```\n' + '\n'.join(lines) + '\n```'

            # Add hashtags at the beginning if any headings were found
            if hashtags:
                hashtag_line = ' '.join(hashtags) + '\n\n'
                return hashtag_line + code + '\n'
            else:
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
