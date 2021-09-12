import React from 'react';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';
import Home from './components/Home/Home';
import './App.global.css';

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Home} />
      </Switch>
    </Router>
  );
}
