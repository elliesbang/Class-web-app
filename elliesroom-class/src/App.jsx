import { Route, Routes } from 'react-router-dom';
import NavbarTop from './components/NavbarTop.jsx';
import Home from './pages/Home.jsx';
import InternalCourses from './pages/InternalCourses.jsx';
import VOD from './pages/VOD.jsx';
import Notices from './pages/Notices.jsx';
import MyPage from './pages/MyPage.jsx';

function App() {
  return (
    <div className="min-h-screen bg-ivory">
      <NavbarTop />
      <main className="pt-20 pb-10 px-4 max-w-md mx-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/internal" element={<InternalCourses />} />
          <Route path="/vod" element={<VOD />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/mypage" element={<MyPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
