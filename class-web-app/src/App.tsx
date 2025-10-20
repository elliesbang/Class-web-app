import { Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import NavbarBottom from './components/NavbarBottom';
import Home from './pages/Home.jsx';
import InternalCourses from './pages/InternalCourses.jsx';
import VOD from './pages/VOD.jsx';
import Notices from './pages/Notices.jsx';
import MyPage from './pages/MyPage.jsx';

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fefaf4]">
      <Header />
      <main className="flex-1 px-4 pb-20 pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/internal" element={<InternalCourses />} />
          <Route path="/vod" element={<VOD />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/mypage" element={<MyPage />} />
        </Routes>
      </main>
      <NavbarBottom />
    </div>
  );
}

export default App;
