import { useState } from 'react'
import './assets/css/App.css'
import Navbar from './assets/pages/Navbar'
import Footer from './assets/pages/Footer'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Navbar />
        <h1>Home Page</h1>
      <Footer />
    </>
  )
}

export default App
