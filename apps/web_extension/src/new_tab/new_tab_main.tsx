import React from 'react';
import { createRoot } from 'react-dom/client';
import { NewTabApp } from './new_tab_app';

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <NewTabApp />
        </React.StrictMode>
    );
}
