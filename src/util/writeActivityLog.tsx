import { addDoc, collection } from 'firebase/firestore';
import { db, firebaseAuth } from '../service/firebase';
import dayjs from 'dayjs';

export function writeActivityLog(
  action: string,
  text: string,
  jobNumber: string
) {
  try {
    console.log('set activity');
    addDoc(collection(db, 'activities'), {
      user: firebaseAuth.currentUser?.displayName,
      action: action,
      text: text,
      jobNumber: jobNumber,
      addedDate: dayjs().toISOString(),
    }).then((a) => {
      console.log('activity logged, ', a);
    });
  } catch (e) {
    console.log('failed to send activity', e);
  }
}

/**
 *  const job = doc(db, 'jobs', orderItem.jobNumber);
        const eventsCollection = collection(job, 'events');
        await addDoc(eventsCollection, {
          event: event?.calendar || '',
          eventId: '',
          htmlLink: '',
          calendar: event?.calendar || '',
          routing: event?.routing || '',
          updatedDueDate:
            event?.updatedDueDate ||
            dayjs(orderItem.dueDate).hour(7).toISOString(),
          description: event?.description || '',
          duration: event?.duration || '',
          title: event?.title || '',
          addedDate: dayjs().toISOString(),
        }).then((a) => {
          setAlertText(
            firstEvent
              ? 'No existing calendar items found - ready to schedule'
              : 'Added Event, Ready to Schedule'
          );
          setAlertOpen(true);
          lookupFirebaseJob();
        });
 */
