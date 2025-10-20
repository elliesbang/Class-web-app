import { Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import NavSection from './components/NavSection';
import NavbarTop from './components/NavbarTop.jsx';
import Home from './pages/Home.jsx';
import InternalCourses from './pages/InternalCourses.jsx';
import VOD from './pages/VOD.jsx';
import Notices from './pages/Notices.jsx';
import MyPage from './pages/MyPage.jsx';

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <Header />
      <NavbarTop />
      <main className="flex-1 px-4 pb-10 pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/internal" element={<InternalCourses />} />
          <Route path="/vod" element={<VOD />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/mypage" element={<MyPage />} />
        </Routes>
      </main>
      <NavSection />
    </div>
  );
}

export default App;
