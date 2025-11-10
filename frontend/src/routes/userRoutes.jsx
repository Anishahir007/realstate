import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import Home from '../pages/home/Home';
import About from '../pages/about/About';
import Login from '../pages/login/Login';


export function UserRoutes() {  
  return (
    <>
    <Route path="/" element={<Home />} />
    <Route path="/about-us" element={<About />} />
    <Route path="/broker" element={<Login />} />
    </>
  );
}


