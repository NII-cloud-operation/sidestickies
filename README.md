# sidestickies

Sticky Note for Jupyter using Scrapbox https://scrapbox.io

## Prerequisites

Sidestickies requires nblineage to identify notebooks and cells https://github.com/NII-cloud-operation/Jupyter-LC_nblineage .

```
$ pip install git+https://github.com/NII-cloud-operation/Jupyter-LC_nblineage.git
$ jupyter nblineage quick-setup
```

## Install sidestickies

To use sidestickies, you should enable both its serverextension and nbextension.

```
$ pip install git+https://github.com/NII-cloud-operation/sidestickies.git
$ jupyter nbextension install --py nbtags
$ jupyter serverextension enable --py nbtags
$ jupyter nbextension enable --py nbtags
```

## Configure sidestickies

To combine your Jupyter with your Scrapbox projects, you can set
the configuration below.

```
c.ScrapboxAPI.cookie_connect_sid = 'your-cookie-connect-sid-on-scrapbox'
c.ScrapboxAPI.project_id = 'your-scrapbox-project-id'
```
