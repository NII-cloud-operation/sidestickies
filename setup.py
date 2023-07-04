#!/usr/bin/env python

from setuptools import setup, find_packages
import os
import sys

HERE = os.path.abspath(os.path.dirname(__file__))
VERSION_NS = {}
with open(os.path.join(HERE, 'nbtags', '_version.py')) as f:
    exec(f.read(), {}, VERSION_NS)

setup_args = dict(name='lc-nbtags',
                  version=VERSION_NS['__version__'],
                  description='tagging extension for Jupyter Notebook',
                  packages=find_packages(),
                  include_package_data=True,
                  zip_safe=False,
                  platforms=['Jupyter Notebook 5.x', 'Jupyter Notebook 6.x'],
                  install_requires=['notebook>=6.5.4'])

if __name__ == '__main__':
    setup(**setup_args)
