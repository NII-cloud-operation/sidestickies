from traitlets import Type

from ..base import BaseAPI
from .scrapbox import ScrapboxAPI


class SidestickiesAPI(BaseAPI):

    api_class = Type(default_value=ScrapboxAPI, klass=BaseAPI, help='API class').tag(config=True)

    _api_cache = None

    def __init__(self, **kwargs):
        super(SidestickiesAPI, self).__init__(**kwargs)
    
    async def get_summary(self, meme):
        self.log.info(f'retrieve summary for {meme}')
        return await self._api.get_summary(meme)

    def get_default_content(self, cell):
        self.log.info(f'get default content for {cell}')
        return self._api.get_default_content(cell)

    def get_create_url(self, title, body, max_content_length=1024):
        self.log.info(f'get create URL for {title}')
        return self._api.get_create_url(title, body, max_content_length)
    
    @property
    def _api(self):
        if self._api_cache is not None:
            return self._api_cache
        self._api_cache = self.api_class(parent=self)
        return self._api_cache
