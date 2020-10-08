# cloud-cells

cloud-cells is a Jupyter Notebook extension that allows the user to interactively deploy a Docker image on the cloud .

#### Installation
cloud-cells
 can be downloaded using pip. It then needs to be enabled using three Jupyter commands. Docker is required for the extension 
 to have any effect.

```bash
$ [sudo] pip install jupyter --user
$ [sudo] pip install cloud-cells --user
$ jupyter serverextension enable --py cloud-cells --user
$ jupyter nbextension install --py cloud-cells --user
$ jupyter nbextension enable cloud-cells --user --py
```


#### Run with Docker
```bash
docker run -it -p 8888:8888  -v /var/run/docker.sock:/var/run/docker.sock qcdis/cloud-cells 
```

#### Development
To keep your system clean it is recommended to develop using Docker. The following command will run a Jupyter Notebook 
server with cloud-cells enabled at http://localhost:8888. Autoreload is enabled for Python files, you will need to reload 
your browser to see changes in the front-end.

```bash
$ sudo docker build -t cloud_cells
```