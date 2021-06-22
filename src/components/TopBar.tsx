import React from 'react';
import '../css/TopBar.css';

const TopBar: React.FC = () => {
    return (
        <header className="mine-header">
            <button type="button">Start</button>
            <button type="button">Reset</button>
            <time>0:00</time>
            <p>Size:</p>
            <p>Mines:</p>
        </header>
    );
};

export default TopBar;
