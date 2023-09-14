import {
    Button,
    Card,
    CardActions,
    CardContent,
    Typography,
  } from "@mui/material";
  import React  from "react";
  import { Link } from "react-router-dom";
  
  const MuseumItem = ({ title,posterUrl,id,description,state}) => {
   
    return (
      <Card
        sx={{
           marginTop:4,
           marginLeft:2,
          width:  360,
          height: 420,
          borderRadius: 5,
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 0.3s',
          ":hover": {
            transform: 'scale(1.1)',
            boxShadow: "10px 10px 20px #ccc",
            
          },
        }}
      >
        <img height={"55%"} width="100%" src={posterUrl} alt={title} />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {title}
          </Typography>
          <Typography 
           variant="p"
           component="div"
           sx={{
            textAlign:"left",
             display: "-webkit-box",
             WebkitBoxOrient: "vertical",
             overflow: "hidden",
             WebkitLineClamp: 2, // Display only 4 lines
           }}>
            {description}
          </Typography>
          {!localStorage.getItem("userId") && !localStorage.getItem("adminId") &&
          <Typography  LinkComponent={Link}
          to={`/admin`} sx={{textAlign:"left",color:"tomato",marginTop:2}}>Login AS User to book Tickets</Typography>}
          
        </CardContent>
        <CardActions>
          {state === '1' && localStorage.getItem("userId") &&
           <Button
            variant="contained"
            width='90%'
            LinkComponent={Link}
            to={`/booking/${id}`}
            sx={{
              marginRight: "auto",
              bgcolor: "#2b2d42",
              ":hover": {
                bgcolor: "#121217",
                borderRadius: 5,
              },
            }}
            size="small"
          >
            Book
          </Button> }
          {state === '1' && localStorage.getItem("adminId") &&
           <Button
            variant="contained"
            width='90%'
            LinkComponent={Link}
            to={`/Museum_bookings/${id}`}
            sx={{
              marginRight: "auto",
              bgcolor: "#2b2d42",
              ":hover": {
                bgcolor: "#121217",
                borderRadius: 5,
              },
            }}
            size="small"
          >
            View Bookings
          </Button> }
        </CardActions>
      </Card>
    );
  };
  
  export default MuseumItem;