
import { Route, Routes } from 'react-router-dom';
import './App.css';
import AdminAuth from './components/Auth/AdminAuth';
import Auth from './components/Auth/Auth';
import Header from './components/Header/Header';
import HomePage from './components/HomePage';
import Museums from './components/Museums/Museums';
import UserProfile from './components/profile/UserProfile'
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { userActions,adminActions } from './store';
import Booking from './components/Booking/Booking';
import AddMuseum from './components/Museums/AddMuseum';
import AdminProfile from './components/profile/AdminProfile';
import Museumbooking from './components/Booking/Museumbookings';

function App() {
  const dispatch = useDispatch();

  const isAdminLoggedIn = useSelector((state)=>state.admin.isLogedIn);
  const isUserLoggedIn = useSelector((state)=>state.user.isLogedIn);
  console.log("isAdminlogedIn",isAdminLoggedIn);
  console.log("isuserlogedIn",isUserLoggedIn);
  useEffect(() => {
    if(localStorage.getItem("userId")){
      dispatch(userActions.login());
    }
    else if(localStorage.getItem("adminId")){
      dispatch(adminActions.login());
    }
  }, [dispatch]);
  return (
    <div className="App">
      <Header></Header>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/museums" element={<Museums />} />
          <Route path="/admin" element={<AdminAuth />} />
          <Route path="/auth" element={<Auth />} />
          <Route path='/booking/:id' element={<Booking />} />
        
          {isUserLoggedIn && !isAdminLoggedIn && <>
            
            <Route path='/user' element={<UserProfile />} />
           
          </>}
          (isAdminlogedIn && !isuserlogedIn && <>
            <Route path='/museum_bookings/:id' element={<Museumbooking />} />
            <Route path='/add' element={<AddMuseum />} />
            <Route path='/User-admin' element={<AdminProfile/>} />
          </>)
        
        </Routes>
    </div>
  );
}

export default App;
