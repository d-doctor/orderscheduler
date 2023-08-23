import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Settings from './components/Settings/Settings';
import JobsList from './components/JobsList/JobsList';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './components/NavBar/NavBar';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { CssBaseline } from '@mui/material';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// const router = createBrowserRouter([
//   {
//     path: "*",
//     element: <App />,
//     children: [
//       {
//         path: "settings",
//         element: <Settings />,
//       },
//       {
//         path: "schedule",
//         element: <JobsList />,
//       },
//     ],
//   },
  
// ]);

root.render(
  <React.StrictMode>
    {/* <RouterProvider router={router} /> */}
    {/* <BrowserRouter basename="/app"> */}
      <App></App>
    {/* </BrowserRouter> */}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
