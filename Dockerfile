FROM jupyter/scipy-notebook

USER root

RUN pip install --no-cache  jupyter_nbextensions_configurator \
    git+https://github.com/NII-cloud-operation/Jupyter-LC_nblineage.git

COPY . /tmp/nbtags
RUN pip install --no-cache /tmp/nbtags

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
    jupyter nbextension enable --py --user nbtags && \
    jupyter nblineage quick-setup --user
