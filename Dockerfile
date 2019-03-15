FROM jupyter/scipy-notebook

USER root

COPY . /tmp/nbtags
RUN pip install /tmp/nbtags jupyter_nbextensions_configurator

RUN mkdir /opt/nbtags && \
    cp /tmp/nbtags/example/config.py.template \
       /opt/nbtags/config.py.template && \
    mkdir -p /usr/local/bin/before-notebook.d && \
    cp /tmp/nbtags/example/*.sh /usr/local/bin/before-notebook.d/ && \
    chmod +x /usr/local/bin/before-notebook.d/*.sh
USER $NB_UID

RUN jupyter nbextensions_configurator enable --user && \
    jupyter nbextension install --py --user nbtags && \
    jupyter serverextension enable --py --user nbtags && \
    jupyter nbextension enable --py --user nbtags
