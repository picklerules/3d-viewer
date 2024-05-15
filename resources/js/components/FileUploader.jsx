import React from 'react';
import { useDropzone } from 'react-dropzone';
import '../../css/customStyles.css';
import Header from './Header'; 

function FileUploader() {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: acceptedFiles => {
            console.log(acceptedFiles);
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
        </div>
    );
}

export default FileUploader;
