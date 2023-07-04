from traitlets import Unicode
from traitlets.config import LoggingConfigurable

class BaseAPI(LoggingConfigurable):

    async def get(self, meme):
        raise NotImplementedError()

    def get_create_url(self, title, body, max_content_length=1024):
        raise NotImplementedError()

    def get_default_content(self, cell):
        raise NotImplementedError()
