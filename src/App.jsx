import './App.css'
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail/ProductDetail';

function App() {

  return (
    <div>
      <Routes>
         <Route path="/" element={<Home />} />
      </Routes>

      <Toaster/>
    </div>
  )
}

export default App
