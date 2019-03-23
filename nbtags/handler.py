from notebook.base.handlers import IPythonHandler
from tornado import web
import json
import itertools
import re
from nbtags.scrapbox import ScrapboxAPI


class CellTagsHandler(IPythonHandler):
    def initialize(self, nb_app):
        self.nb_app = nb_app

    @web.authenticated
    def get(self, meme):
        sbapi = ScrapboxAPI(parent=self.nb_app)
        links = sbapi.get(meme)
        page_content = None
        if links['persistent']:
            page_content = self.collect_content({'user': links['user']},
                                                links)
        related = {}
        related['1'] = self.get_relates(links['relatedPages']['links1hop'])
        related['2'] = self.get_relates(links['relatedPages']['links2hop'])

        summary = self.summarize(meme, page_content, related)

        self.finish(dict(meme=meme, page=page_content, related_pages=related,
                         summary=summary))

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

    def summarize(self, meme, page, related):
        sbapi = ScrapboxAPI(parent=self.nb_app)
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
                            if desc['text'].startswith('code:')]) > 0
        else:
            self.log.info('No lines(maybe relatedPages): {}'.format(p['title']))
            details = sbapi.get(p['title'])
            has_code = len([desc
                            for desc in details['lines']
                            if desc['text'].startswith('code:')]) > 0
        return {'description': self.summarized_desc(meme, p, count),
                'page_url': sbapi.get_view_url(p['title']),
                'title': p['title'],
                'has_code': has_code}

    def summarized_desc(self, meme, page, count):
        if len(page['title'].replace(meme, '').strip()) > 0:
            desc = page['title'].replace(meme, '').strip()
            return desc + (' ({})'.format(count) if count > 1 else '')
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
            return None
        desc = desc[0].replace('#' + meme, '').strip()
        if len(desc) == 0:
            return None
        return desc + (' ({})'.format(count) if count > 1 else '')


class CellCreateURLHandler(IPythonHandler):
    def initialize(self, nb_app):
        self.nb_app = nb_app

    @web.authenticated
    def get(self):
        cell = json.loads(self.get_query_argument('cell'))
        self.log.info('Cell: {}'.format(cell))
        meme = cell['metadata']['lc_cell_meme']['current']
        if self.get_query_argument('mode', default='new') != 'edit':
            tag = '\n\n#{}'.format(meme)
        else:
            tag = ''

        sbapi = ScrapboxAPI(parent=self.nb_app)
        title = self.get_query_argument('title', default=meme)
        url = sbapi.get_create_url(title, self._get_content(cell) + tag)

        self.redirect(url)

    def _get_content(self, cell):
        if cell['cell_type'] == 'code':
            lines = cell['source'].split('\n')
            code = 'code:cell.py\n' + '\n'.join(['  ' + l for l in lines])
            return code + '\n'
        elif cell['cell_type'] == 'markdown':
            lines = cell['source'].split('\n')
            code = 'code:cell.py\n' + '\n'.join(['  ' + l for l in lines])
            return code + '\n'
        else:
            return ''
