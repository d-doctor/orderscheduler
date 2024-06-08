import {
  Box,
  Paper,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  collection,
  getDocsFromServer,
  limit,
  orderBy,
  query,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { db } from '../../service/firebase';
import { FirebaseActivity } from '../../interfaces/FirebaseModels';

function ActivityList() {
  const [activities, setActivities] = useState<FirebaseActivity[]>();
  useEffect(() => {
    async function fetchActivities() {
      const activitySnapshot = await getDocsFromServer(
        query(
          collection(db, 'activities'),
          orderBy('addedDate', 'desc'),
          limit(500)
        )
      );

      if (!activitySnapshot.empty) {
        let docs: FirebaseActivity[] = [];
        activitySnapshot.forEach((d) => {
          docs.push({
            action: d.data().action,
            addedDate: d.data().addedDate,
            jobNumber: d.data().jobNumber,
            text: d.data().text,
            user: d.data().user,
          });
        });
        setActivities(docs);
      }
    }
    fetchActivities();
  }, []);

  return (
    <Box alignItems="center" sx={{ display: 'flex', flexWrap: 'wrap' }}>
      {activities && (
        <TableContainer component={Paper}>
          <TableHead>
            <TableRow>
              <TableCell>Job</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activities.map((activity) => (
              <TableRow>
                <TableCell>{activity.jobNumber}</TableCell>
                <TableCell>{activity.action}</TableCell>
                <TableCell>{activity.text}</TableCell>
                <TableCell>{activity.user}</TableCell>
                <TableCell>
                  {new Date(activity.addedDate).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableContainer>
      )}
    </Box>
  );
}

export default ActivityList;
