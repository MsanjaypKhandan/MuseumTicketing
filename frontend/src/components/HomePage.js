import { Box, Button, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllMuseums } from "../api-helpers/api-helpers";
import MuseumItem from "./Museums/MuseumItem";

// import MuseumItem from "./Museums/MuseumItem";

const HomePage = () => {
  const [museums, setMuseums] = useState([]);
  useEffect(() => {
    getAllMuseums('Museum')
      .then((data) => setMuseums(data.museums))
      .catch((err) => console.log(err));

      
  }, []);
  return (
    <Box width={"100%"} height="100%" margin="auto" marginTop={0} >
       <Box position="relative" margin="auto" width="100%" height="100vh">
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Victoria_Memorial_Kolkata_at_night.jpg/1280px-Victoria_Memorial_Kolkata_at_night.jpg"
        alt="mahabalipuram"
        width="100%"
        height="100%"
      />
      <Button
        variant="contained"
        LinkComponent={Link}
        to="/Museum"
        style={{ position: 'absolute', top: '50%', left: '50%',  transform: 'translate(-50%, -50%)' }}
      >
        Explore Museums
      </Button>
    </Box>
      <Box padding={5} margin="auto">
        <Typography variant="h4" textAlign={"center"}>
         Museums In india
        </Typography>
      </Box>
      <Box
        margin={"auto"}
        display="flex"
        width="100%"
        justifyContent={"space-around"}
        flexWrap="wrap"
      >
        {museums &&
          museums.slice(0,4)
            .map((museum, index) => (
                <MuseumItem
                key={index}
                id={museum._id}
                title={museum.title}
                posterUrl={museum.posterUrl}
                description = {museum.description}
                state ="false"
                // releaseDate={movie.releaseDate}
              />
              
            ))}
      </Box>
      <Box padding={5} margin="auto" sx={{ bgcolor: "#2b2d42", textAlign: "left", justifyContent:"center"}} fullwidth>
      <Typography variant="body1" color="white" paragraph>
        Step into the enchanting world of museums, where every artifact is a brushstroke in the masterpiece of our history.
        Uncover the secrets of the past, dance with the wonders of art, and let the galleries be the portals to a realm where curiosity knows no bounds.
      </Typography>
      <Button
        component={Link}
        to="/museums"
        variant="outlined"
        sx={{ marginTop: 2, color: "white", borderColor: "white" }}
      >
        View All Museums
      </Button>
    </Box>
    </Box>
  );
};

export default HomePage;