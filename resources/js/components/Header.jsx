import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp, faRotateRight } from '@fortawesome/free-solid-svg-icons';
function Header() {
    return (
        <div className="d-flex justify-content-between align-items-center mb-4">
            <p>logo</p>
            <h1>ONLINE 3D MODELS VIEWER</h1>
            <div>
                <FontAwesomeIcon icon={faCloudArrowUp} size="2xl" style={{color: "#1c927e",}} />
                <FontAwesomeIcon icon={faRotateRight} size="2xl" style={{color: "#1c927e",}} />
            </div>
        </div>
    );
}

export default Header;
