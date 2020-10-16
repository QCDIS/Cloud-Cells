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
            planButton: document.getElementById('plan-images-button'),
            pullImagesNotify: document.getElementById('pull-images-notify'),

//            environmentArea: document.getElementById('environment-area'),

//            runPortInput: document.getElementById('run-port'),


//            buildOutput: document.getElementById('build-output'),
//            buildNotify: document.getElementById('plan-notify'),


//            buildDockerFileOutput: document.getElementById('build-dockerfile-output'),


            runButton: document.getElementById('run-button'),
            statusButton: document.getElementById('status-button'),
            stopButton: document.getElementById('stop-button'),

//            cellPreview: document.getElementById('cell-preview'),
            containerStatus: document.getElementById('container-status')

//            kernelSpecific: document.getElementById('kernel-specific')
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
        elms.pullProvidersButton.disabled = false;
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
        elms.pullImagesButton.disabled = false;
    }

    const handlebuildContainerButtonClick = async (e) => {
        e.preventDefault();

        elms.planButton.value = 'Generating Plan...';
        elms.planButton.disabled = true;
        elms.planButton.value = '';
        let imageNames = []
        for (var i = 1, row; row = elms.imageTable.rows[i]; i++) {
            let imageRow = row.childNodes[0]
            let imageName = imageRow.childNodes[0].nodeValue;
            let imageSelect = imageRow.childNodes[1];
            console.log('imageSelect.checked=: '+imageSelect.checked)
            if (imageSelect.checked){
                console.log('Adding=: '+imageName)
                imageNames.push(imageName);
            }
        }
        console.log('imageNames: '+imageNames)

        let cloudProviders = []
        for (var i = 1, row; row = elms.cloudProviderTable.rows[i]; i++) {
            let providerRow = row.childNodes[0]
            let providerName = providerRow.childNodes[0].nodeValue;
            let providerSelect = providerRow.childNodes[1];
            console.log('providerSelect.checked: '+providerSelect.checked)
            if (providerSelect.checked){
                console.log('Adding: '+providerName)
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


        showToscaPlan(tosca)

        elms.planButton.value = 'Plan';
        elms.planButton.disabled = false;
    }

    function showToscaPlan(tosca) {
        var obj = JSON.parse(tosca);
        console.log('obj: '+obj)
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
        elms.planButton.onclick = handlebuildContainerButtonClick;


        elms.runButton.onclick = handleRunButtonClick;
        elms.statusButton.onclick = handleStatusButtonClick;
        elms.stopButton.onclick = handleStopButtonClick;




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