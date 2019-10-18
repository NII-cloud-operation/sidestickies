# sidestickies - Collaborative Annotation for Jupyter Notebook

*sidestickies* is a notebook extension, which enables to attach sticky notes to each cell utilizing Scrapbox https://scrapbox.io .

Jupyter notebook's narrative stories are efficient to share workflows and activities of researchers, educators, engineers, and other practitioners for reproducible computing. The notebooks are crucial tools both for describing and capturing a series of related events, results, or the like as narratives, in ether prospective or retrospective cases.
However, it is not sufficient enough because those narratives mainly focus on the subjects and stories within the notebook itself. We would like to have separate channels for meta-, side-, and reflective-communications, which are well-known use cases for sticky notes.

## Prerequisites

Sidestickies requires nblineage in order to identify each notebook and each cell https://github.com/NII-cloud-operation/Jupyter-LC_nblineage .

```
$ pip install git+https://github.com/NII-cloud-operation/Jupyter-LC_nblineage.git
$ jupyter nblineage quick-setup
```

Sidestickes requires https://scrapbox.io/ accounts of https://scrapbox.io/ and Scrapbox's projects in order to store sticky notes.

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

## Binder
https://mybinder.org/v2/gh/NII-cloud-operation/Jupyter-LC_docker/sc-demo then open "EN02_Collaborative_Annotation.ipynb" and/or "JP03_Notebookを介したコミュニケーション.ipynb"
