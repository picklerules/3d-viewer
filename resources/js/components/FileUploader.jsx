import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Header from './Header';
import ThreeDViewer from './ThreeDViewer';

/**
 * FileUploader Component
 * Handles file uploading through drag-and-drop and file input.
 * Selected file is passed to the ThreeDViewer for rendering.
 *
 * @component
 */
function FileUploader() {
    const [file, setFile] = useState(null);

    /**
     * handleFileSelect
     * Sets the selected file in the state.
     *
     * @param {Object} file - The uploaded file object
     */
    const handleFileSelect = (file) => {
        setFile(file);
    };

    /**
     * handleReset
     * Resets the file input and clears the file from the state.
     */
    const handleReset = () => {
        setFile(null);  
        console.log('File input reset');
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: acceptedFiles => {
            setFile(acceptedFiles[0]); 
        },
        multiple: false,
        noClick: true
    });

    return (
        <div className="container-full-height mx-5">
            <Header onFileSelect={handleFileSelect} onReset={handleReset} />
            <div {...getRootProps()} className={`border-2 p-5 text-center viewer-container ${file ? 'border-solid' : 'border-dashed'}`}>
                <input {...getInputProps()} />
                {
                    file ?
                    (<div>
                        <h3>{file.name}</h3>
                        <p>File type: {file.type || file.name.split('.').pop()}</p>
                    </div>) :
                    (isDragActive ?
                        <h3>Drop the files here ...</h3> :
                        <h3>Drag and Drop your 3D files here</h3>
                    )
                }
                <p>Supported files format: obj, fbx, stl, ply, glb, glTF, vrml, wrl</p>
                {file && <ThreeDViewer file={file} />}
            </div> 
        </div>
    );
}

export default FileUploader;
