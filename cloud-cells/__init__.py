def _jupyter_server_extension_paths():
    return [{
        "name": "Cloud-Cells",
        "module": "cloud-cells",
        "module_name": "cloud-cells"
    }]


def _jupyter_nbextension_paths():
    return [dict(
        section="notebook",
        src="frontend",
        dest="cloud-cells",
        require="cloud-cells/index")]


def load_jupyter_server_extension(nbapp):
    from notebook.utils import url_path_join

    from .backend.handlers.environment_handler import EnvironmentHandler
    from .backend.handlers.template_handler import TemplateHandler
    from .backend.handlers.build_tosca_handler import BuildToscaHandler
    from .backend.handlers.docker_repository_handler import DockerRepositoryHandler
    from .backend.handlers.command_handler import CommandHandler
    from .backend.handlers.inspect_handler import InspectHandler

    nbapp.log.info("Cloud-Cells loaded.")

    web_app = nbapp.web_app
    base = web_app.settings['base_url']

    host_pattern = '.*$'
    build_pattern = url_path_join(base, '/dj/notebook/(.*)/build')
    build_docker_file_pattern = url_path_join(base, '/dj/notebook/(.*)/build_docker_file')
    image_command_pattern = url_path_join(base, '/dj/image/(.*)/command/(.*)')
    environment_pattern = url_path_join(base, '/dj/notebook/(.*)/environment')
    inspect_pattern = url_path_join(base, '/dj/notebook/(.*)/inspect/(.*)')

    template_pattern = url_path_join(base, r'/dj/templates/(.*\.(?:html|js|css))')

    web_app.add_handlers(host_pattern, [
        (build_pattern, BuildToscaHandler),
        (build_docker_file_pattern, DockerRepositoryHandler),
        (image_command_pattern, CommandHandler),
        (environment_pattern, EnvironmentHandler),
        (inspect_pattern, InspectHandler),
        (template_pattern, TemplateHandler)])


