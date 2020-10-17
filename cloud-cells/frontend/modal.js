define(["require", "base/js/namespace", "base/js/dialog", "./util"], function (require) {
    "use strict";

    const Jupyter = require('base/js/namespace');
    const dialog = require('base/js/dialog');
    const { jsonRequest } = require("./util");

    const formPromise = fetch('/dj/templates/form.html').then(resp => resp.text());

    const formElements = {};
    const buttonElements = {};
    let elms;

    let notebook;
    let currTab = 'build';

    const getElements = () => {
        return {
            sdiaUrlInput: document.getElementById('sdia-url'),
            sdiaUsernameInput: document.getElementById('sdia-username'),
            sdiaPasswordInput: document.getElementById('sdia-password'),
            sdiaAuthTokenInput: document.getElementById('sdia-auth-token'),

            cloudProviderTable: document.getElementById('cloud-provider-table'),
            pullProvidersButton: document.getElementById('pull-providers-button'),
            providersNotify: document.getElementById('pull-providers-notify'),

            dockerRepositoryInput: document.getElementById('docker-repository-url'),
            imageTable: document.getElementById('image-table'),
            pullImagesButton: document.getElementById('pull-images-button'),

            deployButton: document.getElementById('deploy-images-button'),
            pullImagesNotify: document.getElementById('pull-images-notify'),
            deployOutput: document.getElementById('deploy-output'),
            deployOutputTable: document.getElementById('deploy-output-table'),
            loader: document.getElementById('loader')
        }
    }

    const switchTab = async (newTab) => {
        Object.keys(formElements).forEach(k => {
            formElements[k].classList.add('hide');
        });

        formElements[newTab].classList.remove('hide');

        currTab = newTab;
    };

    const handleGetCloudProvidersButtonClick = async (e) => {
        e.preventDefault();

        elms.pullProvidersButton.value = 'Pulling Cloud Providers...';
        elms.pullProvidersButton.disabled = true;

        for (var i = 1, row; row = elms.cloudProviderTable.rows[i]; i++) {
            row.remove();
        }
        let providers = ['Amazon','ExoGeni','EOSC']
        providers.forEach(image => {
            let tr = document.createElement("tr");
            let text = document.createTextNode(image);
            tr.appendChild(text);

            var checkbox = document.createElement("INPUT");
            checkbox.setAttribute("type", "checkbox");
            tr.appendChild(checkbox);
            let row = elms.cloudProviderTable.insertRow();
            row.appendChild(tr);
        })

        elms.pullProvidersButton.value = 'Pull Cloud Providers';
//        elms.pullProvidersButton.disabled = false;
        elms.pullImagesButton.disabled = false;
    }

    const handlePullImagesButtonClick = async (e) => {
        e.preventDefault();

        elms.pullImagesButton.value = 'Pulling Images...';
        elms.pullImagesButton.disabled = true;

        for (var i = 1, row; row = elms.imageTable.rows[i]; i++) {
            row.remove();
        }

        console.log('setImageSelectOptions')
        console.log('elms.dockerRepositoryInput.value: '+elms.dockerRepositoryInput.value)

        const res = await jsonRequest('POST', `/dj/notebook/${notebook.path}/build_docker_file`, {
            dockerRepository: elms.dockerRepositoryInput.value
        })

        const images = await res.json()

        if (images.length <= 0) {
            elms.pullImagesButton.value = 'Pull Images';
            elms.pullImagesButton.disabled = false;
           return alert(await 'Repository has no images')
        }

        images.forEach(image => {
            let tr = document.createElement("tr");
            let text = document.createTextNode(image);
            tr.appendChild(text);

            var checkbox = document.createElement("INPUT");
            checkbox.setAttribute("type", "checkbox");
            tr.appendChild(checkbox);
            let row = elms.imageTable.insertRow();
            row.appendChild(tr);
        })

        elms.pullImagesButton.value = 'Pull Images';
        elms.deployButton.disabled = false;
//        elms.pullImagesButton.disabled = false;
//        elms.pullProvidersButton.disabled = false;
//        elms.pullImagesButton.disabled = false;
    }

    const handlebuildContainerButtonClick = async (e) => {
        e.preventDefault();

        elms.deployButton.value = 'Deploying Images...';
        elms.deployButton.disabled = true;
        elms.deployOutput.value = '';
        elms.loader.classList.remove('hide')

        console.log('elms.loader.style.display: '+elms.loader.style.display)
        let imageNames = []
        for (var i = 1, row; row = elms.imageTable.rows[i]; i++) {
            let imageRow = row.childNodes[0]
            let imageName = imageRow.childNodes[0].nodeValue;
            let imageSelect = imageRow.childNodes[1];

            if (imageSelect.checked){
                imageNames.push(imageName);
            }
        }
        console.log('imageNames: '+imageNames)

        let cloudProviders = []
        for (var i = 1, row; row = elms.cloudProviderTable.rows[i]; i++) {
            let providerRow = row.childNodes[0]
            let providerName = providerRow.childNodes[0].nodeValue;
            let providerSelect = providerRow.childNodes[1];

            if (providerSelect.checked){
                cloudProviders.push(providerName);
            }
        }

//        let timeoutId = setTimeout(() => {
//            elms.buildNotify.innerHTML = "This might take a while..."
//        }, 5000)
//
        const res = await jsonRequest('POST', `/dj/notebook/${notebook.path}/build`, {
            imageNames: imageNames,
            cloudProviders: cloudProviders,
            sdiaUrl: elms.sdiaUrlInput.value,
            sdiaUsername: elms.sdiaUsernameInput.value,
            sdiaPassword: elms.sdiaPasswordInput.value,
            sdiaAuthToken: elms.sdiaAuthTokenInput.value
        })

//
//        clearTimeout(timeoutId);
//        elms.buildNotify.innerHTML = ""
//
        if (res.status !== 200) {
            return alert(await res.text())
        }
        const tosca = await res.json()

        showToscaDeploy(tosca)

        elms.loader.classList.add('hide')
        elms.deployButton.value = 'Deploy';
        elms.deployButton.disabled = true;
        elms.pullImagesButton.disabled = true;
        elms.pullProvidersButton.disabled = false;
    }

    function showToscaDeploy(tosca) {
        console.log(typeof tosca)
        console.log(tosca)
//        const map = new Map(Object.entries(tosca));
        let node_templates = tosca.topology_template.node_templates


        var textDeploy = ''
        for (var nodeName in node_templates) {
            let node = node_templates[nodeName]
            console.log(nodeName+':'+node.type)
            console.log('typeof node.type: '+ typeof node.type)
            if (node.type==='tosca.nodes.QC.docker.Orchestrator.Kubernetes'){
                let dashboard_url = node.attributes.dashboard_url
                console.log('dashboard_url: '+dashboard_url)
                textDeploy += ' dashboard url: '+dashboard_url;

                var row = elms.deployOutputTable.insertRow();
                var cell1 = row.insertCell(0);
                cell1.innerHTML = "dashboard url";
                var cell2 = row.insertCell(1);
                var createA = document.createElement('a');
                var createAText = document.createTextNode(dashboard_url);
                createA.setAttribute('href', dashboard_url);
                createA.appendChild(createAText);
                cell2.appendChild(createA);


                let dashboard_token = node.attributes.tokens[0].token
                var row = elms.deployOutputTable.insertRow();
                var cell1 = row.insertCell(0);
                cell1.innerHTML = "dashboard token";
                var cell2 = row.insertCell(1);
                cell2.innerHTML = dashboard_token;

            }
            if (node.type==='tosca.nodes.QC.Container.Application.Docker'){
                let service_url = node.attributes.service_url
                console.log('service_url: '+service_url)
                textDeploy += ' cell url: '+service_url;
                var row = elms.deployOutputTable.insertRow();
                var cell1 = row.insertCell(0);
                cell1.innerHTML = "Cell URL";
                var cell2 = row.insertCell(1);
                var createA = document.createElement('a');
                var createAText = document.createTextNode(service_url);
                createA.setAttribute('href', service_url);
                createA.appendChild(createAText);
                cell2.appendChild(createA);
            }
            textDeploy+='\n'
//            let requirements = node.requirements
//            if (requirements){
//            	console.log(requirements)
//            }
        }
        console.log(textDeploy)
//        elms.deployOutput.value = textDeploy;
    }

    const handleRunButtonClick = async (e) => {
        e.preventDefault();

        elms.runButton.value = 'Running...';
        elms.runButton.disabled = true;

        const imageName = elms.sdiaUrlInput.value;
        const res = await jsonRequest('POST', `/dj/image/${imageName}/command/run`, {
            port: Number(elms.runPortInput.value)
        })

        if (res.status !== 200) {
            return alert(await res.text())
        }

        const data = await res.json()

        elms.runButton.value = 'Run';
        elms.runButton.disabled = false;

        elms.containerStatus.value = data['data'];
    };

    const handleStatusButtonClick = async (e) => {
        e.preventDefault();

        const imageName = elms.sdiaUrlInput.value;
        const res = await jsonRequest('GET', `/dj/image/${imageName}/command/status`)

        if (res.status !== 200) {
            return alert(await res.text())
        }

        const data = await res.json()

        elms.containerStatus.value = data['data'];
    }

    const handleStopButtonClick = async (e) => {
        e.preventDefault();

        const imageName = elms.sdiaUrlInput.value;
        const res = await jsonRequest('POST', `/dj/image/${imageName}/command/stop`)

        if (res.status !== 200) {
            return alert(await res.text())
        }

        const data = await res.json()

        elms.containerStatus.value = data['data'];
    }


    const onOpen = async () => {
        notebook = await Jupyter.notebook.save_notebook();

        buttonElements['build'] = document.getElementById("btn-tab-build");
        buttonElements['run'] = document.getElementById("btn-tab-run");
        buttonElements['validate'] = document.getElementById("btn-tab-validate");

        formElements['build'] = document.getElementById("cloud-cells-build");
        formElements['run'] = document.getElementById("cloud-cells-run");
        formElements['validate'] = document.getElementById("cloud-cells-about");

        Object.keys(buttonElements).forEach(k => {
            buttonElements[k].onclick = () => switchTab(k);
        })

        switchTab(currTab);

        elms = getElements();


        elms.pullImagesButton.onclick = handlePullImagesButtonClick;
        elms.pullProvidersButton.onclick = handleGetCloudProvidersButtonClick;
        elms.deployButton.onclick = handlebuildContainerButtonClick;


//        elms.runButton.onclick = handleRunButtonClick;
//        elms.statusButton.onclick = handleStatusButtonClick;
//        elms.stopButton.onclick = handleStopButtonClick;




        const res = await jsonRequest('GET', `/dj/notebook/${notebook.path}/environment`)

        if (!res.ok) {
            return alert(await res.text());
        }

//        elms.environmentArea.value = (await res.json()).data
    }

    return {
        openFormHandler: async () => {
            const formHtml = await formPromise;

            dialog.modal({title: 'CloudCells',
                keyboard_manager: Jupyter.keyboard_manager, 
                body: () => formHtml, 
                open: onOpen
            });
        }
    }
});