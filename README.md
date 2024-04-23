# sidestickies - Collaborative Annotation for Jupyter Notebook

[![Github Actions Status](https://github.com/NII-cloud-operation/sidestickies/workflows/Build/badge.svg)](https://github.com/NII-cloud-operation/sidestickies/actions/workflows/build.yml)
Sidestickies Jupyter Extension

*sidestickies* is a notebook extension, which enables to attach sticky notes to each cell utilizing Scrapbox https://scrapbox.io or Etherpad https://etherpad.org/.

Jupyter notebook's narrative stories are efficient to share workflows and activities of researchers, educators, engineers, and other practitioners for reproducible computing. The notebooks are crucial tools both for describing and capturing a series of related events, results, or the like as narratives, in ether prospective or retrospective cases.
However, it is not sufficient enough because those narratives mainly focus on the subjects and stories within the notebook itself. We would like to have separate channels for meta-, side-, and reflective-communications, which are well-known use cases for sticky notes.

## Requirements

- JupyterLab >= 4.0.0

## Prerequisites

Sidestickies requires nblineage in order to identify each notebook and each cell https://github.com/NII-cloud-operation/Jupyter-LC_nblineage .

```
$ pip install git+https://github.com/NII-cloud-operation/Jupyter-LC_nblineage.git
$ jupyter nblineage quick-setup
```

## Install sidestickies

To use sidestickies, you should enable both serverextension and nbextension.

```
pip install git+https://github.com/NII-cloud-operation/sidestickies.git
```

*TBD*

```
jupyter nbclassic-extension install --py nbtags
jupyter server extension enable --py nbtags
jupyter nbclassic-extension enable --py nbtags
```

## Configure sidestickies

### Scrapbox

To associate your Jupyter Notebook with your Scrapbox project, sidestickes requires accounts of https://scrapbox.io/ and Scrapbox's projects in order to store sticky notes.
You should setup as follows:

```
c.ScrapboxAPI.cookie_connect_sid = 'your-cookie-connect-sid-on-scrapbox'
c.ScrapboxAPI.project_id = 'your-scrapbox-project-id'
```


### ep_weave

To associate your Jupyter Notebook with your Etherpad server with ep_weave plugin, you should setup
as follows:

```
c.SidestickiesAPI.api_class = "nbtags.api.EpWeaveAPI"

c.EpWeaveAPI.url = 'http://ep_weave:9001/'
c.EpWeaveAPI.apikey = 'YOUR-ETHERPAD-API-KEY'
```

To start ep_weave, please refer to the README at https://github.com/NII-cloud-operation/ep_weave.
Sidestickies access ep_weave using an API key. To fix the API key, you should fix `YOUR-ETHERPAD-API-KEY` in `/opt/etherpad-lite/APIKEY.txt`.
It can be accomplished by adding the following configuration files.

ep_weave/demo/APIKEY.txt
```
YOUR-ETHERPAD-API-KEY
```

ep_weave/docker-compose.override.yml
```
version: '3'

services:
  etherpad:
    volumes:
      - ./demo/APIKEY.txt:/opt/etherpad-lite/APIKEY.txt:ro
```

Then use docker-compose command to start the service. It will be accessible with your API KEY.

## Binder
https://mybinder.org/v2/gh/NII-cloud-operation/Jupyter-LC_docker/sc-demo then open "EN02_Collaborative_Annotation.ipynb" and/or "JP03_Notebookを介したコミュニケーション.ipynb"
## Install

To install the extension, execute:

```bash
pip install nbtags
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall nbtags
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the nbtags directory
# Install package in development mode
pip install -e "."
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
pip uninstall nbtags
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `sidestickies` within that folder.

### Testing the extension

#### Frontend tests

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

To execute them, execute:

```sh
jlpm
jlpm test
```

#### Integration tests

This extension uses [Playwright](https://playwright.dev/docs/intro) for the integration tests (aka user level tests).
More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab.

More information are provided within the [ui-tests](./ui-tests/README.md) README.

### Packaging the extension

See [RELEASE](RELEASE.md)
