import React from 'react';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';
import Home from './components/Home/Home';
import Player from './components/Player/Player';

import './App.global.css';

export default function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/:id" component={Player} />
      </Switch>
    </Router>
  );
}
