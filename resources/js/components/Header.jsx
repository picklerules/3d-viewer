import React, { useRef } from 'react';
import { Button, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp, faRotateRight } from '@fortawesome/free-solid-svg-icons';

function Header({ onFileSelect, onReset }) {
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
        onReset();  
    };

    const renderTooltip = (props, message) => (
        <Tooltip id="button-tooltip" {...props}>
            {message}
        </Tooltip>
    );

    return (
        <div className="d-flex justify-content-between align-items-center mb-4 mt-4">
            <p>logo</p>
            <h1>ONLINE 3D MODELS VIEWER</h1>
            <div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                <OverlayTrigger
                    placement="bottom"
                    overlay={(props) => renderTooltip(props, "Upload")}
                >
                    <Button variant="light" onClick={handleUploadClick}>
                        <FontAwesomeIcon icon={faCloudArrowUp} size="2xl" style={{ color: "#1c927e" }} />
                    </Button>
                </OverlayTrigger>
                <OverlayTrigger
                    placement="bottom"
                    overlay={(props) => renderTooltip(props, "Refresh")}
                >
                    <Button variant="light" onClick={handleRefreshClick}>
                        <FontAwesomeIcon icon={faRotateRight} size="2xl" style={{ color: "#1c927e" }} />
                    </Button>
                </OverlayTrigger>
            </div>
        </div>
    );
}

export default Header;
