import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import OtpVerification from './pages/OtpVerification';
import AddDetails from './pages/AddDetails';
import UploadPhoto from './pages/UploadPhoto';
import SharePoster from './pages/SharePoster';
import CorsErrorTest from './pages/CorsErrorTest';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="App">
        <Routes>
          <Route path="/add-details" element={
            <main className="main-content">
              <AddDetails />
            </main>
          } />
          
          <Route path="/otp-verification" element={
            <main className="main-content">
              <OtpVerification />
            </main>
          } />
          
          <Route path="/upload-photo" element={
            <main className="main-content">
              <UploadPhoto />
            </main>
          } />
          
          <Route path="/share-poster" element={
            <main className="main-content">
              <SharePoster />
            </main>
          } />
          
          <Route path="/" element={
            <main className="main-content">
              <LandingPage />
            </main>
          } />
          
          <Route path="/cors-test" element={
            <main className="main-content">
              <CorsErrorTest />
            </main>
          } />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
