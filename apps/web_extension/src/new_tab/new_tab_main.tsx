import React from 'react';
import { createRoot } from 'react-dom/client';
import { MvpApp } from './NewTabApp';

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <MvpApp />
        </React.StrictMode>
    );
}