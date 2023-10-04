import React, { useEffect, useState } from 'react'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import {deleteMuseum, getadminById, updateMuseum } from '../../api-helpers/api-helpers';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import UpdateIcon from '@mui/icons-material/Update';
import { Dialog,FormLabel,Button,TextField, Box,  List, ListItem, ListItemText, Typography,IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';



const labelProps = {mt: 1,mb: 1};

const AdminProfile = () => {
  
  const navigate = useNavigate()
   const [admin,setAdmin] = useState();
   const [museumId,setMuseumId] = useState();
   const [update,setUpdate] = useState(false);
   const [inputs,setInputs] = useState({
    name:"",
    description:"",
    posterUrl:"",
    location:"",
    price:"",
   });

  
   useEffect(() => {
  

    getadminById().then((res) => setAdmin(res.admin))
    .catch((err) => console.log(err));
   },[]);

   //Deleting a museum
   const handleDelete = (id) => {
    console.log(id);
    deleteMuseum(id).then((res) => console.log(res)).catch((err) => console.log(err));
   
   }
  
   const handleChange = (e) => {
    setInputs((prev) => ({
      ...prev,
      [e.target.name]:e.target.value,
    }));
   };

   //updating a museum 
   const handleUpdate = (id) => {
    console.log(id); 
     setMuseumId(id);
    setUpdate(true);
 }

 const [successMessage, setSuccessMessage] = useState('');
    const handleSubmit = (e) => {
         e.preventDefault();
         console.log(inputs);
         updateMuseum({museumId,...inputs}).then((res) => {console.log(res);
          setSuccessMessage("Updated Sucessfuly")
          setTimeout(() => {
            navigate('/Museum');
          },1500);

         })
         .catch((err)=> console.log(err))
        //  window.location.reload();
    }
  return (
   <Box width={'100%'} display={'flex'} flexDirection={{xs:'column' , md:'row'}}>
    <Box width={{xs:'100%',md:"30%"}} flexDirection={'column'}>
        <AccountCircleIcon sx={{fontSize: "10rem", textAlign: "center", ml:3}}/>
      {admin && <>  
        <Typography width={"auto"} padding={"2"} border={"1px solid #ccc"} borderRadius={10} marginTop={3}>{admin.email}</Typography> </>}
    </Box>
    {admin && admin.addedMuseum.length>0 && <>
        <Box width={{xs:'80%',md:"70%"}} display={'flex'} flexDirection={'column'}>
       
       <Typography variant='h5' fontFamily={'verdana'} 
       textAlign={'center'} padding={2} >
         Added Museums
       </Typography>
       {admin.addedMuseum && <>
     <Box margin={"auto"} display={"flex"}
     flexDirection={'column'} width={{xs:"100%",md:"60%"}}>
     <List>
       {admin.addedMuseum.map((museum, index) => (
         <ListItem sx={{
           bgcolor:"#00d386",
           color:"black",
           textAlign:"center",
           margin:1
         }}>
         <ListItemText sx={{margin:1,width:"100%",
         textAlign:"left"}}>Museum:{museum.title}</ListItemText>
          <IconButton onClick={()=> handleDelete(museum._id)} color='error'>
           <DeleteForeverIcon/>
         </IconButton>
         <IconButton onClick={() => handleUpdate(museum._id)} color='success'>
            <UpdateIcon />
         </IconButton>
         </ListItem>
       ))}
     </List>
     </Box>
     </>}
 </Box>
    </>}
    <Dialog PaperProps={{ style: {borderRadius:20}}} open={update} fullWidth>
    <form onSubmit={handleSubmit}>
            <Box  paddingY={10} paddingX={1} margin={"auto"} 
            display={'flex'} flexDirection={'column'} textAlign={"left"} boxShadow={"10px 10px 20px #ccc"}>
                <Typography textAlign={'center'} variant='h5' fontFamily={'verdana'}>
                     Add New Museum
                </Typography>
                <FormLabel sx={labelProps}> Name</FormLabel>
                <TextField value={inputs.name} onChange={handleChange} name='name' variant='standard' margin='normal' ></TextField>
                <FormLabel sx={labelProps}>Description</FormLabel>
                <TextField value={inputs.description} onChange={handleChange} name='description' variant='standard' margin='normal'></TextField>  
                <FormLabel sx={labelProps}>posterUrl</FormLabel>
                <TextField value={inputs.posterUrl} onChange={handleChange} name='posterUrl' variant='standard' margin='normal' ></TextField>
                <FormLabel sx={labelProps}>Location</FormLabel>
                <TextField value={inputs.location} onChange={handleChange} name='location' variant='standard' margin='normal'></TextField>
                <FormLabel sx={labelProps}>Ticket Price</FormLabel>
                <TextField value={inputs.price} onChange={handleChange} name='price' variant='standard' margin='normal' ></TextField>
                <Button width={"30%"} margin={"auto"} variant='contained' sx={{width:"30",bgcolor:"#2b2d42", ":hover":{bgcolor:"#121217"}}} type='submit'>
                  Update Museum Details</Button>
                  {successMessage && (
            <Dialog   PaperProps={{ style: {borderRadius:20, maxWidth: 'md', width: '80%', maxHeight: '10vh', backgroundColor:"#2b2d42", color:"white", height: '10vh', textAlign:"center", justifyContent:"center"} }}  open={true}>
              {successMessage}
            </Dialog>
          )}
            </Box>
        </form>
        </Dialog>
   </Box>
  )
}

export default AdminProfile
