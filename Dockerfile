FROM jupyter/scipy-notebook:latest

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

RUN jupyter nbclassic-extension install --py jupyter_nbextensions_configurator --user && \
    jupyter nbclassic-extension enable --py jupyter_nbextensions_configurator --user && \
    jupyter nbclassic-serverextension enable --py jupyter_nbextensions_configurator --user && \
    jupyter nbclassic-extension install --py --user nbtags && \
    jupyter nbclassic-serverextension enable --py --user nbtags && \
    jupyter nbclassic-extension enable --py --user nbtags && \
    jupyter nblineage quick-setup --user

# Make classic notebook the default
ENV DOCKER_STACKS_JUPYTER_CMD=nbclassic