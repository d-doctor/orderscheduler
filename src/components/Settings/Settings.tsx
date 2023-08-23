import React from 'react';
import { Grid, FormGroup, TextField } from '@mui/material';

function Settings() {
  
    return (
      <Grid container spacing={2}>
        {/* <p>Settings</p> */}
        {/* <FormGroup> */}
          <TextField id="outlined-basic" label="Outlined" variant="outlined" />
        {/* </FormGroup> */}
        </Grid>
    );
  }
  
  export default Settings;