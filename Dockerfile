FROM jupyter/base-notebook

USER root

EXPOSE 8888

COPY . src
RUN pip install jupyter
#RUN pip install cloud-cells
WORKDIR src
RUN python setup.py install
RUN jupyter serverextension enable --py cloud-cells
RUN jupyter nbextension install --py cloud-cells
RUN jupyter nbextension enable cloud-cells  --py
WORKDIR ../
RUN rm -r src

ENTRYPOINT jupyter notebook -y --port=8888 --no-browser --allow-root --debug
