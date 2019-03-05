FROM jupyter/scipy-notebook

USER root

COPY . /tmp/nbtags
RUN pip install /tmp/nbtags jupyter_nbextensions_configurator

USER $NB_UID

RUN jupyter nbextensions_configurator enable --user && \
    jupyter nbextension install --py --user nbtags && \
    jupyter serverextension enable --py --user nbtags && \
    jupyter nbextension enable --py --user nbtags
