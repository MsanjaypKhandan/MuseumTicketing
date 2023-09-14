import React, {useState,useEffect} from 'react'
import { useParams } from 'react-router-dom';
import { getMuseumDetails } from "../../api-helpers/api-helpers"
import { Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
const Museumbooking = () => {
  const [museum,setMuseum] = useState();
  const id = useParams().id;
  // console.log(id);

  useEffect(() => {
    getMuseumDetails(id)
    .then((res) => setMuseum(res.museum))
    .catch((err) => console.log(err));
   
  },[id]);
      
  return (
    <div>

  {museum && <>
    <Typography variant={{xs:'h5',md:'h2'}} padding={3} marginY={400} textAlign={"center"}   
    sx={{ fontWeight: 'bold', margin: '400px 0' }} >
          Bookings of {museum.title}
    </Typography>
    <Paper marginY={400} width="100%">
      <Table>
        <TableHead>
          <TableCell>BookingID</TableCell>
          <TableCell>Date</TableCell>
          <TableCell sx={{display:{xs:"none", md: 'table-cell'}}}>UserID</TableCell>
          <TableCell width={"100%"}>No Of Tickets</TableCell>
        </TableHead>
        <TableBody>
          {museum.bookings && museum.bookings.map((row,index) => (
            <TableRow key={index}>
                 <TableCell >
                  <Typography variant="body2" color="textSecondary" width={"100%"}>{row._id}</Typography>
                  </TableCell>
                 <TableCell>
                  <Typography variant="body2" color="textSecondary" width={"100%"}>{new Date(row.date).toDateString()}</Typography>
                  </TableCell>
                 <TableCell>
                  <Typography sx={{display:{xs:"none", md: 'table-cell'}}} variant="body2" color="textSecondary" width={"100%"}>{row.user}</Typography>
                  </TableCell>
                 <TableCell>
                  <Typography  variant="body2" color="textSecondary" width={"100%"}>{row.count}</Typography>
                 </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </Paper>
  </>} 
      </div>   
  )
}

export default Museumbooking
