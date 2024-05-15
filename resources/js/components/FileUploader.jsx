import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import '../../css/customStyles.css';
import Header from './Header';
import ThreeDViewer from './ThreeDViewer'; 

function FileUploader() {
    const [file, setFile] = useState(null);
    
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: acceptedFiles => {
            console.log(acceptedFiles);
            setFile(acceptedFiles[0]); 
        }
    });

    return (
        <div className="container-full-height mx-5">
            <Header />  
            <div {...getRootProps()} className="border-dashed border-2 p-5 text-center">
                <input {...getInputProps()} />
                {
                    isDragActive ?
                    <h3>Drop the files here ...</h3> :
                    <h3>Drag and Drop your 3D files here</h3>
                }
                <p>Supported files format: obj, fbx, stl, ply, glb, glTF</p>
            </div>
            {file && <ThreeDViewer file={file} />}
        </div>
    );
}

export default FileUploader;
