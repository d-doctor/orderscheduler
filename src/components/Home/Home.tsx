import React from "react";
import { Alert, Box } from "@mui/material";

function Home() {
  return (
    <Box>
      <Alert severity="warning">
        Login in the upper right, then continue to settings to connect to jobs
        list.
      </Alert>
    </Box>
  );
}

export default Home;
