from notebook.base.handlers import IPythonHandler
from tornado import web
import itertools
from nbtags.scrapbox import ScrapboxAPI


class CellTagsandler(IPythonHandler):
    def initialize(self, nb_app):
        self.nb_app = nb_app

    @web.authenticated
    def get(self, meme):
        sbapi = ScrapboxAPI(parent=self.nb_app)
        self.finish(dict(meme=meme,
                         response=sbapi.get(meme)))
