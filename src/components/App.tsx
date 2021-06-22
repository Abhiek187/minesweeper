import React from 'react';
import '../css/App.css';
import Board from './Board';
import TopBar from './TopBar';

const App: React.FC = () => {
    return (
        <div className="App">
            <h1 className="title">Minesweeper</h1>
            <TopBar />
            <Board />
        </div>
    );
};

export default App;
