#!/usr/bin/env python

from setuptools import setup
import os
import sys

HERE = os.path.abspath(os.path.dirname(__file__))
VERSION_NS = {}
with open(os.path.join(HERE, 'nbtags', '_version.py')) as f:
    exec(f.read(), {}, VERSION_NS)

setup_args = dict(name='lc-nbtags',
                  version=VERSION_NS['__version__'],
                  description='tagging extension for Jupyter Notebook',
                  packages=['nbtags'],
                  package_dir={'nbtags': 'nbtags'},
                  package_data={'nbtags': ['nbextension/*']},
                  include_package_data=True,
                  platforms=['Jupyter Notebook 5.x'],
                  install_requires=['notebook>=5.0.0'])

if __name__ == '__main__':
    setup(**setup_args)
