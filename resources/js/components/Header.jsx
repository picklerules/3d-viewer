import React, { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp, faRotateRight } from '@fortawesome/free-solid-svg-icons';

function Header({ onFileSelect }) {
    const fileInputRef = useRef(null);

    const handleUploadClick = () => {
        fileInputRef.current.click(); 
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            onFileSelect(file); 
        }
    };

    const handleRefreshClick = () => {
        console.log('Refresh clicked');
    };

    return (
        <div className="d-flex justify-content-between align-items-center mb-4 mt-4">
            <p>logo</p>
            <h1>ONLINE 3D MODELS VIEWER</h1>
            <div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                <button className="btn" onClick={handleUploadClick}>
                    <FontAwesomeIcon icon={faCloudArrowUp} size="2xl" style={{ color: "#1c927e" }} />
                </button>
                <button className="btn" onClick={handleRefreshClick}>
                    <FontAwesomeIcon icon={faRotateRight} size="2xl" style={{ color: "#1c927e" }} />
                </button>
            </div>
        </div>
    );
}

export default Header;
