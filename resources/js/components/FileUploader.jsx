import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import '../../css/customStyles.css';
import Header from './Header';
import ThreeDViewer from './ThreeDViewer';

function FileUploader() {
    const [file, setFile] = useState(null);
    
    const handleFileSelect = (file) => {
        console.log(file);
        setFile(file);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: acceptedFiles => {
            console.log(acceptedFiles);
            setFile(acceptedFiles[0]); 
        },
        multiple: false,
        noClick: true
    });

    return (
        <div className="container-full-height mx-5">
            <Header onFileSelect={handleFileSelect} />
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
