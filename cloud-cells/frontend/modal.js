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
    let currTab = 'configure';

    const getElements = () => {
        return {
            sdia_url: document.getElementById('sdia_url'),
            sdia_username: document.getElementById('sdia_username'),
            sdia_password: document.getElementById('sdia_password'),
            sdia_password: document.getElementById('sdia_password'),
            sdia_password: document.getElementById('sdia_auth_token'),
//            baseImageSelector: document.getElementById('base-image'),
            providerSelector: document.getElementById('cloud-provider')
//            environmentArea: document.getElementById('environment-area'),
//
//            runPortInput: document.getElementById('run-port'),
//
//            buildButton: document.getElementById('build-container-button'),
//            buildOutput: document.getElementById('build-output'),
//            buildNotify: document.getElementById('build-notify'),
//
//            buildDockerfileButton: document.getElementById('build-dockerfile-button'),
//            buildDockerFileOutput: document.getElementById('build-dockerfile-output'),
//            buildDockerFileNotify: document.getElementById('build-dockerfile-notify'),
//
//            runButton: document.getElementById('run-button'),
//            statusButton: document.getElementById('status-button'),
//            stopButton: document.getElementById('stop-button'),
//
//            cellPreview: document.getElementById('cell-preview'),
//            containerStatus: document.getElementById('container-status'),
//
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

    const setImageSelectOptions = async (e) => {

        const res = await jsonRequest('POST', `/dj/notebook/${notebook.path}/cloud_provider`, {
//            imageName: 'elms.sdia_url.value',
//            baseImage: 'elms.baseImageSelector.value',
//            cellIndex: 'elms.providerSelector.value',
//            environment: 'elms.environmentArea.value',
//            variables: 'variables'
        })

        if (res.status !== 200) {
            return alert(await res.text())
        }

        const providers = await res.json()
        console.log(providers)
        providers.forEach(provider => console.log(provider));
        providers.forEach(provider => {
            const opt = document.createElement('option');
            opt.value = provider;
            opt.innerHTML = `${provider}`
            elms.providerSelector.appendChild(opt);
            console.log(provider);
        })


//        Jupyter.notebook.get_cells()
//            .map((cell, idx) => cell.cell_type == 'code' ? idx : null)
//            .filter(idx => idx !== null)
//            .forEach(idx => {
//                const opt = document.createElement('option');
//                opt.value = idx;
//                opt.innerHTML = `Cell ${idx}`
//
//                elms.providerSelector.appendChild(opt);
//            })
//
//        elms.providerSelector.onchange = async (e) => {
//            const idx = Number(elms.providerSelector.value)
//            const cellPreviewElm = Jupyter.notebook.get_cell(idx).output_area.wrapper[0];
//            const outputElm = cellPreviewElm.getElementsByClassName('output_subarea')[0];
//            const inspectorResp = await fetch(`/dj/notebook/${notebook.path}/inspect/inspector.html?cellIdx=${idx}`);
//            if (inspectorResp.status === 501) {
//                // No inspector for this Kernel
//                return;
//            } else if (!inspectorResp.ok) {
//                return alert(await inspectorResp.text());
//            }
//
//            elms.kernelSpecific.innerHTML = await inspectorResp.text();
//
//        }
//
//        elms.providerSelector.onchange(null);
    }

    const handleBuildDockerFileButtonClick = async (e) => {
        e.preventDefault();

//        elms.buildDockerfileButton.value = 'Building Dockerfile...';
//        elms.buildDockerfileButton.disabled = true;
        elms.buildDockerFileOutput.value = '';

        const variables = {};
        document.querySelectorAll(`input[data-variable]:checked`).forEach(elm => {
            variables[elm.dataset.variable] = elm.value
        })

        let timeoutId = setTimeout(() => {
            elms.buildNotify.innerHTML = "This might take a while..."

            timeoutId = setTimeout(() => {
                elms.buildNotify.innerHTML = "Especially the first time ..."
            }, 5000)
        }, 5000)

        const res = await jsonRequest('POST', `/dj/notebook/${notebook.path}/build_docker_file`, {
            imageName: elms.sdia_url.value,
            baseImage: elms.baseImageSelector.value,
            cellIndex: elms.providerSelector.value,
            environment: 'elms.environmentArea.value',
            variables: variables
        })

        clearTimeout(timeoutId);
        elms.buildNotify.innerHTML = ""

        if (res.status !== 200) {
            return alert(await res.text())
        }

        const data = await res.json()

//        elms.buildDockerfileButton.value = 'Build Dockerfile';
//        elms.buildDockerfileButton.disabled = false;
        elms.buildDockerFileOutput.value = data['dockerFile']
    }

    const handlebuildContainerButtonClick = async (e) => {
        e.preventDefault();

//        elms.buildButton.value = 'Building Container...';
//        elms.buildButton.disabled = true;
//        elms.buildOutput.value = '';

        const variables = {};
        document.querySelectorAll(`input[data-variable]:checked`).forEach(elm => {
            variables[elm.dataset.variable] = elm.value
        })

        let timeoutId = setTimeout(() => {
            elms.buildNotify.innerHTML = "This might take a while..."

            timeoutId = setTimeout(() => {
                elms.buildNotify.innerHTML = "Especially the first time ..."
            }, 5000)
        }, 5000)

        const res = await jsonRequest('POST', `/dj/notebook/${notebook.path}/build`, {
            imageName: elms.sdia_url.value,
            baseImage: elms.baseImageSelector.value,
            cellIndex: elms.providerSelector.value,
            environment: 'elms.environmentArea.value',
            variables: variables
        })

        clearTimeout(timeoutId);
        elms.buildNotify.innerHTML = ""

        if (res.status !== 200) {
            return alert(await res.text())
        }

        const data = await res.json()

//        elms.buildButton.value = 'Build';
//        elms.buildButton.disabled = false;
//        elms.buildOutput.value = data['logs']
    }

    const handleRunButtonClick = async (e) => {
        e.preventDefault();

//        elms.runButton.value = 'Running...';
//        elms.runButton.disabled = true;

        const imageName = elms.sdia_url.value;
        const res = await jsonRequest('POST', `/dj/image/${imageName}/command/run`, {
            port: Number(elms.runPortInput.value)
        })

        if (res.status !== 200) {
            return alert(await res.text())
        }

        const data = await res.json()

//        elms.runButton.value = 'Run';
//        elms.runButton.disabled = false;

        elms.containerStatus.value = data['data'];
    };

    const handleStatusButtonClick = async (e) => {
        e.preventDefault();

        const imageName = elms.sdia_url.value;
        const res = await jsonRequest('GET', `/dj/image/${imageName}/command/status`)

        if (res.status !== 200) {
            return alert(await res.text())
        }

        const data = await res.json()
        
        elms.containerStatus.value = data['data'];
    }

    const handleStopButtonClick = async (e) => {
        e.preventDefault();

        const imageName = elms.sdia_url.value;
        const res = await jsonRequest('POST', `/dj/image/${imageName}/command/stop`)

        if (res.status !== 200) {
            return alert(await res.text())
        }

        const data = await res.json()

        elms.containerStatus.value = data['data'];
    }


    const onOpen = async () => {
        notebook = await Jupyter.notebook.save_notebook();
        
        buttonElements['configure'] = document.getElementById("btn-tab-conf");
        buttonElements['deploy'] = document.getElementById("btn-tab-deploy");
        buttonElements['validate'] = document.getElementById("btn-tab-validate");

        formElements['configure'] = document.getElementById("sdia-conf");
        formElements['deploy'] = document.getElementById("cloud-cells-deploy");
        formElements['validate'] = document.getElementById("cloud-cells-about");

        Object.keys(buttonElements).forEach(k => {
            buttonElements[k].onclick = () => switchTab(k);
        })

        switchTab(currTab);

        elms = getElements();

        setImageSelectOptions(elms.providerSelector, elms.cellPreview);


//        elms.buildButton.onclick = handlebuildContainerButtonClick;
//        elms.buildDockerfileButton.onclick = handleBuildDockerFileButtonClick;
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
    
            dialog.modal({title: 'Cloud-Cells',
                keyboard_manager: Jupyter.keyboard_manager, 
                body: () => formHtml, 
                open: onOpen
            });
        }
    }
});