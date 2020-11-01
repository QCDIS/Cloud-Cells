import copy
import json
import logging
import tempfile
import urllib

import requests
import yaml

from .base_handler import BaseHandler
from .sdia_service import SDIAService

logger = logging.getLogger('BuildToscaHandler')
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


# def create_config(notebook_path, cell_index, variables):
#     return json.dumps({
#         'path': notebook_path,
#         'index': cell_index,
#         'variables': variables
#     })


class SDIATopologiesIDsHandler(BaseHandler):
    def post(self, path):
        body = self.get_json_body()
        image_names = body.get('imageNames')
        cloud_providers = body.get('cloudProviders')
        sdia_url = body.get('sdiaUrl')
        sdia_username = body.get('sdiaUsername')
        sdia_token = body.get('sdiaAuthToken')

        sdia = SDIAService(sdia_url,sdia_username,sdia_token)
        ids = ['New']
        ids.append(sdia.get_running_topologies())
        self.finish(json.dumps(ids))