from jupyter_server.base.handlers import APIHandler, JupyterHandler
from tornado import web
import json
import re
from .api import SidestickiesAPI


class BaseHandler(APIHandler):
    _api_cache = None    

    def initialize(self, nb_app):
        self.nb_app = nb_app

    @property
    def _api(self):
        if self._api_cache is not None:
            return self._api_cache
        self._api_cache = SidestickiesAPI(parent=self.nb_app)
        return self._api_cache


class TagsHandler(BaseHandler):
    @web.authenticated
    async def get(self, target, meme):
        self.log.info('Tags: {}, {}'.format(target, meme))
        # Get optional headings parameter
        headings = self.get_query_argument('headings', default=None)
        if headings:
            headings = json.loads(headings)
            self.log.info('Headings: {}'.format(headings))

        summary, page_content, related = await self._get_tag_info(meme, headings)
        if summary is None:
            meme, _ = parse_cell_id(meme)
            summary, page_content, related = await self._get_tag_info(meme, headings)
        await self.finish(dict(meme=meme, page=page_content, related_pages=related,
                               summary=summary))

    async def _get_tag_info(self, meme, headings=None):
        r = await self._api.get_summary(meme, headings=headings)
        if r is None:
            return None, None, None
        return r['summary'], r.get('page_content', None), r.get('related', None)


class CellCreateURLHandler(BaseHandler):
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

        title = self.get_query_argument('title', default=meme)
        url = self._api.get_create_url(title, tag + self._api.get_default_content(cell))

        self.redirect(url)


class NotebookCreateURLHandler(BaseHandler):
    @web.authenticated
    def get(self):
        notebook = json.loads(self.get_query_argument('notebook'))
        self.log.info('Notebook: {}'.format(notebook))
        meme = notebook['meme']['current']
        if self.get_query_argument('mode', default='new') != 'edit':
            tag = '\n\n#{}\n'.format(meme)
        else:
            tag = ''

        title = self.get_query_argument('title', default=meme)
        url = self._api.get_create_url(title,
                                   tag + self._get_content(notebook['toc']))

        self.redirect(url)

    def _get_content(self, toc):
        return 'code:toc.md\n' + '\n'.join(['  ' + l for l in toc])


class NotebookMemeHandler(BaseHandler):
    @web.authenticated
    async def get(self, path):
        self.log.info('NotebookMeme: {}'.format(path))
        contents_manager = self.nb_app.contents_manager
        file_object = await contents_manager.get(path, content=True)
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
