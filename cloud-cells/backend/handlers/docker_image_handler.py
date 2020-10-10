from tornado.web import RequestHandler, HTTPError
from tornado import template

import docker
import os

import logging
logger = logging.getLogger('TemplateHandler')
logger.setLevel(logging.DEBUG)



class DockerImageHandler(RequestHandler):
    def get(self, path):
        args = None
        if path == 'form.html':
            args = self._form_html()
        elif path == 'inspector.html':
            args = self._inspector_html()
        try:
            if args is None:
                args = {}
            logger.info('args: ' + str(args))
            self.render(path, **args)
        except FileNotFoundError as e:
            raise HTTPError(404)


    def _inspector_html(self):
        return {'variables': []}
        

    def _form_html(self):
        client = docker.from_env()
        images = client.images.list()
        docker_images = []
        logger.info('Number of images: '+str(len(images)))
        for image in images:
            if image.tags and len(image.tags) > 0:
                name = image.tags[0]
                image_id = image.short_id
                logger.info('Adding images: ' + str(image_id))
                docker_images.append((name, image_id))
        return {'images': docker_images}

    
    def get_template_path(self):
        dirname = os.path.dirname(__file__)
        return os.path.join(dirname + "/../templates")