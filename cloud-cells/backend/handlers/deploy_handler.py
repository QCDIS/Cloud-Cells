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


class DeployHandler(BaseHandler):
    def post(self, path):
        body = self.get_json_body()
        image_names = body.get('imageNames')
        cloud_providers = body.get('cloudProviders')
        sdia_url = body.get('sdiaUrl')
        sdia_username = body.get('sdiaUsername')
        sdia_token = body.get('sdiaAuthToken')
        sdia_deployment_id = body.get('sdiaDeploymentId')
        sdia = SDIAService(sdia_url,sdia_username,sdia_token)
        if not sdia_deployment_id or sdia_deployment_id == 'New':
            tosca = sdia.get_tosca_for_docker_images(image_names, cloud_providers)
            tosca_id = sdia.upload_tosca_file(tosca)
            logger.debug('tosca_id: ' + tosca_id)
            plan_id = sdia.get_plan(tosca_id)
            logger.debug('plan_id: ' + plan_id)
            # provision_id = sdia.provision(plan_id)
            # logger.debug('provision_id: ' + provision_id)
            # deploy_id = sdia.deploy(provision_id)
            # logger.debug('deploy_id: ' + deploy_id)
            # deployed_tosca = sdia.get_tosca(deploy_id)
            # self.finish(json.dumps(yaml.safe_load(deployed_tosca)))
        else:
            logger.info('sdia_deployment_id: '+sdia_deployment_id)
            deployed_tosca = sdia.get_tosca(sdia_deployment_id)
            deployed_tosca_dict = yaml.safe_load(deployed_tosca)
            tosca = sdia.add_images_in_tosca(image_names, deployed_tosca_dict)

            tosca_id = sdia.upload_tosca_file(tosca)
            deploy_id = sdia.deploy(tosca_id)
            logger.info('deploy_id: ' + deploy_id)
            deployed_tosca = sdia.get_tosca(deploy_id)
            self.finish(json.dumps(yaml.safe_load(deployed_tosca)))

