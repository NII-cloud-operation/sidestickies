from notebook.utils import url_path_join
from . import handler


# nbextension
def _jupyter_nbextension_paths():
    notebook_ext = dict(
        section='notebook',
        src='nbextension',
        dest='nbtags',
        require='nbtags/main')
    tree_ext = dict(
        section='tree',
        src='nbextension',
        dest='nbtags',
        require='nbtags/tree')
    return [notebook_ext, tree_ext]


# server extension
def _jupyter_server_extension_paths():
    return [dict(
        module='nbtags'
    )]


def load_jupyter_server_extension(nb_app):
    nb_app.log.info('Loaded server extension nbtags')

    host_pattern = '.*$'
    c_route_pattern = url_path_join(nb_app.web_app.settings['base_url'],
                                    r'/nbtags/(?P<target>cell|notebook)/(?P<meme>[A-Za-z0-9\-]+)')
    nb_app.web_app.add_handlers(host_pattern, [
        (c_route_pattern, handler.TagsHandler, dict(nb_app=nb_app))
    ])

    c_route_pattern = url_path_join(nb_app.web_app.settings['base_url'],
                                    r'/nbtags/cell')
    nb_app.web_app.add_handlers(host_pattern, [
        (c_route_pattern, handler.CellCreateURLHandler, dict(nb_app=nb_app))
    ])

    c_route_pattern = url_path_join(nb_app.web_app.settings['base_url'],
                                    r'/nbtags/notebook')
    nb_app.web_app.add_handlers(host_pattern, [
        (c_route_pattern, handler.NotebookCreateURLHandler, dict(nb_app=nb_app))
    ])

    c_route_pattern = url_path_join(nb_app.web_app.settings['base_url'],
                                    r'/nbtags/notebook/(?P<path>.+\.ipynb)/meme')
    nb_app.web_app.add_handlers(host_pattern, [
        (c_route_pattern, handler.NotebookMemeHandler, dict(nb_app=nb_app))
    ])
