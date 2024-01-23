import { Box, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
// import Museum from "../../../../backend/models/Museum";
import { getAllMuseums } from "../../api-helpers/api-helpers";
import MuseumItem from "./MuseumItem";

const Museums = () => {
  const [museums, setMuseums] = useState([]);
  useEffect(() => {
    getAllMuseums()
      .then((data) => setMuseums(data.museums))
      .catch((err) => console.log(err));
  }, []);
  return (
    <Box margin={"auto"} marginTop={4}>
       <Typography variant="h4" gutterBottom>
        Explore the World of Museums
      </Typography>
      <Box
        margin={"auto"}
        display="flex"
        width="100%"
        justifyContent={"space-between"}
        flexWrap="wrap"
      >
        {museums &&
          museums
            .map((museum, index) => (
                <MuseumItem
                key={index}
                id={museum._id}
                title={museum.title}
                posterUrl={museum.posterUrl}
                description={museum.description}
                state = '1'
                // releaseDate={movie.releaseDate}
              />
              
            ))}
      </Box>
    </Box>
  );
};

export default Museums;