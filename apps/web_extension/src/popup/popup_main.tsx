/** apps/web_extension/src/popup/popup_main.tsx */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { PopupApp } from './PopupApp';

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <PopupApp />
        </React.StrictMode>
    );
}