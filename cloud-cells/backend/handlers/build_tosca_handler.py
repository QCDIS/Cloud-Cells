import copy
import json
import logging
import tempfile
import urllib

import requests
import yaml

from .base_handler import BaseHandler

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


def create_config(notebook_path, cell_index, variables):
    return json.dumps({
        'path': notebook_path,
        'index': cell_index,
        'variables': variables
    })


class BuildToscaHandler(BaseHandler):
    def post(self, path):
        body = self.get_json_body()
        image_names = body.get('imageNames')
        cloud_providers = body.get('cloudProviders')
        sdia_url = body.get('sdiaUrl')
        sdia_username = body.get('sdiaUsername')
        sdia_password = body.get('sdiaPassword')
        sdia_token = body.get('sdiaAuthToken')

        tosca = self.get_tosca_for_docker_images(image_names, cloud_providers)
        logger.debug(yaml.dump(tosca))

        tosca_id = self.upload_tosca_file(sdia_url, 'sdia_username', 'sdia_password', 'sdia_token', tosca)
        logger.debug('tosca_id: ' + tosca_id)
        plan_id = self.get_plan(sdia_url, 'sdia_username', 'sdia_password', 'sdia_token', tosca_id)
        logger.debug('plan_id: ' + plan_id)
        provision_id = self.provision(sdia_url, 'sdia_username', 'sdia_password', 'sdia_token', plan_id)
        logger.debug('provision_id: ' + provision_id)
        deploy_id = self.deploy(sdia_url, 'sdia_username', 'sdia_password', 'sdia_token', provision_id)
        logger.debug('deploy_id: ' + deploy_id)
        deployed_tosca = self.get_tosca(sdia_url, 'sdia_username', 'sdia_password', 'sdia_token', deploy_id)

        logger.debug(yaml.dump(deployed_tosca))

        self.finish(json.dumps(yaml.safe_load(deployed_tosca)))

    def get_tosca_for_docker_images(self,image_names, cloud_providers):
        with urllib.request.urlopen(
                'https://raw.githubusercontent.com/qcdis-sdia/sdia-tosca/master/examples/docker_template.yaml') as stream:
            # html = f.read().decode('utf-8')
            tosca = yaml.safe_load(stream)
        node_templates = tosca['topology_template']['node_templates']
        node_name = list(node_templates.keys())[0]
        node_template = node_templates.pop(node_name)
        port_count = 30000
        for image_name in image_names:
            names = image_name.split('/')
            new_node_template = copy.deepcopy(node_template)
            new_node_template['artifacts']['image']['file'] = image_name
            new_node_template['properties']['ports'][0] = str(port_count) + ':' + '8888'
            port_count += 1
            node_templates[names[1].replace('_', '').replace('-', '')] = new_node_template

        return tosca

    def upload_tosca_file(self,sdia_url, sdia_username, sdia_password, sdia_token, tosca):
        url = sdia_url + '/tosca_template'
        _, temp_file_path = tempfile.mkstemp()

        with open(temp_file_path, 'w') as file:
            yaml.dump(tosca, file, default_flow_style=False)
        headers = {
            'Content-Type': 'multipart/form-data'
        }

        files = {'file': open(temp_file_path, 'rb')}
        response = requests.post(url, files=files)
        tosca_id = response.text
        return tosca_id

    def get_plan(self,sdia_url, sdia_username, sdia_password, sdia_token, tosca_id):
        url = sdia_url + '/planner/plan/' + tosca_id
        payload = {}
        headers = {}

        response = requests.request("GET", url, headers=headers, data=payload)
        plan_id = response.text
        return plan_id

    def get_tosca(self,sdia_url, sdia_username, sdia_password, sdia_token, tosca_id):
        url = sdia_url + '/tosca_template/' + tosca_id
        payload = {}
        headers = {}

        response = requests.request("GET", url, headers=headers, data=payload)

        return response.text

    def deploy(self,sdia_url, sdia_username, sdia_password, sdia_token, provision_id):
        url = sdia_url + '/deployer/deploy/' + provision_id

        payload = {}
        headers = {}

        response = requests.request("GET", url, headers=headers, data=payload)

        return response.text

    def provision(self,sdia_url, sdia_username, sdia_password, sdia_token, plan_id):
        url = sdia_url + '/provisioner/provision/' + plan_id
        payload = {}
        headers = {}

        response = requests.request("GET", url, headers=headers, data=payload)

        return response.text