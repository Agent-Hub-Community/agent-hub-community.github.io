import React from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './main';
import { NewsApp } from './news-main';
import { AboutApp } from './about-main';

export function render() {
  return renderToString(<App/>);
}

export function renderNews() {
  return renderToString(<NewsApp/>);
}

export function renderAbout() {
  return renderToString(<AboutApp/>);
}
