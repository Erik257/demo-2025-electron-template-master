import { useEffect } from 'react'
import electronLogo from './assets/electron.svg'

function App() {
  useEffect(() => {
    (async (data="test") => await window.api.foo(data))()
  }, [])


  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <h1>Hello, world!</h1>
    </>
  )
}

export default App

