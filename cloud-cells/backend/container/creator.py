"""
POC: Create a Docker container from a Python script.
"""
import sys
import os
import random
import string

import docker

import traceback

import logging
logger = logging.getLogger('ContainerCreator')
logger.setLevel(logging.DEBUG)


#  Small hack so we can use a dockerfile string instead of having to write it
#  to disk first. See:
#  https://github.com/docker/docker-py/issues/2105#issuecomment-613685891
docker.api.build.process_dockerfile = \
    lambda dockerfile, _: ('Dockerfile', dockerfile)


class ContainerCreator:
    def __init__(self, folder, image_name, base_image):
        self.folder = folder
        self.name = image_name
        self.base_image = base_image
        self.client = docker.from_env()

    def get_dockerfile(self) -> str:
        return (
            "\n".join([
                f'FROM {self.base_image}',
                f'USER root',
                f'WORKDIR /src/',

                f'COPY ./cloud-cells/ /src/cloud-cells/',
                f"RUN pip install -r /src/cloud-cells/helper/helper_requirements.txt",

                f'COPY ./environment.yml /src/environment.yml',
                f"RUN conda env update --file environment.yml --name base",

                f"USER $NB_UID",

                f'COPY ./notebook.ipynb /src/notebook.ipynb',
                f'COPY ./nb_helper_config.json /src/nb_helper_config.json',

                f'ENTRYPOINT ["python", "-m", "cloud-cells"]'
            ])
        )

    def build_container(self, dockerfile: str) -> docker.api.image.ImageApiMixin:
        #  Save working directory so we can reset it later
        wd = os.getcwd()
        os.chdir(self.folder)
        logging.info("getcwd: " + str(wd))
        try:
            logging.info("dockerfile: "+str(dockerfile))
            logging.info("Start building container. self.client.images.build")
            image, log = self.client.images.build(tag=self.name, 
                                            path='.',
                                            dockerfile=dockerfile,
                                            rm=True,
                                            nocache=True)
        except Exception as e:
            logging.error(traceback.format_exc())
        finally:
            #  Change back
            os.chdir(wd)
        logging.info("Returning image and log: "+str(log))
        return image, log

  
    def run_container(self, port=10000) -> docker.api.container.ContainerApiMixin:
        try:
            cont = self.client.containers.get(self.name)
            cont.stop(timeout=1)
        except docker.errors.NotFound:
            pass
        logging.info("containers.run name: "+self.name+" ports: "+str(port))
        return self.client.containers.run(self.name,
                    name=self.name,
                    ports={'8888': port},
                    remove=True,
                    detach=True)
                    # command=f"{port} {code}")

