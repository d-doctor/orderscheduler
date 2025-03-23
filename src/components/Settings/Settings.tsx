import React, { useCallback, useEffect, useState } from 'react';
import './Settings.css';
import { Button, Card, Grid, TextField, Typography } from '@mui/material';
import { useRecoilState } from 'recoil';
import { routingsMapState } from '../../atoms/settings';
import SettingsAddEditRoutingModal from '../SettingsAddEditRouting/SettingsAddEditRoutingModal';
import { FirebaseRoutingSetting } from '../../interfaces/FirebaseModels';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../../service/firebase';
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal';

function Settings() {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [deleteRouting, setDeleteRouting] = useState<FirebaseRoutingSetting>();
  const [routingsMap, setRoutingsMap] = useRecoilState(routingsMapState);

  useEffect(() => {
    try {
      let routingsSnapshot = getDocs(
        query(collection(db, 'routingMap'), orderBy('routingCode'))
      );
      routingsSnapshot.then((routs) => {
        let theList: FirebaseRoutingSetting[] = [];
        // new Array<FirebaseRoutingSetting>({} as FirebaseRoutingSetting);
        routs.forEach((doc) => {
          const docData = doc.data();
          console.log('one doc', doc.data());
          theList.push({
            routingCode: docData.routingCode,
            calendarID: docData.calendarID,
            calendarName: docData.calendarName,
            locked: docData.locked,
          });
        });
        console.log('the list ', theList);
        setRoutingsMap(theList);
      });
    } catch (e) {
      console.log('error looking up routing');
    }
  }, [setRoutingsMap]);

  const openAddModal = useCallback(() => {
    setShowAddModal(true);
  }, [setShowAddModal]);

  const openDeleteModal = useCallback((editItem: FirebaseRoutingSetting) => {
    setDeleteRouting(editItem);
    setDeleteConfirmOpen(true);
  }, []);

  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
  }, [setShowAddModal]);

  const deleteRoutingRow = useCallback(() => {
    const performDelete = async () => {
      try {
        if (deleteRouting && deleteRouting.routingCode.length > 0) {
          await deleteDoc(doc(db, 'routingMap', deleteRouting?.routingCode));
          const index = routingsMap.findIndex(
            (routItem) => routItem.routingCode === deleteRouting.routingCode
          );
          const newList = [
            ...routingsMap.slice(0, index),
            ...routingsMap.slice(index + 1),
          ];
          setRoutingsMap(newList);
          setDeleteConfirmOpen(false);
        }
      } catch (e) {
        console.log('could not delete');
      }
    };
    performDelete();
  }, [deleteRouting, routingsMap, setRoutingsMap]);

  return (
    <div className="settings">
      {/* <RoutingRowCreator></RoutingRowCreator> */}
      <Grid container xs={9} direction="column" rowGap={1}>
        <Grid container item direction="row" justifyContent="space-between">
          <Typography variant="h5">Routing Configuration</Typography>
          <Button variant="contained" size="medium" onClick={openAddModal}>
            Add
          </Button>
        </Grid>

        {routingsMap.map((routingItem) => (
          // { !!routingItem && (
          <Card variant="outlined">
            <Grid
              container
              item
              direction="row"
              alignItems="center"
              columnGap={1}
            >
              <TextField
                size="small"
                disabled
                label={routingItem.routingCode}
              />
              <Typography>{routingItem.calendarName}</Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => openDeleteModal(routingItem)}
              >
                Delete
              </Button>
            </Grid>
          </Card>
          // )}
        ))}
      </Grid>
      {showAddModal && (
        <SettingsAddEditRoutingModal
          open={showAddModal}
          onClose={closeAddModal}
        ></SettingsAddEditRoutingModal>
      )}
      <ConfirmationModal
        open={deleteConfirmOpen}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => deleteRoutingRow()}
        title={'Confirm Delete'}
        message={'Do you really want to delete this event?'}
      />
    </div>
  );
}

export default Settings;
