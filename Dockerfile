FROM solr:8 AS solr

FROM jupyter/scipy-notebook:latest

USER root

# Install OpenJDK
RUN apt-get update && apt-get install -yq supervisor openjdk-11-jre \
    nginx gnupg curl gettext-base netcat \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Solr
COPY --from=solr /opt /opt/
RUN mkdir -p /var/solr
COPY --from=solr /var/solr /var/solr
ENV SOLR_USER="jovyan" \
    SOLR_GROUP="users" \
    PATH="/opt/solr/bin:/opt/docker-solr/scripts:$PATH" \
    SOLR_INCLUDE=/etc/default/solr.in.sh \
    SOLR_HOME=/var/solr/data \
    SOLR_PID_DIR=/var/solr \
    SOLR_LOGS_DIR=/var/solr/logs \
    LOG4J_PROPS=/var/solr/log4j2.xml
RUN chown jovyan:users -R /var/solr /var/log/nginx /var/lib/nginx

RUN pip install --no-cache jupyter_nbextensions_configurator \
    git+https://github.com/NII-cloud-operation/Jupyter-LC_nblineage.git@feature/lab \
    git+https://github.com/NII-cloud-operation/Jupyter-LC_index.git@feature/lab

COPY . /tmp/nbtags
RUN pip install --no-cache /tmp/nbtags jupyter-server-proxy && \
    jupyter server extension enable --sys-prefix jupyter_server_proxy

RUN jupyter labextension enable nbtags && \
    jupyter labextension enable lc_index

RUN mkdir /opt/nbtags && \
    cp /tmp/nbtags/example/config.py.template \
       /opt/nbtags/config.py.template && \
    cp /tmp/nbtags/example/config.default.py \
       /opt/nbtags/config.default.py && \
    mkdir -p /usr/local/bin/before-notebook.d && \
    cp /tmp/nbtags/example/00-add-config.sh /usr/local/bin/before-notebook.d/ && \
    cp /tmp/nbtags/example/99-run-supervisor.sh /usr/local/bin/before-notebook.d/ && \
    chmod +x /usr/local/bin/before-notebook.d/*.sh && \
    cp /tmp/nbtags/example/supervisor.conf /opt/nbtags/ && \
    cp /tmp/nbtags/example/nginx-ep-proxy.conf.template /opt/nbtags/ && \
    mkdir -p /jupyter_notebook_config.d && chown jovyan:users /jupyter_notebook_config.d

# Boot scripts to perform /usr/local/bin/before-notebook.d/* on JupyterHub
RUN mkdir -p /opt/nbtags/original/bin/ && \
    mkdir -p /opt/nbtags/bin/ && \
    mv /opt/conda/bin/jupyterhub-singleuser /opt/nbtags/original/bin/jupyterhub-singleuser && \
    mv /opt/conda/bin/jupyter-notebook /opt/nbtags/original/bin/jupyter-notebook && \
    mv /opt/conda/bin/jupyter-lab /opt/nbtags/original/bin/jupyter-lab && \
    cp /tmp/nbtags/example/jupyterhub-singleuser /opt/conda/bin/ && \
    cp /tmp/nbtags/example/jupyter-notebook /opt/conda/bin/ && \
    cp /tmp/nbtags/example/jupyter-lab /opt/conda/bin/ && \
    cp /tmp/nbtags/example/run-*.sh /opt/nbtags/bin/ && \
    chmod +x /opt/conda/bin/jupyterhub-singleuser /opt/conda/bin/jupyter-notebook /opt/conda/bin/jupyter-lab \
        /opt/nbtags/bin/run-*.sh

RUN mkdir /opt/etherpad && chown jovyan:users -R /opt/etherpad /tmp/nbtags/example/ep_weave/

# Configuration for Server Proxy
RUN cat /tmp/nbtags/example/jupyter_notebook_config.py >> $CONDA_DIR/etc/jupyter/jupyter_notebook_config.py

USER $NB_UID

# install ep_weave
ARG ETHERPAD_PLUGINS="ep_align ep_markdown ep_embedded_hyperlinks2 ep_font_color ep_headings2  ep_image_upload ep_user_displayname ep_stable_authorid"
ARG ETHERPAD_LOCAL_PLUGINS="/tmp/nbtags/example/ep_weave/ /tmp/ep_search/"
RUN cd /tmp/nbtags/example/ep_weave/ \
    && ls -la /tmp/nbtags/example/ep_weave \
    && npm i --include dev && npm run build
RUN git clone -b feature/search-engine https://github.com/NII-cloud-operation/ep_search.git /tmp/ep_search \
    && cd /tmp/ep_search \
    && ls -la /tmp/ep_search \
    && npm pack
RUN npm install -g pnpm && \
    git clone -b develop https://github.com/ether/etherpad-lite.git /opt/etherpad/ && \
    cd /opt/etherpad && \
    pnpm i && \
    pnpm run build:etherpad && \
    pnpm run plugins i ${ETHERPAD_PLUGINS} && \
    pnpm run plugins i ${ETHERPAD_LOCAL_PLUGINS:+--path ${ETHERPAD_LOCAL_PLUGINS}} && \
    cp /tmp/nbtags/example/etherpad-settings.json settings.json

RUN cp -fr /tmp/nbtags/example/notebooks/* /home/$NB_USER/ && \
    cp /tmp/nbtags/images/* /home/$NB_USER/images/ && \
    cp /tmp/nbtags/README.md /home/$NB_USER/

RUN jupyter nbclassic-extension install --py jupyter_nbextensions_configurator --user && \
    jupyter nbclassic-extension enable --py jupyter_nbextensions_configurator --user && \
    jupyter nbclassic-serverextension enable --py jupyter_nbextensions_configurator --user && \
    jupyter nbclassic-extension install --py --user nbtags && \
    jupyter nbclassic-serverextension enable --py --user nbtags && \
    jupyter nbclassic-extension enable --py --user nbtags && \
    jupyter nblineage quick-setup --user

# Create Solr schema
RUN precreate-core pad /tmp/nbtags/example/ep_weave/solr/pad/
