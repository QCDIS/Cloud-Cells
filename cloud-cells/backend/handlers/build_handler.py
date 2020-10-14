import json
import os
import tempfile
import shutil
import importlib

from typing import Optional

import docker
from notebook.base.handlers import IPythonHandler, APIHandler, HTTPError
from notebook.utils import url_path_join
from pigar.core import parse_packages

from ..container.creator import ContainerCreator
from .base_handler import BaseHandler
from .environment_handler import BASE_STRING


import logging

logger = logging.getLogger('BuildHandler')
logger.setLevel(logging.DEBUG)

# create console handler and set level to debug
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)

# create formatter
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# add formatter to ch
ch.setFormatter(formatter)

# add ch to logger
logger.addHandler(ch)


def create_config(notebook_path, cell_index, variables):
    return json.dumps({
        'path': notebook_path,
        'index': cell_index,
        'variables': variables
    })


class BuildHandler(BaseHandler):
    def post(self, path):

        body = self.get_json_body()

        image_name = body.get('imageName')
        base_image = body.get('baseImage')
        cell_index = int(body.get('cellIndex'))
        variables = body.get('variables', {})
        logging.info("image_name: " + str(image_name))
        logging.info("base_image: " + str(base_image))
        logging.info("cell_index: " + str(cell_index))
        logging.info("variables: " + str(variables))

        self.finish(json.dumps({
            'logs': 'logs'
        }))
