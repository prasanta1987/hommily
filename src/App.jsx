import { useState } from 'react'
import './assets/css/App.css'
import Navbar from './assets/pages/Navbar'
import Footer from './assets/pages/Footer'
import LandingPage from './assets/pages/LandingPage'

function App() {

  return (
    <div className='d-flex flex-column vh-100'>
      <Navbar />
      <LandingPage />
      <Footer />
    </div>
  )
}

export default App
