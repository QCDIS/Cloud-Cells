import json
import os
import tempfile
import shutil
import importlib

from typing import Optional
from urllib.parse import urlparse
import requests
from requests.structures import CaseInsensitiveDict
from pip._vendor.requests.structures import CaseInsensitiveDict

from ..container.creator import ContainerCreator
from .base_handler import BaseHandler
from .environment_handler import BASE_STRING

import logging
logger = logging.getLogger('BuildDockerFileHandler')
logger.setLevel(logging.DEBUG)




def create_config(notebook_path, cell_index, variables):
    return json.dumps({
        'path': notebook_path,
        'index': cell_index,
        'variables': variables
    })


class DockerRepositoryHandler(BaseHandler):

    def post(self, path):
        body = self.get_json_body()

        docker_repository = body.get('dockerRepository')
        parse = urlparse(docker_repository)
        domain = parse.netloc
        organization = docker_repository.rsplit('/', 1)[1]
        api_url = 'https://' + domain + '/v2/repositories/' + organization + '?page_size=500'

        headers = CaseInsensitiveDict()
        headers["Accept"] = "application/json"



        resp = requests.get(api_url, headers=headers)
        resp = resp.json()
        results = resp['results']
        images = []
        for result in results:
            image = result['namespace'] + '/' + result['name']
            images.append(image)
        self.finish(json.dumps(images))



