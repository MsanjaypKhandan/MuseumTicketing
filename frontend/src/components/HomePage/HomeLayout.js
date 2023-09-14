import { Box, Button, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllMovies } from "../../helpers/api-helpers";
import CradLayout from "./CradLayout";

const HomeLayout = () => {
  const [movies, setMovies] = useState();
  useEffect(() => {
    getAllMovies()
      .then((data) => setMovies(data))
      .catch((err) => console.log(err));
  }, []);
  console.log(movies);
  return (
    <Box width="100%" height="100vh" marginTop={2} margin="auto">
      <Box margin={"auto"} width="80%" height="40%" padding={2} display="flex">
        <img
          src="https://i.ytimg.com/vi/yEinBUJG2RI/maxresdefault.jpg"
          alt="Rocketry"
          width="100%"
          height="100%"
        />
      </Box>
      <Box padding={5} margin="auto">
        <Typography variant="h4" textAlign={"center"}>
          MUseums
        </Typography>
      </Box>
      <Box
        gap={5}
        margin="auto"
        width="80%"
        flexWrap={"wrap"}
        display="flex"
        justifyContent={"center"}
      >
        {movies &&
          movies
            .slice(0, 4)
            .map((museum, index) => (
              <CradLayout
                id={museum._id}
                title={museum.title}
                posterUrl={museum.posterUrl}
                description={museum.description}
                key={index}
              />
            ))}
      </Box>
      <Box display={"flex"} padding={5} margin="auto">
        <Button
          variant="outlined"
          LinkComponent={Link}
          to="/museums"
          sx={{ margin: "auto", color: "#2b2d42" }}
        >
          View All 
        </Button>
      </Box>
    </Box>
  );
};

export default HomeLayout;