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
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)


def create_config(notebook_path, cell_index, variables):
    return json.dumps({
        'path': notebook_path,
        'index': cell_index,
        'variables': variables
    })


class CloudProviderHandler(BaseHandler):

    def post(self, path):
        body = self.get_json_body()
        providers = ['any','ec2','exogeni']
        logger.info(str(providers))
        logger.info(str(json.dumps(providers)))
        self.finish(json.dumps(providers))





