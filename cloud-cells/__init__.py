def _jupyter_server_extension_paths():
    return [{
        "name": "cloud-cells",
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


    from .backend.handlers.build_handler import BuildHandler
    from .backend.handlers.build_docker_file_handler import BuildDockerFileHandler
    from .backend.handlers.command_handler import CommandHandler
    from .backend.handlers.inspect_handler import InspectHandler

    nbapp.log.info("cloud-cells loaded.")

    web_app = nbapp.web_app
    base = web_app.settings['base_url']

    host_pattern = '.*$'
    build_pattern = url_path_join(base, '/dj/notebook/(.*)/build')
    build_docker_file_pattern = url_path_join(base, '/dj/notebook/(.*)/build_docker_file')
    image_command_pattern = url_path_join(base, '/dj/image/(.*)/command/(.*)')
    inspect_pattern = url_path_join(base, '/dj/notebook/(.*)/inspect/(.*)')

    template_pattern = url_path_join(base, r'/dj/templates/(.*\.(?:html|js|css))')

    web_app.add_handlers(host_pattern, [
        (build_pattern, BuildHandler),
        (build_docker_file_pattern, BuildDockerFileHandler),
        (image_command_pattern, CommandHandler),
        (inspect_pattern, InspectHandler),
        (template_pattern, TemplateHandler)])


