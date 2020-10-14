import json
import os

from typing import Optional

import docker
from notebook.base.handlers import APIHandler, HTTPError

from ..container.creator import ContainerCreator
from .base_handler import BaseHandler

import logging
logger = logging.getLogger('CommandHandler')
logger.setLevel(logging.DEBUG)

class CommandHandler(BaseHandler):
    def post(self, image_name, command):
        if command == 'run':
            return self._run(image_name)
        elif command == 'stop':
            return self._stop(image_name)

        raise HTTPError(400, 'no_cmd')

    def get(self, image_name, command):
        logger.info('get image_name: '+image_name+' command: '+command)
        return ['image1','image2']

    def _stop(self, image_name):
        client = docker.from_env()
        
        try:
            container = client.containers.get(image_name)
            container.stop(timeout=1)
            status = container.status
        except docker.errors.NotFound:
            status = 'not_found'
        finally:
            self.finish(json.dumps({
                'data': status
            }))

    def _run(self, image_name):
        body = self.get_json_body()
        port = self._int_body('port', 10000)

        if port is None:
            raise HTTPError(400, 'def')


        cc = ContainerCreator('.', image_name, None)
        container = cc.run_container(port)

        self.finish(json.dumps({
            'data': container.status
        }))

    def _status(self, image_name):
        client = docker.from_env()

        try:
            container = client.containers.get(image_name)
            status = container.status
        except docker.errors.NotFound:
            status = 'not_found'
        finally:
            self.finish(json.dumps({
                'data': status
            }))

