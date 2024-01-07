import React from "react";
import "./Settings.css";
import {
  Grid,
  Box,
  FormGroup,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  Stack,
} from "@mui/material";
import {
  RecoilRoot,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";
import { ec2TokenState } from "../../atoms/auth";

function Settings() {
  const [clientID, setClientID] = React.useState<string>("");
  const [secret, setSecret] = React.useState<string>("");
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertText, setAlertText] = React.useState<string>("");

  // const ec2token = useRecoilValue(ec2TokenState);
  const setEC2TokenState = useSetRecoilState(ec2TokenState);

  const setEC2Token = (token: string) => {
    setEC2TokenState(token);
  };

  const handleSuccess = () => {
    setAlertText("Successfully retrieved - continue");
    setAlertOpen(true);
  };

  const handleFailure = () => {
    setAlertText("Failure Getting Token");
    setAlertOpen(true);
  };

  const handleClose = () => {
    setAlertOpen(false);
  };

  const handleGetToken = () => {
    fetch(
      "https://api-user.integrations.ecimanufacturing.com:443/oauth2/api-user/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientID,
          client_secret: secret,
          scope: "openid",
          grant_type: "client_credentials",
        }),
      }
    )
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else {
          handleFailure();
        }
      })
      .then((json) => {
        setEC2Token(json.access_token);
        handleSuccess();
      })
      .catch((error) => {
        console.log("error getting token: ", error);
        handleFailure();
      });
  };

  return (
    <div className="settings">
      <Box alignItems="center" sx={{ display: "flex", flexWrap: "wrap" }}>
        <Stack direction="row" spacing={2}>
          <TextField
            id="clientid"
            required
            size="medium"
            label="Client ID"
            value={clientID}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setClientID(event.target.value);
            }}
            variant="outlined"
          />
          <TextField
            required
            size="medium"
            id="secret"
            label="Secret"
            value={secret}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setSecret(event.target.value);
            }}
          />
          <Button
            variant="contained"
            size="medium"
            disabled={secret.length === 0 && clientID.length === 0}
            onClick={handleGetToken}
          >
            Authorize With EC
          </Button>
        </Stack>
        {/* <Grid container spacing={4}>
          <Grid item direction="row" alignItems="center" columnGap={2}>
            <TextField
              id="clientid"
              required
              size="medium"
              label="Client ID"
              value={clientID}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setClientID(event.target.value);
              }}
              variant="outlined"
            />
            <TextField
              required
              size="medium"
              id="secret"
              label="Secret"
              value={secret}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setSecret(event.target.value);
              }}
            />
            <Button
              variant="contained"
              size="medium"
              disabled={secret.length === 0 && clientID.length === 0}
              onClick={handleGetToken}
            >
              Authorize With EC
            </Button>
          </Grid>
        </Grid> */}
      </Box>
      <Dialog open={alertOpen} onClose={handleClose}>
        <DialogTitle>{alertText}</DialogTitle>
        <DialogActions>
          <Button onClick={handleClose} autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Settings;
