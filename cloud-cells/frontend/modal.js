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
            imageNameInput: document.getElementById('sdia-url'),
//            baseImageSelector: document.getElementById('base-image'),
            imageSelector: document.getElementById('docker-image'),
            dockerRepositoryInput: document.getElementById('docker-repository-url'),
//            environmentArea: document.getElementById('environment-area'),

            runPortInput: document.getElementById('run-port'),

            buildButton: document.getElementById('build-container-button'),
            buildOutput: document.getElementById('build-output'),
            buildNotify: document.getElementById('build-notify'),

            pullImagesButton: document.getElementById('pull-images-button'),
//            buildDockerFileOutput: document.getElementById('build-dockerfile-output'),
            buildDockerFileNotify: document.getElementById('pull-images-notify'),

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

//    const setCellSelectOptions = () => {
//        // Allow the user to only select code cells.
//        Jupyter.notebook.get_cells()
//            .map((cell, idx) => cell.cell_type == 'code' ? idx : null)
//            .filter(idx => idx !== null)
//            .forEach(idx => {
//                const opt = document.createElement('option');
//                opt.value = idx;
//                opt.innerHTML = `Cell ${idx}`
//
//                elms.imageSelector.appendChild(opt);
//            })
//
//        elms.imageSelector.onchange = async (e) => {
//            const idx = Number(elms.imageSelector.value)
//            const cellPreviewElm = Jupyter.notebook.get_cell(idx).output_area.wrapper[0];
//            const outputElm = cellPreviewElm.getElementsByClassName('output_subarea')[0];
//
//            if (outputElm) {
//                elms.cellPreview.innerHTML = outputElm.innerHTML;
//            } else {
//                elms.cellPreview.innerHTML = '<p>Output not rendered.</p>';
//            }
//
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
//        elms.imageSelector.onchange(null);
//    }

    const handleBuildDockerFileButtonClick = async (e) => {
        e.preventDefault();

        elms.pullImagesButton.value = 'Pulling Images...';
        elms.pullImagesButton.disabled = true;


        console.log('setImageSelectOptions')
        console.log('elms.dockerRepositoryInput.value: '+elms.dockerRepositoryInput.value)

//        const res = await jsonRequest('GET', `/dj/image/${notebook.path}/command/status`)
        const res = await jsonRequest('POST', `/dj/notebook/${notebook.path}/build_docker_file`, {
            dockerRepository: elms.dockerRepositoryInput.value
        })
        console.log('res: '+res)
        const images = await res.json()
        console.log('images: '+images)
        if (images.length <= 0) {
            elms.pullImagesButton.value = 'Pull Images';
            elms.pullImagesButton.disabled = false;
           return alert(await 'Repository has no images')
        }
        images.forEach(image => {
            const opt = document.createElement('option');
            opt.value = image;
            opt.innerHTML = `${image}`
            elms.imageSelector.appendChild(opt);
        })

        elms.pullImagesButton.value = 'Pull Images';
        elms.pullImagesButton.disabled = false;
    }

    const handlebuildContainerButtonClick = async (e) => {
        e.preventDefault();

        elms.buildButton.value = 'Building Container...';
        elms.buildButton.disabled = true;
        elms.buildOutput.value = '';

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
            imageName: elms.imageNameInput.value,
            baseImage: 'elms.baseImageSelector.value',
            environment: 'elms.environmentArea.value',
            variables: variables
        })

        clearTimeout(timeoutId);
        elms.buildNotify.innerHTML = ""

        if (res.status !== 200) {
            return alert(await res.text())
        }

        const data = await res.json()

        elms.buildButton.value = 'Build';
        elms.buildButton.disabled = false;
        elms.buildOutput.value = data['logs']
    }

    const handleRunButtonClick = async (e) => {
        e.preventDefault();

        elms.runButton.value = 'Running...';
        elms.runButton.disabled = true;

        const imageName = elms.imageNameInput.value;
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

        const imageName = elms.imageNameInput.value;
        const res = await jsonRequest('GET', `/dj/image/${imageName}/command/status`)

        if (res.status !== 200) {
            return alert(await res.text())
        }

        const data = await res.json()

        elms.containerStatus.value = data['data'];
    }

    const handleStopButtonClick = async (e) => {
        e.preventDefault();

        const imageName = elms.imageNameInput.value;
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

//        setCellSelectOptions(elms.imageSelector, elms.cellPreview);


        elms.buildButton.onclick = handlebuildContainerButtonClick;
        elms.pullImagesButton.onclick = handleBuildDockerFileButtonClick;
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

            dialog.modal({title: 'FAIR-Cells',
                keyboard_manager: Jupyter.keyboard_manager, 
                body: () => formHtml, 
                open: onOpen
            });
        }
    }
});