import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar,Box, TextField,Autocomplete, Tabs,Tab, IconButton,Menu,MenuItem,MenuList } from "@mui/material"
// import MuseumRoundedIcon from '@mui/icons-material/MuseumRounded';
import MuseumIcon from '@mui/icons-material/Museum';
import { getAllMuseums } from '../../api-helpers/api-helpers';
import {useDispatch, useSelector} from "react-redux"
import { adminActions, userActions } from '../../store';
import MenuIcon from '@mui/icons-material/Menu';
const Header = () => {
   
   const [anchorNav,setAnchorNav] = useState(false);
   const handleClick = () => {
    setAnchorNav(!anchorNav);
   }

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const logout = (isadmin) => {
        dispatch(isadmin? adminActions.logout() : userActions.logout());
    };
    const isAdminLoggedIn = useSelector((state)=>state.admin.isLogedIn);
  const isUserLoggedIn = useSelector((state)=>state.user.isLogedIn);
   const [museums,setMuseums] = useState([]);
  
   
    useEffect(()=>{
        getAllMuseums('Museum')
        .then((data) => setMuseums(data.museums || []))
        .catch((err) => console.log(err));
    },[]);

    const handleChange = (e,val) => {
      
      const museum = museums.find((m) => m.title === val);
      if(museum && isAdminLoggedIn){
        navigate(`/museum_bookings/${museum._id}`)
     }
      if(museum && isUserLoggedIn){
       
           navigate(`/booking/${museum._id}`)
      }
    }
    
    return(
        <AppBar position='sticky' sx={{bgcolor:"#2b2d42", width: '100%'}} >
            <Toolbar>
               <Box  width = "20%" >
                <IconButton width="1000px" color='inherit' LinkComponent={Link} to="/">
                <MuseumIcon />
                </IconButton>
                
               </Box>
               <Box width="40%" margin={"auto"} >
               <Autocomplete
               onChange={handleChange}
        sx={{width: { xs: '100%', md: '60%' }, borderRadius:10,margin:"auto"}}
        freeSolo
        options={museums && museums.map((option) => option.title)}
        renderInput={(params) => <TextField 
          sx={{ input: { color: "white" } }} variant='standard' {...params} 
          placeholder='Search across various museums' />}
      />
               </Box>
               <Box display="flex"  flex={'block'} sx={{display:{xs:'none',md:'flex'}}}>
                <Tabs indicatorColor='secondary' textColor='inherit'>
                     <Tab  label="Museums" LinkComponent={Link} to="/Museum" /> 
                     <Tab  label="Heritage Site" LinkComponent={Link} to="/Heritage_Site" value={0}/> 
                     {!isAdminLoggedIn && !isUserLoggedIn && <>
                        <Tab label="User"  LinkComponent={Link} to="/auth"  value={1}/>
                       <Tab label="Admin"  LinkComponent={Link} to="/admin" value={2}/>

                     </>}
                     {isUserLoggedIn && <>
                        <Tab label="Profile"  LinkComponent={Link} to="/user"  value={1}/>
                       <Tab onClick={()=> logout(false)} label="Logout"  LinkComponent={Link} to="/" value={2}/>
                     </>}

                     {isAdminLoggedIn && <> 

                        <Tab label="Profile"  LinkComponent={Link} to="/User-admin"  value={1}/>
                        <Tab label="Add"  LinkComponent={Link} to="/add"  value={1}/>
                       <Tab onClick={() => logout(true)} label="Logout"  LinkComponent={Link} to="/" value={2}/>
                     </>}
                    
                </Tabs>
               </Box>
               <Box sx={{display:{xs:'flex',md:'none'}}} marginLeft={'auto'}>
                      <IconButton color='inherit' size='large' edge='end' onClick={handleClick}>
                          <MenuIcon/>
                          <Menu open={anchorNav} edge='start' >
                            <MenuList sx={{bgcolor:"#2b2d42",color:"white"}}>
                              <MenuItem><Tab  label="Museums" LinkComponent={Link} to="/Museum" /> </MenuItem>
                              <MenuItem><Tab  label="Heritage Sites" LinkComponent={Link} to="/Heritage_Site" value={0}/> </MenuItem>
                              {!isAdminLoggedIn && !isUserLoggedIn && <>
                              <MenuItem><Tab label="User"  LinkComponent={Link} to="/auth"  value={1}/></MenuItem> 
                               <MenuItem><Tab label="Admin"  LinkComponent={Link} to="/admin" value={2}/></MenuItem> 

                     </>}
                     {isUserLoggedIn && <>
                       <MenuItem><Tab label="Profile"  LinkComponent={Link} to="/user"  value={1}/></MenuItem>
                        <MenuItem><Tab onClick={()=> logout(false)} label="Logout"  LinkComponent={Link} to="/" value={2}/></MenuItem>  
                     </>}

                     {isAdminLoggedIn && <> 

                        <MenuItem><Tab label="Profile"  LinkComponent={Link} to="/User-admin"  value={1}/></MenuItem>
                        <MenuItem><Tab label="Add Museums"  LinkComponent={Link} to="/add"  value={1}/></MenuItem>
                       <MenuItem><Tab onClick={() => logout(true)} label="Logout"  LinkComponent={Link} to="/" value={2}/></MenuItem>
                     </>}
                            </MenuList>
                          </Menu>
                      </IconButton>
               </Box>
            </Toolbar>
        </AppBar>
  
  
)}

export default Header;
