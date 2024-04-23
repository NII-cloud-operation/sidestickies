from . import server
try:
    from ._version import __version__
except ImportError:
    # Fallback when using the package in dev mode without installing
    # in editable mode with pip. It is highly recommended to install
    # the package from a stable release or in editable mode: https://pip.pypa.io/en/stable/topics/local-project-installs/#editable-installs
    import warnings
    warnings.warn("Importing 'nbtags' outside a proper installation.")
    __version__ = "dev"

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
    server.register_routes(nb_app)

def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "sidestickies"
    }]
