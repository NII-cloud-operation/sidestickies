# sidestickies - Collaborative Annotation for Jupyter Notebook

*sidestickies* is a notebook extension, which enables to attach sticky notes to each cell utilizing Scrapbox https://scrapbox.io or Etherpad https://etherpad.org/.

Jupyter notebook's narrative stories are efficient to share workflows and activities of researchers, educators, engineers, and other practitioners for reproducible computing. The notebooks are crucial tools both for describing and capturing a series of related events, results, or the like as narratives, in ether prospective or retrospective cases.
However, it is not sufficient enough because those narratives mainly focus on the subjects and stories within the notebook itself. We would like to have separate channels for meta-, side-, and reflective-communications, which are well-known use cases for sticky notes.

## Prerequisites

Sidestickies requires nblineage in order to identify each notebook and each cell https://github.com/NII-cloud-operation/Jupyter-LC_nblineage .

```
$ pip install git+https://github.com/NII-cloud-operation/Jupyter-LC_nblineage.git
$ jupyter nblineage quick-setup
```

## Install sidestickies

To use sidestickies, you should enable both serverextension and nbextension.

```
$ pip install git+https://github.com/NII-cloud-operation/sidestickies.git
$ jupyter nbextension install --py nbtags
$ jupyter serverextension enable --py nbtags
$ jupyter nbextension enable --py nbtags
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
