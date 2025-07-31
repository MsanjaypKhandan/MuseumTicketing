import React, { Fragment, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getMuseumDetails, getSlots, newBooking, joinWaitlist, sendEmail } from '../../api-helpers/api-helpers';
import { Typography, Box, FormLabel, TextField, Button, MenuItem } from '@mui/material';

const Booking = () => {
  const [museum, setMuseum] = useState();
  const [slots, setSlots] = useState([]);
  const navigate = useNavigate();
  const [inputs, setInputs] = useState({ count: 1, slotId: "" });
  const id = useParams().id;

  useEffect(() => {
    getMuseumDetails(id)
      .then((res) => setMuseum(res.museum))
      .catch((err) => console.log(err));
    getSlots(id)
      .then((s) => setSlots(s))
      .catch((err) => console.log(err));
  }, [id]);

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const selectedSlot = slots.find((s) => s._id === inputs.slotId);

  const formatSlot = (s) => {
    const day = new Date(s.date).toLocaleDateString();
    const available = s.capacity - s.booked;
    return `${day}  ${s.startTime}-${s.endTime}  (${available > 0 ? `${available} left` : "FULL"})`;
  };

  const completeBooking = async () => {
    const data = await newBooking({ slotId: inputs.slotId, count: Number(inputs.count) });

    if (data?.error && data.code === "SLOT_FULL") {
      const wantsWaitlist = window.confirm("This slot is full. Join the waitlist? You'll be auto-booked if a spot opens.");
      if (wantsWaitlist) {
        const wl = await joinWaitlist({ slotId: inputs.slotId, count: Number(inputs.count) });
        if (!wl?.error) {
          alert("You're on the waitlist. We'll notify you if a spot opens up.");
          navigate('/user');
        }
      }
      return;
    }
    if (data?.error) {
      alert(data.message || "Booking failed");
      return;
    }

    if (data.booking) {
      sendEmail({
        date: selectedSlot ? new Date(selectedSlot.date).toLocaleDateString() : "",
        count: inputs.count,
        bookingID: data.booking._id,
        museum: museum.title,
        price: museum.price,
      }).catch((err) => console.log(err));
      navigate('/user');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputs.slotId) { alert("Please select a time slot"); return; }
    if (!inputs.count || Number(inputs.count) < 1) { alert("Enter the number of tickets"); return; }

    const options = {
      key: "rzp_test_N1ymzTgUJXDCwr",
      amount: inputs.count * museum.price * 100,
      currency: "INR",
      name: "Museum Ticketing",
      description: "Museum Ticket Booking",
      handler: function () { completeBooking(); },
      prefill: { name: "Visitor", email: "", contact: "" },
      notes: { address: "Museum Corporation Of India" },
      theme: { color: "#2b2d42" },
    };
    const pay = new window.Razorpay(options);
    pay.open();
  };

  const lines = museum ? museum.description.split('.') : [];
  const listItems = lines.map((line, index) =>
    index < lines.length - 1 && <li key={index}>{line}</li>
  );

  return (
    <div>
      {museum && <Fragment>
        <Typography variant={{ xs: 'h5', md: 'h2' }} padding={3} textAlign={"center"} sx={{ fontWeight: 'bold' }}>
          Book Tickets To Visit {museum.title}
        </Typography>
        <Box display={'flex'} justifyContent={"center"} flexDirection={{ xs: 'column', md: 'row' }} >
          <Box marginRight={"auto"} display={"flex"} justifyContent={"column"} flexDirection={{ xs: 'column' }}
            paddingY={3} width={{ xs: "100%", md: "50%" }}>
            <Box sx={{ width: { xs: '100%', md: '80%' }, border: '1px solid #2b2d42', borderRadius: '5px', marginLeft: { md: "50px" } }}>
              <img width='100%' height={"300px"} src={museum.posterUrl} alt={museum.title} />
            </Box>
            <Box width={"100%"} marginTop={3} textAlign={'left'}>
              <ul>{listItems}</ul>
              <Typography><span style={{ fontWeight: 'bold', margin: "40px" }}>Location:</span>{museum.location}</Typography>
              <Typography><span style={{ fontWeight: 'bold', margin: "40px" }}>Price:</span>{museum.price}</Typography>
              {selectedSlot && (
                <Typography>
                  <span style={{ fontWeight: 'bold', margin: "40px" }}>Seats left in selected slot:</span>
                  {selectedSlot.capacity - selectedSlot.booked}
                </Typography>
              )}
            </Box>
          </Box>
          <Box width={{ xs: '100%', md: '50%' }} paddingTop={5} >
            <form onSubmit={handleSubmit}>
              <Box sx={{ backgroundColor: "#d3d3d3" }} padding={4} margin={'auto'} display={"flex"} flexDirection={"column"} textAlign={"left"}>
                <FormLabel>No of Tickets</FormLabel>
                <TextField name='count' type={'number'} margin='normal' variant='standard'
                  value={inputs.count} onChange={handleChange} InputProps={{ inputProps: { min: 1 } }} />

                <FormLabel>Time Slot</FormLabel>
                <TextField name='slotId' select margin='normal' variant='standard'
                  value={inputs.slotId} onChange={handleChange}>
                  {slots.length === 0 && <MenuItem value="" disabled>No slots available</MenuItem>}
                  {slots.map((s) => (
                    <MenuItem key={s._id} value={s._id} disabled={s.capacity - s.booked <= 0}>
                      {formatSlot(s)}
                    </MenuItem>
                  ))}
                </TextField>

                <Button type="submit" sx={{ mt: 3 }} color='success'>Book Now</Button>
              </Box>
            </form>
          </Box>
        </Box>
      </Fragment>}
    </div>
  )
}

export default Booking
