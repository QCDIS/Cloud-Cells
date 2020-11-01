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
    from .backend.handlers.deploy_handler import DeployHandler
    from .backend.handlers.docker_repository_handler import DockerRepositoryHandler
    from .backend.handlers.command_handler import CommandHandler
    from .backend.handlers.inspect_handler import InspectHandler
    from .backend.handlers.sdia_topologies_ids_handler import SDIATopologiesIDsHandler

    nbapp.log.info("Cloud-Cells loaded.")

    web_app = nbapp.web_app
    base = web_app.settings['base_url']

    host_pattern = '.*$'
    deploy_pattern = url_path_join(base, '/cloud-cells/notebook/(.*)/deploy')
    build_docker_file_pattern = url_path_join(base, '/cloud-cells/notebook/(.*)/images')
    image_command_pattern = url_path_join(base, '/cloud-cells/image/(.*)/command/(.*)')
    environment_pattern = url_path_join(base, '/cloud-cells/notebook/(.*)/environment')
    inspect_pattern = url_path_join(base, '/cloud-cells/notebook/(.*)/inspect/(.*)')
    sdia_topologies_ids_pattern = url_path_join(base, '/cloud-cells/notebook/(.*)/sdia_topologies_ids')


    template_pattern = url_path_join(base, r'/cloud-cells/templates/(.*\.(?:html|js|css))')

    web_app.add_handlers(host_pattern, [
        (deploy_pattern, DeployHandler),
        (build_docker_file_pattern, DockerRepositoryHandler),
        (sdia_topologies_ids_pattern, SDIATopologiesIDsHandler),
        (image_command_pattern, CommandHandler),
        (environment_pattern, EnvironmentHandler),
        (inspect_pattern, InspectHandler),
        (template_pattern, TemplateHandler)])


