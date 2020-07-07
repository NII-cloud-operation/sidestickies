from notebook.base.handlers import IPythonHandler
from tornado import web
import json
import itertools
import re
from nbtags.scrapbox import ScrapboxAPI


class TagsHandler(IPythonHandler):
    def initialize(self, nb_app):
        self.nb_app = nb_app

    @web.authenticated
    async def get(self, target, meme):
        self.log.info('Tags: {}, {}'.format(target, meme))
        summary, page_content, related = await self.get_tag_info(meme)
        if summary is None:
            meme, _ = parse_cell_id(meme)
            summary, page_content, related = await self.get_tag_info(meme)
        await self.finish(dict(meme=meme, page=page_content, related_pages=related,
                               summary=summary))

    async def get_tag_info(self, meme):
        sbapi = ScrapboxAPI(parent=self.nb_app)
        links = await sbapi.get(meme)
        page_content = None
        related = {'1': [], '2': []}
        if links is not None:
            if links['persistent']:
                page_content = self.collect_content({'user': links['user']},
                                                    links)
            related['1'] = self.get_relates(links['relatedPages']['links1hop'])
            related['2'] = self.get_relates(links['relatedPages']['links2hop'])
        return await self.summarize(meme, page_content, related), page_content, related

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
                            if self._has_code(desc['text'])]) > 0
        else:
            self.log.info('No lines(maybe relatedPages): {}'.format(p['title']))
            details = await sbapi.get(p['title'])
            has_code = len([desc
                            for desc in details['lines']
                            if self._has_code(desc['text'])]) > 0
        return {'description': self.summarized_desc(meme, p),
                'page_url': sbapi.get_view_url(p['title']),
                'title': p['title'],
                'has_code': has_code,
                'count': '{}'.format(count)}

    def summarized_desc(self, meme, page):
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


class CellCreateURLHandler(IPythonHandler):
    def initialize(self, nb_app):
        self.nb_app = nb_app

    @web.authenticated
    def get(self):
        cell = json.loads(self.get_query_argument('cell'))
        self.log.info('Cell: {}'.format(cell))
        meme = cell['metadata']['lc_cell_meme']['current']
        uuid_meme, _ = parse_cell_id(meme)
        if self.get_query_argument('mode', default='new') != 'edit':
            tag = '\n\n#{}\n'.format(uuid_meme)
            if meme != uuid_meme:
                tag += '#{}\n'.format(meme)
        else:
            tag = ''

        sbapi = ScrapboxAPI(parent=self.nb_app)
        title = self.get_query_argument('title', default=meme)
        url = sbapi.get_create_url(title, tag + self._get_content(cell))

        self.redirect(url)

    def _get_content(self, cell):
        sbapi = ScrapboxAPI(parent=self.nb_app)
        if cell['cell_type'] == 'code':
            lines = cell['source'].split('\n')
            code = 'code:' + sbapi.cell_filename + '\n' + \
                   '\n'.join(['  ' + l for l in lines])
            return code + '\n'
        elif cell['cell_type'] == 'markdown':
            lines = cell['source'].split('\n')
            code = 'code:cell.md\n' + '\n'.join(['  ' + l for l in lines])
            return code + '\n'
        else:
            return ''


class NotebookCreateURLHandler(IPythonHandler):
    def initialize(self, nb_app):
        self.nb_app = nb_app

    @web.authenticated
    def get(self):
        notebook = json.loads(self.get_query_argument('notebook'))
        self.log.info('Notebook: {}'.format(notebook))
        meme = notebook['meme']['current']
        if self.get_query_argument('mode', default='new') != 'edit':
            tag = '\n\n#{}\n'.format(meme)
        else:
            tag = ''

        sbapi = ScrapboxAPI(parent=self.nb_app)
        title = self.get_query_argument('title', default=meme)
        url = sbapi.get_create_url(title,
                                   tag + self._get_content(notebook['toc']))

        self.redirect(url)

    def _get_content(self, toc):
        return 'code:toc.md\n' + '\n'.join(['  ' + l for l in toc])


class NotebookMemeHandler(IPythonHandler):
    def initialize(self, nb_app):
        self.nb_app = nb_app

    @web.authenticated
    def get(self, path):
        self.log.info('NotebookMeme: {}'.format(path))
        contents_manager = self.nb_app.contents_manager
        file_object = contents_manager.get(path, content=True)
        assert file_object['format'] == 'json'
        metadata = file_object['content']['metadata']
        if 'lc_notebook_meme' in metadata:
            meme = metadata['lc_notebook_meme']
        else:
            meme = None
        cells = file_object['content']['cells']
        toc = []
        for cell in cells:
            if cell['cell_type'] != 'markdown':
                continue
            if cell['source'].startswith('#'):
                toc.append(cell['source'].split('\n')[0])
        self.finish(dict(meme=meme, toc=toc, path=path))


def parse_cell_id(cell_id):
    parts = cell_id.split('-')
    return '-'.join(parts[:5]), '-'.join(parts[5:])
