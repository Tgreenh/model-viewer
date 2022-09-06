import React, { useRef } from 'react';
import { Container, Label, Button } from '@playcanvas/pcui/react';

import { File } from '../types';

const LoadButton = () => {
    const inputFile = useRef(null);

    const onLoadButtonClick = () => {
        // `current` points to the mounted file input element
        inputFile.current.click();
    };

    const onFileSelected = (event: React.ChangeEvent<any>) => {
        // `event` points to the selected file
        const viewer = (window as any).viewer;
        const files = event.target.files;
        if (viewer && files.length) {
            const loadList: Array<File> = [];
            for (let i = 0; i < files.length; ++i) {
                const file = files[i];
                loadList.push({
                    url: URL.createObjectURL(file),
                    filename: file.name
                });
            }
            viewer.loadFiles(loadList);
        }
    };

    return (
        <>
            <input type='file' id='file' multiple onChange={onFileSelected} ref={inputFile} style={{ display: 'none' }} />
            <Button onClick={onLoadButtonClick} text='Choose a file' width="calc(100% - 15px)" font-size="14px" />
        </>
    );
};

const LoadControls = () => {
    return (
        <div id='load-controls'>
            <Container class="load-button-panel" enabled flex>
                <Label text="Drag glTF or GLB files here to view" />
                <Label text="or" class="centered-label" />
                <LoadButton />
            </Container>
        </div>
    );
};

export default LoadControls;