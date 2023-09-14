import React from 'react'
import Authform from './Authform'
import { sendUserAuthRequest } from '../../api-helpers/api-helpers';
import { useDispatch } from 'react-redux';
import { userActions } from '../../store';
import { useNavigate } from 'react-router-dom';
const Auth = () => {
   const naviagate = useNavigate();
    const dispatch = useDispatch()
    const onResReceived = (data) => {
      // console.log(data.data);
      dispatch(userActions.login());
      localStorage.setItem("userId",data.existingUser._id);
      naviagate("/");
    };
  const getdata = (data) => {
      // console.log("auth",data);
      sendUserAuthRequest(data.inputs,data.signup)
      .then(onResReceived )
      .catch((err)=>console.log(err))
  }
  return (
    <div>
       
      <Authform onsubmit={getdata} isadmin={false}/>
    </div>
  )
}

export default Auth
