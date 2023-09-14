import React from 'react'
import Authform from './Authform'
import { sendAdminAuthRequest } from '../../api-helpers/api-helpers'
import { useDispatch } from 'react-redux'
import { adminActions } from '../../store'
import { useNavigate } from 'react-router-dom'

const Admin = () => {
  const navigate = useNavigate();
  const dispatch  = useDispatch()
  const onResReceived = (data) => {
    console.log(data);
    dispatch(adminActions.login());
    localStorage.setItem("adminId",data.id);
    localStorage.setItem("token",data.token);
    navigate("/");
  } 
  const getdata = (data) => {
    // console.log("auth",data);
   sendAdminAuthRequest(data.inputs).then(onResReceived)
    .catch((err)=>console.log(err))
}
  return (
    <div>
       <Authform onsubmit={getdata} isadmin={true}/>
    </div>
  )
}

export default Admin
