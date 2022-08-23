import * as pc from 'playcanvas';
import { Observer } from '@playcanvas/observer';
import React from 'react';
import ReactDOM from 'react-dom';

import { Container, Spinner } from '@playcanvas/pcui/react';

import { getAssetPath, getRootPath } from './helpers';
import { Option } from './types';
import { Controls } from './controls'
import LoadControls from './load-ui';
import ErrorBox from './errors';
import Viewer from './viewer';

// Permit some additional properties to be set on the window
declare global {
    interface Window {
        pc: any;
        viewer: Viewer;
    }
}

interface Skybox {
    url: string,
    label: string
}

// initialize the apps state
const observer: Observer = new Observer({
    render: {
        multisampleSupported: true,
        multisample: true,
        hq: true,
        pixelScale: 1
    },
    show: {
        stats: false,
        wireframe: false,
        bounds: false,
        skeleton: false,
        axes: false,
        grid: true,
        normals: 0,
        fov: 50
    },
    lighting: {
        direct: 1,
        shadow: true,
        env: {
            value: getAssetPath('./skybox/adams_place_bridge_2k.hdr'),
            options: null,
            default: null,
            skyboxMip: '3',
            exposure: 0
        },
        rotation: 0,
        tonemapping: 'Linear'
    },
    animation: {
        playing: false,
        speed: 1.0,
        transition: 0.1,
        loops: 1,
        list: '[]',
        progress: 0,
        selectedTrack: 'ALL_TRACKS'
    },
    scene: {
        nodes: '[]',
        selectedNode: {
            path: '',
            name: null,
            position: {
                0: 0,
                1: 0,
                2: 0
            },
            rotation: {
                0: 0,
                1: 0,
                2: 0,
                3: 0
            },
            scale: {
                0: 0,
                1: 0,
                2: 0
            }
        },
        meshCount: null,
        vertexCount: null,
        primitiveCount: null,
        bounds: null,
        variants: {
            list: '[]',
            selected: 0
        }
    },
    morphTargets: null,
    spinner: false,
    error: null
});

const saveOptions = (name: string) => {
    const options = observer.json();
    window.localStorage.setItem(`model-viewer-${name}`, JSON.stringify({
        render: options.render,
        show: options.show,
        lighting: options.lighting
    }));
};

const loadOptions = (name: string) => {
    const loadRec = (path: string, value:any) => {
        const filter = ['lighting.env.options'];
        if (filter.indexOf(path) !== -1) {
            return;
        }
        if (typeof value === 'object') {
            Object.keys(value).forEach((k) => {
                loadRec(path ? `${path}.${k}` : k, value[k]);
            });
        } else {
            if (observer.has(path)) {
                observer.set(path, value);
            }
        }
    };

    const options = window.localStorage.getItem(`model-viewer-${name}`);
    if (options) {
        try {
            loadRec('', JSON.parse(options));
        } catch { }
    }
};

// render out the app
ReactDOM.render(
    <div id="flex-container">
        <Container id="wrapper-left" resizable='right' resizeMin={220} resizeMax={800} onResize={() => observer.emit('canvasResized')}>
            <Container id="panel-left" class="control-panel">
                <div id="panel-toggle"></div>
                <div className="header" style={{ display: 'none' }}><a href={getRootPath()}><img src={getAssetPath('playcanvas-logo.png')}/><div><b>PLAY</b>CANVAS <span>viewer</span></div></a></div>
                <Controls observer={observer} />
            </Container>
        </Container>
        <div id='canvas-wrapper'>
            <LoadControls observer={observer} />
            <ErrorBox observer={observer} path='error' />
            <canvas id="application-canvas" />
            <Spinner id="spinner" size={30} hidden={true} />
        </div>
    </div>,
    document.getElementById('app')
);

window.pc = pc;

pc.basisInitialize({
    glueUrl: getAssetPath('lib/basis/basis.wasm.js'),
    wasmUrl: getAssetPath('lib/basis/basis.wasm.wasm'),
    fallbackUrl: getAssetPath('lib/basis/basis.js'),
    lazyInit: true
});

// @ts-ignore
pc.WasmModule.setConfig('DracoDecoderModule', {
    glueUrl: getAssetPath('lib/draco/draco.wasm.js'),
    wasmUrl: getAssetPath('lib/draco/draco.wasm.wasm'),
    fallbackUrl: getAssetPath('lib/draco/draco.js')
});

// hide / show spinner when loading files
observer.on('spinner:set', (value: boolean) => {
    const spinner = document.getElementById('spinner');
    if (value) {
        spinner.classList.remove('pcui-hidden');
    } else {
        spinner.classList.add('pcui-hidden');
    }
});

const url = getAssetPath("asset_manifest.json");
new pc.Http().get(url, {
    cache: true,
    responseType: "text",
    retry: false
}, function (err: string, result: { skyboxes: Array<Skybox>, defaultSkybox: string }) {
        if (err) {
            console.warn(err);
        } else {
            const skyboxes = result.skyboxes;
            const skyboxOptions: Array<Option> = [{
                v: 'None', t: 'None'
            }];
            skyboxes.forEach((skybox: Skybox) => {
                skyboxOptions.push({ v: getAssetPath(skybox.url), t: skybox.label });
            });
            const skyboxData = observer.get('lighting.env');
            skyboxData.options = JSON.stringify(skyboxOptions);
            skyboxData.default = getAssetPath(result.defaultSkybox);
            observer.set('lighting.env', skyboxData);
            
            loadOptions('uistate');
    
            observer.on('*:set', () => {
                saveOptions('uistate');
            });
    
            const canvas = document.getElementById("application-canvas") as HTMLCanvasElement;
            window.viewer = new Viewer(canvas, observer);
            window.viewer.handleUrlParams();
        }
    }
);
