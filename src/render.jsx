import React from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './main';
import { CommunityApp } from './community';

export function render(page = 'home') {
  return renderToString(page === 'community' ? <CommunityApp/> : <App/>);
}
