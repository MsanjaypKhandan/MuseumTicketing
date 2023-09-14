import React, { Fragment, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getMuseumDetails, newBooking,sendEmail } from '../../api-helpers/api-helpers';
import { Typography,Box, FormLabel, TextField, Button } from '@mui/material';



const Booking = () => {
  const [museum,setMuseum] = useState();
  const [bookingID,setBookingID] = useState();
  const navigate = useNavigate();
  const [inputs,setInputs] = useState({
    count:null,
    date:""
  });
  const id = useParams().id;
 
  useEffect(() => {
    getMuseumDetails(id)
    .then((res) => setMuseum(res.museum))
    .catch((err) => console.log(err));
   
  },[id]);

  const handleChange = (e) => {
    setInputs((prev) => ({
      ...prev,
      [e.target.name]:e.target.value}));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
     if(inputs.count ===''){
      alert("Enter the Number Of Tickets");
     }
     else{
      var options = {
        key :"rzp_test_N1ymzTgUJXDCwr",
        key_secret:"ogaVPwCyl311xSiGr9I2MezO",
        amount : inputs.count*museum.price*100,
        currency : "INR",
        name: "Museum Ticketing",
        description : "For Museum TIcket Booking",
        handler : function(response) {
          newBooking({...inputs,museum:museum._id})
          .then((data) => {
            navigate('/user')
            if(data.booking){
              const booking = data.booking;
              setBookingID(booking._id);
              
              
            }
          })
          .catch((err) => console.log(err));

          sendEmail({...inputs,bookingID:bookingID,museum:museum.title})
          .then((res) => console.log(res))
          .catch((err) => console.log(err));

       },
       prefill:{
        name:"National Museum",
        email:"sanjaym984062@gmail.com",
        contact:"9840626847",
       },
       notes:{
        address:"Museum Corporation Of India",
       },
       theme:{
        color:"#2b2d42"
       }
      };
      var pay = new window.Razorpay(options);
      pay.open();
     }
    
  
  } 

  
  const lines = museum ? museum.description.split('.') : []; 
  const listItems = lines.map((line, index) => 
  index < lines.length - 1 && <li key={index}>{line}</li>
);

    
  
  
  
  
  return (
    <div>
      {museum && <Fragment>
        <Typography variant={{xs:'h5',md:'h2'}} padding={3}  textAlign={"center"} sx={{ fontWeight: 'bold' }}>
          Book Tickets To Visit {museum.title}
        </Typography>
        <Box display={'flex'} justifyContent={"center"} flexDirection={{xs:'column', md:'row'}} >
           <Box marginRight={"auto"} display={"flex"}
            justifyContent={"column"} flexDirection={{xs:'column'}}
           paddingY={3} width={{xs:"100%", md:"50%"}}>
            <Box sx={{ width: { xs: '100%', md: '80%' }, border: '1px solid #2b2d42' ,borderRadius:'5px',marginLeft:{md:"50px"}}}>
              <img  width='100%' height={"300px"} src={museum.posterUrl} alt={museum.title} />
            </Box>
            <Box width={"100%"} marginTop={3} textAlign={'left'}>
              
              <ul sx={{textAlign:"left"}}>{listItems}</ul>
              <Typography> <span style={{ fontWeight: 'bold',margin:"40px" }}>Location:</span>{museum.location}</Typography>
              <Typography><span style={{ fontWeight: 'bold', margin:"40px"}}>Price:</span>{museum.price}</Typography>
                
           </Box>
           </Box>
           <Box width={{ xs: '100%', md: '50%' }} paddingTop={5} >
              <form onSubmit={handleSubmit}>
                <Box
                  sx={{backgroundColor:"#d3d3d3"}}
                   padding={4}
                   margin={'auto'}
                   display={"flex"}
                   flexDirection={"column"}
                   textAlign={"left"}>
                    <FormLabel>No of Tickets</FormLabel>
                     <TextField name='count'
                     type={'number'}
                     margin='normal'
                     variant='standard'
                     value={inputs.count}
                     onChange={handleChange}/>

                     <FormLabel>Date</FormLabel>
                     <TextField name='date'
                     type='date'
                     margin='date'
                     variant='standard'
                     value={inputs.date}
                     onChange={handleChange}/>
                     <Button type="submit" sx={{mt:3}} width={"30%"} color='success' >Book Now</Button>
                </Box>
              </form>

           </Box>
        </Box>

        
        </Fragment>

       }
      
    </div>
  )
}

export default Booking
