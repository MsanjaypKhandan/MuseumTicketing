import React, { useEffect, useState } from 'react'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { deleteBooking, getUserBooking, getUserDetails } from '../../api-helpers/api-helpers';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Box, IconButton, List, ListItem, ListItemText,  Typography } from '@mui/material';
import QRCode from "react-qr-code";

const Profile = () => {
  
   const [user,setUser] = useState();
   const [bookings,setBookings] = useState();

   useEffect(() => {
    getUserBooking().then((res) => setBookings(res.bookings))
    .catch((err) => console.log(err));

    getUserDetails().then((res) => setUser(res.users))
    .catch((err) => console.log(err));
   },[]);
   const handleDelete = (id) => {
    
    deleteBooking(id).then((res) => console.log(res)).catch((err) => console.log(err));
    getUserBooking().then((res) => setBookings(res.bookings))
    .catch((err) => console.log(err));

    // window.location.reload();
   }
  return (
    
   <Box width={'100%'} display={'flex'} flexDirection={{ xs: 'column', md: 'row', lg:'row'}} >
    <Box width={{xs:'100%', md:'30%'}} flexDirection={'column'} textAlign={'center'}
    ml={{xs: 0,md: 3}}>
      <AccountCircleIcon sx={{ fontSize: { xs: '5rem', md: '10rem' } }} />
      {user && <>
        <Typography width={"auto"} padding={"2"} border={"1px solid #ccc"} borderRadius={10} >Name:{user.name}</Typography>
        <Typography width={"auto"} padding={"2"} border={"1px solid #ccc"} borderRadius={10} marginTop={3}>{user.email}</Typography> </>}
    </Box>
    {bookings && <>
      <Box
          width={{ xs: '100%', md: '70%' }} // Full width on extra-small screens, 70% on medium and larger screens
          display="flex"
          flexDirection="column"
          flexWrap="wrap"
        >
       
       <Typography variant='h3' fontFamily={'verdana'} 
       textAlign={'center'} padding={2} >Bookings</Typography>
       {bookings && bookings.length>0 &&  <>
     <Box margin={"auto"} display={"flex"}
      width={{ xs: '100%', md: '60%' }} >
     <List>
       {bookings.map((booking, index) => (
         <ListItem sx={{
           bgcolor:"#00d386",
           color:"black",
           textAlign:"center",
           margin:1,
           padding:1,
          
          //  display:{xs:"column"}
         }}  >
         <ListItemText sx={{margin:1,width:"100%",
         textAlign:"left"}}>{booking.museum.title}</ListItemText>
           <ListItemText sx={{margin:2,width:"100%",
         textAlign:"left"}} >Tickets:{booking.count}</ListItemText>
           <ListItemText sx={{margin:2,width:"100%",
         textAlign:"left"}}>Date:{new Date(booking.date).toDateString()}</ListItemText>
         <ListItemText sx={{margin:1,width:"100%",
         textAlign:"left"}}>  <QRCode
         size={156}
         style={{ height: "auto", maxWidth: "100%", width: "100%" }}
         value={booking.museum._id}
         viewBox={`0 0 156 156`}
         /></ListItemText>
         <IconButton onClick={()=> handleDelete(booking._id)} color='error'>
           <DeleteForeverIcon/>
         </IconButton>
         </ListItem>
       ))}
     </List>
     </Box>
     </>}
 </Box></>}
    
 

   </Box>
   
  )
}

export default Profile
