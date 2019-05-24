# sidestickies

Sticky Note for Jupyter Notebook based on Scrapbox https://scrapbox.io
You can put side descriptions onto cells and notebooks.

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

To associate your Jupyter Notebook with your Scrapbox project, you should setup
as follows:

```
c.ScrapboxAPI.cookie_connect_sid = 'your-cookie-connect-sid-on-scrapbox'
c.ScrapboxAPI.project_id = 'your-scrapbox-project-id'
```
