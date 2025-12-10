import { useState } from 'react'
import './assets/css/App.css'
import Navbar from './assets/pages/Navbar'
import Footer from './assets/pages/Footer'
import LandingPage from './assets/pages/LandingPage'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Navbar />
      <LandingPage />
      <Footer />
    </>
  )
}

export default App
