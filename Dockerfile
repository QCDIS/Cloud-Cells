FROM jupyter/base-notebook

USER root

RUN apt update && apt upgrade -y && apt install gcc python3-dev -y

EXPOSE 8888

COPY . src
RUN pip install laserchicken matplotlib
WORKDIR src
RUN pip install --no-cache-dir -r requirements.txt
RUN python setup.py install
RUN jupyter serverextension enable --py cloud-cells
RUN jupyter nbextension install --py cloud-cells
RUN jupyter nbextension enable cloud-cells  --py
WORKDIR ../
RUN rm -r src

#ENTRYPOINT jupyter notebook -y --port=8888 --no-browser --allow-root --debug

ENTRYPOINT cd /src && \
           python setup.py install &&\
           jupyter serverextension enable --py cloud-cells && \
           jupyter nbextension install --py cloud-cells && \
           jupyter nbextension enable cloud-cells  --py && \

           jupyter notebook -y --port=8888 --no-browser --allow-root --debug