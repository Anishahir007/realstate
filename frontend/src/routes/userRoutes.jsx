import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import Home from '../pages/home/Home';
import About from '../pages/about/About';


export function UserRoutes() {  
  return (
    <>
    <Route path="/" element={<Home />} />
    <Route path="/about-us" element={<About />} />
    </>
  );
}


