import copy
import urllib
import yaml
import requests
import tempfile

class SDIAService:

    def __init__(self, url, username, token):
        self.url = url
        self.username = username
        self.token = token


    def add_images_in_tosca(self,image_names,tosca):
        with urllib.request.urlopen(
                'https://raw.githubusercontent.com/qcdis-sdia/sdia-tosca/master/examples/application_docker_template.yaml') as stream:
            # html = f.read().decode('utf-8')
            docker_template = yaml.safe_load(stream)

        node_templates = tosca['topology_template']['node_templates']
        port_count = 30000
        for image_name in image_names:
            new_node_template = copy.deepcopy(docker_template)
            names = image_name.split('/')
            new_node_template['artifacts']['image']['file'] = image_name
            new_node_template['properties']['ports'][0] = str(port_count) + ':' + '8888'
            port_count += 1
            node_templates[names[1].replace('_', '').replace('-', '')] = new_node_template

        return tosca

    def get_tosca_for_docker_images(self,image_names, cloud_providers):
        with urllib.request.urlopen(
                'https://raw.githubusercontent.com/qcdis-sdia/sdia-tosca/master/examples/docker_template.yaml') as stream:
            # html = f.read().decode('utf-8')
            tosca = yaml.safe_load(stream)
        return self.add_images_in_tosca(image_names,tosca)


    def upload_tosca_file(self, tosca):
        url = self.url + '/tosca_template'
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

    def get_plan(self, tosca_id):
        url = self.url + '/planner/plan/' + tosca_id
        payload = {}
        headers = {}

        response = requests.request("GET", url, headers=headers, data=payload)
        plan_id = response.text
        return plan_id

    def get_tosca(self, tosca_id):
        url = self.url + '/tosca_template/' + tosca_id
        payload = {}
        headers = {}

        response = requests.request("GET", url, headers=headers, data=payload)

        return response.text

    def deploy(self,provision_id):
        url = self.url + '/deployer/deploy/' + provision_id

        payload = {}
        headers = {}

        response = requests.request("GET", url, headers=headers, data=payload)

        return response.text

    def provision(self, plan_id):
        url = self.url + '/provisioner/provision/' + plan_id
        payload = {}
        headers = {}

        response = requests.request("GET", url, headers=headers, data=payload)

        return response.text

    def get_running_topologies(self):
        with urllib.request.urlopen(
                'https://raw.githubusercontent.com/qcdis-sdia/sdia-orchestrator/master/scratch/ids.yaml') as stream:
            # html = f.read().decode('utf-8')
            ids = yaml.safe_load(stream)
        return ids

