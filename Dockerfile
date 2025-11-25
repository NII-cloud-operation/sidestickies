FROM solr:8 AS solr

FROM quay.io/jupyter/scipy-notebook:notebook-7.5.0

USER root

# Install Node.js 20.x (required for Etherpad build)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    mkdir -p /.npm && \
    chown jovyan:users -R /.npm && \
    rm -rf /var/lib/apt/lists/*
ENV NPM_CONFIG_PREFIX=/.npm
ENV PATH=/.npm/bin/:${PATH}

# Install OpenJDK and other dependencies (including nbsearch dependencies)
RUN apt-get update && apt-get install -yq supervisor openjdk-11-jre \
    nginx gnupg curl gettext-base netcat-traditional \
    lsyncd uuid-runtime tinyproxy \
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
RUN chown jovyan:users -R /var/solr /var/log/nginx /var/lib/nginx /run/tinyproxy

# MINIO for nbsearch
ENV MINIO_ACCESS_KEY=nbsearchak MINIO_SECRET_KEY=nbsearchsk
RUN mkdir -p /opt/minio/bin/ && \
    curl -L https://dl.min.io/server/minio/release/linux-amd64/minio > /opt/minio/bin/minio && \
    chmod +x /opt/minio/bin/minio && mkdir -p /var/minio && chown jovyan:users -R /var/minio

RUN pip install --no-cache jupyter_nbextensions_configurator \
    git+https://github.com/NII-cloud-operation/Jupyter-LC_nblineage.git@feature/lab \
    git+https://github.com/NII-cloud-operation/Jupyter-LC_index.git@feature/lab \
    git+https://github.com/NII-cloud-operation/nbsearch.git@main

COPY . /tmp/nbtags
RUN pip install --no-cache /tmp/nbtags jupyter-server-proxy && \
    jupyter server extension enable --sys-prefix jupyter_server_proxy

RUN jupyter labextension enable nbtags && \
    jupyter labextension enable lc_index

RUN mkdir -p /opt/nbtags/bin && \
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
    cp /tmp/nbtags/example/nbsearch-update-index.lua /opt/nbtags/ && \
    cp /tmp/nbtags/example/nbsearch-update-index /usr/local/bin/update-index && \
    cp /tmp/nbtags/example/build-index.sh /opt/nbtags/bin/ && \
    chmod +x /usr/local/bin/update-index /opt/nbtags/bin/build-index.sh && \
    mkdir -p /jupyter_notebook_config.d && \
    cp /tmp/nbtags/example/nbsearch_config.py /jupyter_notebook_config.d/ && \
    chown -R jovyan:users /jupyter_notebook_config.d

# Boot scripts to perform /usr/local/bin/before-notebook.d/* on JupyterHub
RUN mkdir -p /opt/nbtags/original/bin/ && \
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
    git clone -b v2.4.2 https://github.com/ether/etherpad-lite.git /opt/etherpad/ && \
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

# Enable nbsearch extensions
RUN jupyter nbclassic-extension install --py --user nbsearch && \
    jupyter nbclassic-serverextension enable --py --user nbsearch && \
    jupyter nbclassic-extension enable --py --user nbsearch

# Create Solr schemas for both ep_weave and nbsearch
RUN precreate-core pad /tmp/nbtags/example/ep_weave/solr/pad/ && \
    git clone -b main https://github.com/NII-cloud-operation/nbsearch.git /tmp/nbsearch-repo && \
    precreate-core jupyter-notebook /tmp/nbsearch-repo/solr/jupyter-notebook/ && \
    precreate-core jupyter-cell /tmp/nbsearch-repo/solr/jupyter-cell/ && \
    rm -rf /tmp/nbsearch-repo
