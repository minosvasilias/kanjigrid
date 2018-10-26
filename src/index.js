import React from 'react';
import ReactDOM from "react-dom";

import { BrowserRouter, Route } from 'react-router-dom';
import App from './App';

import ReactGA from "react-ga";
ReactGA.initialize("UA-128076159-1", {
  'cookieDomain': 'auto'
});


const logPageView = () => {
    ReactGA.pageview(window.location.pathname);
    return null;
};



ReactDOM.render(
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <div>
        <Route path="/" component={logPageView} />
        <Route exact path="/" component={App} />
        <Route path="/:kanji" component={App} />
      </div>
    </BrowserRouter>,
    document.getElementById('root')
);
