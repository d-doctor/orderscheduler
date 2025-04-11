import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  Typography,
} from '@mui/material';
import { routingsMapState } from '../../atoms/settings';
import { useRecoilState } from 'recoil';
import { Routing } from '../../interfaces/VendorModels';

interface Props {
  open: boolean;
  onCancel: () => void;
  onClose: (selectedRoutings: Routing[]) => void;
  routings: Routing[];
}

function PrefillModal({ open, onCancel, onClose, routings }: Props) {
  const [routingsMap] = useRecoilState(routingsMapState);
  const [installRoutings, setInstallRoutings] = useState<Routing[]>();
  const [productionRoutings, setProductionRoutings] = useState<Routing[]>();
  const [otherRoutings, setOtherRoutings] = useState<Routing[]>();
  const [checkboxState, setCheckboxState] = useState<Map<string, boolean>>(
    new Map()
  );

  const saveAndClose = useCallback(() => {
    let selectedRoutings = [] as Routing[];
    routings.forEach((routing) => {
      if (checkboxState.get(routing.workCenter)) {
        selectedRoutings.push(routing);
      }
    });
    onClose(selectedRoutings);
  }, [checkboxState, onClose, routings]);

  useEffect(() => {
    console.log('use effect on routings list change');
    let installRoutings = [] as Routing[];
    let productionRoutings = [] as Routing[];
    let otherRoutings = [] as Routing[];
    let checkboxes = new Map();
    routings.forEach((routing) => {
      const routingSetting = routingsMap.find(
        (rs) => rs.routingCode === routing.workCenter
      );
      checkboxes.set(routingSetting?.routingCode, false);
      if (routingSetting && routingSetting.category === 'Production') {
        productionRoutings.push(routing);
      } else if (routingSetting && routingSetting.category === 'Install') {
        installRoutings.push(routing);
      } else {
        otherRoutings.push(routing);
      }
    });
    setInstallRoutings(installRoutings);
    setProductionRoutings(productionRoutings);
    setOtherRoutings(otherRoutings);
    setCheckboxState(checkboxes);
  }, [routings, routingsMap]);

  const handleChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
    let tempCheckboxes = new Map(checkboxState);
    tempCheckboxes.set(event.target.name, event.target.checked);
    setCheckboxState(tempCheckboxes);
  };

  return (
    <>
      <Dialog open={open} onClose={onCancel}>
        <DialogTitle>Select which steps to prefill</DialogTitle>
        <DialogContent dividers>
          <Grid container direction="column" rowGap={2}>
            {installRoutings && installRoutings.length > 0 && (
              <>
                <Grid item direction="row">
                  <Typography>Install</Typography>
                </Grid>
                <Divider></Divider>
              </>
            )}
            {installRoutings &&
              installRoutings?.map((ir: Routing, idx: number) => (
                <Grid item direction="row">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkboxState.get(ir.workCenter)}
                        name={ir.workCenter}
                        onChange={handleChecked}
                      />
                    }
                    label={ir.workCenter + ' ' + ir.description}
                  />
                </Grid>
              ))}
            {productionRoutings && productionRoutings.length > 0 && (
              <>
                <Grid item direction="row">
                  <Typography>Production</Typography>
                </Grid>
                <Divider></Divider>
              </>
            )}
            {productionRoutings &&
              productionRoutings?.map((pr: Routing, idx: number) => (
                <Grid item direction="row">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkboxState.get(pr.workCenter)}
                        name={pr.workCenter}
                        onChange={handleChecked}
                      />
                    }
                    label={pr.workCenter + ' ' + pr.description}
                  />
                </Grid>
              ))}
            {otherRoutings && otherRoutings.length > 0 && (
              <>
                <Grid item direction="row">
                  <Typography>Other</Typography>
                </Grid>
                <Divider></Divider>
              </>
            )}
            {otherRoutings &&
              otherRoutings?.map((or: Routing, idx: number) => (
                <Grid item direction="row">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkboxState.get(or.workCenter)}
                        name={or.workCenter}
                        onChange={handleChecked}
                      />
                    }
                    label={or.workCenter + ' ' + or.description}
                  />
                </Grid>
              ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => saveAndClose()}>Prefill</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default PrefillModal;
