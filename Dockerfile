FROM jupyter/base-notebook

USER root

EXPOSE 8888



COPY . src
WORKDIR src
RUN pip3 install --no-cache-dir -r requirements.txt
RUN python setup.py install
RUN jupyter serverextension enable --py cloud-cells
RUN jupyter nbextension install --py cloud-cells
RUN jupyter nbextension enable cloud-cells  --py
RUN rm -r src

# ENTRYPOINT cd /src && \
#            python setup.py install &&\
#            jupyter serverextension enable --py cloud-cells && \
#            jupyter nbextension install --py cloud-cells && \
#            jupyter nbextension enable cloud-cells  --py && \

#            jupyter notebook -y --port=8888 --no-browser --allow-root --debug

ENTRYPOINT jupyter notebook -y --port=8888 --no-browser --allow-root --debug
