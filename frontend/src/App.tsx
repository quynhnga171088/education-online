import { Outlet } from 'react-router-dom'
import { Header } from './widgets/header/Header'
import { Footer } from './widgets/footer/Footer'

function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default App
