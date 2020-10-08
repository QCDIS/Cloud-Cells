FROM jupyter/base-notebook

USER root

RUN pip install --upgrade pip

EXPOSE 8888

WORKDIR /notebooks/

COPY ./setup.py /src/setup.py
COPY ./docker/jupyter_config/ /home/$NB_USER/.jupyter

RUN pip install -e /src/ && \
    mkdir -p /usr/local/share/jupyter/nbextensions && \
    mkdir -p /src/cloud-cells/frontend/ && \
    ln -sfT /src/cloud-cells/frontend/ /usr/local/share/jupyter/nbextensions/cloud-cells

# TODO: We would rather not run as root.
# https://vitorbaptista.com/how-to-access-hosts-docker-socket-without-root
# USER $NB_UID

COPY . /src/

ENTRYPOINT jupyter notebook -y --port=8888 --no-browser --allow-root
