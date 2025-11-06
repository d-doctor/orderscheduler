import React, { useCallback, useEffect, useState } from 'react';
import { firebaseAuth } from '../../service/firebase';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  MenuItem,
  Paper,
  Alert,
  Drawer,
  DialogTitle,
  IconButton,
  TextField,
  Stack,
} from '@mui/material';
import './JobsList.css';
import Calendar from '../Calendar/Calendar';
import { useRecoilValue } from 'recoil';
import { userState, ec2TokenState, credentialState } from '../../atoms/auth';
import CancelIcon from '@mui/icons-material/Cancel';
import { blue } from '@mui/material/colors';
import { db } from '../../service/firebase';
import {
  collection,
  getDocsFromServer,
  limit,
  orderBy,
  query,
} from 'firebase/firestore';
import { Order } from '../../interfaces/VendorModels';
// import { getAuth, onAuthStateChanged } from 'firebase/auth';

interface Column {
  id:
    | 'rowNum'
    | 'orderNumber'
    | 'jobNumber'
    | 'partNumber'
    | 'partDescription'
    | 'orderTotal'
    | 'unitPrice'
    | 'quantityOrdered'
    | 'uniqueID'
    // | 'dueDateString'
    | 'partDescriptionTruncated'
    // | 'updatedDueDate'
    // | 'googleStartDate'
    | 'salesID'
    | 'customerDescription'
    | 'location'
    | 'dateEntered'
    | 'note'
    | 'startDate'
    | 'endDate'
    | 'user_Text1'
    | 'user_Text2';
  label: string;
  width: number;
  align?: 'right';
  format?: (value: number) => string;
}

const columns: readonly Column[] = [
  // { id: 'rowNum', label: 'Row', width: 5 },
  { id: 'salesID', label: 'SalesID', width: 5 },
  { id: 'dateEntered', label: 'Entered', width: 7 },
  // { id: 'dueDateString', label: 'ECI Due', width: 10 },
  // { id: 'updatedDueDate', label: 'Updated Due', width: 10 },
  // { id: 'googleStartDate', label: 'Calendar Start Date', width: 20 },
  { id: 'startDate', label: 'Start Date', width: 20 },
  { id: 'endDate', label: 'Due Date', width: 20 },
  { id: 'user_Text2', label: 'Project ID', width: 15 },
  { id: 'orderNumber', label: 'Order', width: 5 },
  { id: 'jobNumber', label: 'Job', width: 15 },
  { id: 'customerDescription', label: 'Customer', width: 40 },
  { id: 'location', label: 'Location', width: 40 },
  { id: 'partNumber', label: 'Part Number', width: 5 },
  {
    id: 'partDescriptionTruncated',
    label: 'Part Description',
    width: 200,
  },
  {
    id: 'quantityOrdered',
    label: 'Quantity',
    width: 5,
  },
  {
    id: 'orderTotal',
    label: 'Total',
    width: 5,
    format: (value) => `$${value}`,
  },
  {
    id: 'note',
    label: 'Latest Note',
    width: 200,
  },
  {
    id: 'user_Text1',
    label: 'Project Manager',
    width: 40,
  },
];

interface Data {
  rowNum: number;
  jobNumber: string;
  orderNumber: string;
  partNumber: string;
  partDescription: string;
  dueDate: Date;
  uniqueID: number;
  unitPrice: number;
  quantityOrdered: number;
  orderTotal: number;
  dueDateString: string;
  partDescriptionTruncated: string;
  startDate: string;
  endDate: string;
  // updatedDueDate: string;
  // googleStartDate: string;
  salesID: string;
  customerDescription: string;
  location: string;
  dateEntered: string;
  note: string;
  user_Text1: string;
  user_Text2: string;
}

const orderURL =
  'https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/orders?fields=orderNumber%2CsalesID%2CcustomerDescription%2CdateEntered%2Clocation%2CcustomerCode%2Cuser_Text1%2Cuser_Text2&status=Open';
const urlADA =
  'https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/order-line-items?status=Open&productCode=ADA&sort=dueDate,jobNumber&take=200';
const urlNonADA =
  'https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/order-line-items?status=Open&productCode[ne]=ADA&sort=dueDate,jobNumber&take=200';
// const getOrderURLpt1 =
//   'https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/orders/';
// const getOrderURLpt2 =
//   '?fields=orderNumber%2CsalesID%2CcustomerDescription%2CdateEntered%2Clocation';
//'?fields=orderNumber%2CcustomerCode%2Clocation%2CcustomerDescription%2CsalesID%2CdateEntered';

function JobsList() {
  // const auth = getAuth();
  // onAuthStateChanged(auth, (user) => {
  //   if (user) {
  //     console.log('USER IN JOBS LIST', user);
  //     console.log('AUTH IN JOBS LIST', auth);
  //     // ...
  //   } else {
  //     console.log('SIGNED OUT USER IN JOBS LIST', user);
  //     console.log('SIGNED OUT AUTH IN JOBS LIST', auth);
  //   }
  // });
  const ec2token = useRecoilValue(ec2TokenState);
  const credential = useRecoilValue(credentialState);
  const user = useRecoilValue(userState);
  const [reportType, setReportType] = useState('nonADA');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingECI, setLoadingECI] = useState<boolean>(false);
  const [eciError, setEciError] = useState<string>('');
  const [searchVal, setSearchVal] = useState<string>('');
  const [masterDateList, setMasterDateList] = useState(
    new Map<
      string,
      {
        firstEventStoredDate: string;
        firstEventGoogleDate: string;
        lastEventStoredDate: string;
        lastEventGoogleDate: string;
      }
    >()
  );
  // const [scheduledDateList, setScheduledDateList] = useState(
  //   new Map<string, string>()
  // );
  // const [googleDateList, setGoogleDateList] = useState(
  //   new Map<string, string>()
  // );
  // const [firebaseStartDateMap, setFirebaseStartDateMap] = useState(
  //   new Map<string, string>()
  // );
  // const [gcalDatesMap, setGcalDatesMap] = useState(
  //   new Map<string, string>()
  // );
  // const [orderMap, setOrderMap] = useState(
  //   new Map<
  //     string,
  //     {
  //       salesId: string;
  //       customerDescription: string;
  //       location: string;
  //       dateEntered: string;
  //     }
  //   >()
  // );
  const [orderItems, setOrderItems] = useState<Order[]>();
  const [notesMap, setNotesMap] = useState(new Map<string, string>());
  const [jobsList, setJobslist] = useState<Data[]>();
  const [filteredJobsList, setFilteredJobslist] = useState<Data[]>();
  const [data, setData] = useState<Data[]>();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(200);
  const [selectedorder, setSelectedOrder] = useState<Data>();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleChange = (event: SelectChangeEvent) => {
    setReportType(event.target.value);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const getLatestNote = async (jobNumber: string) => {
    try {
      const noteSnapshot = await getDocsFromServer(
        query(
          collection(db, 'jobs', jobNumber, 'notes'),
          orderBy('addedDate', 'desc'),
          limit(1)
        )
      );
      if (!noteSnapshot.empty) {
        noteSnapshot.forEach((note) => {
          setNotesMap((old) => {
            var newmap = new Map(old);
            newmap.set(jobNumber, note.exists() ? note.data().text : '');
            return newmap;
          });
        });
      }
    } catch {
      console.log('error in getting notes');
    }
  };
  const fetchOrders = useCallback(async () => {
    let orderList: Order[] = [];
    let fetchMore = true;
    let skip = 0;
    setEciError('');
    while (fetchMore) {
      let url = orderURL;
      if (skip > 0) {
        url += '&skip=' + skip.toString();
      }
      url += '&take=100';
      await fetch(url, {
        headers: {
          accept: 'application/json',
          Authorization: 'Bearer ' + ec2token,
        },
      })
        .then((response) => {
          if (response.status === 200) {
            return response.json();
          } else {
            setEciError('Error pre-loading ECI order details, click retry');
            throw new Error('Failed getting orders');
          }
        })
        // eslint-disable-next-line no-loop-func
        .then((json) => {
          if (json) {
            json.Data.forEach((order: Order) => {
              orderList.push(order);
            });
            if (json.Data.length === 100) {
              skip += 100;
            } else {
              fetchMore = false;
            }
          }
        })
        // eslint-disable-next-line no-loop-func
        .catch((err) => {
          console.log('error caught fetching orders' + err);
          fetchMore = false;
        });
    }
    setOrderItems(orderList);
  }, [ec2token]);

  useEffect(() => {
    if (user.accessToken && ec2token) {
      fetchOrders();
    }
  }, [user, ec2token, fetchOrders]);

  const getUpdatedDates = async (jobNumber: string) => {
    let dateObject = {
      firstEventStoredDate: '',
      firstEventGoogleDate: '',
      lastEventStoredDate: '',
      lastEventGoogleDate: '',
    };
    try {
      const eventsSnapshot = await getDocsFromServer(
        query(
          collection(db, 'jobs', jobNumber, 'events'),
          orderBy('updatedDueDate')
        )
      );
      if (!eventsSnapshot.empty) {
        if (eventsSnapshot.docs[0].exists()) {
          // console.log('it exists');
          let startDate = new Date(
            eventsSnapshot.docs[0].data().updatedDueDate
          ).toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
          });
          dateObject.firstEventStoredDate = startDate;
          if (
            eventsSnapshot.docs[0].data().calendar &&
            eventsSnapshot.docs[0].data().eventId
          ) {
            const fegd = await getGoogleDate(
              eventsSnapshot.docs[0].data().calendar,
              eventsSnapshot.docs[0].data().eventId,
              jobNumber
            );
            //if no calendar access from current user default to stored date
            if (fegd && fegd.length > 0) {
              dateObject.firstEventGoogleDate = fegd;
            } else {
              dateObject.firstEventGoogleDate = startDate;
            }
          }
        }
        if (eventsSnapshot.size > 1) {
          const lastIndex = eventsSnapshot.size - 1;
          if (eventsSnapshot.docs[lastIndex].exists()) {
            dateObject.lastEventStoredDate = new Date(
              eventsSnapshot.docs[lastIndex].data().updatedDueDate
            ).toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
            });
          }
          if (
            eventsSnapshot.docs[lastIndex].data().calendar &&
            eventsSnapshot.docs[lastIndex].data().eventId
          ) {
            const legd = await getGoogleDate(
              eventsSnapshot.docs[lastIndex].data().calendar,
              eventsSnapshot.docs[lastIndex].data().eventId,
              jobNumber
            );
            if (legd && legd.length > 0) {
              dateObject.lastEventGoogleDate = legd;
            } else {
              dateObject.lastEventGoogleDate = dateObject.lastEventStoredDate;
            }
          }
        } else {
          dateObject.lastEventGoogleDate = dateObject.firstEventGoogleDate;
        }
      }
      // console.log('date object', dateObject);
      //TODO don't bother setting this if we got no dates
      setMasterDateList((old) => {
        var newmap = new Map(old);
        newmap.set(jobNumber, dateObject);
        return newmap;
      });
    } catch {
      console.log('unable to lookup dates for ', jobNumber);
    }
  };

  const getGoogleDate = async (
    calendar: string,
    eventId: string,
    jobNumber: string
  ): Promise<string> => {
    let accessToken;
    //TODO try usin gthis a few lines below in the auth token to google api
    await firebaseAuth.currentUser?.getIdTokenResult().then((result) => {
      accessToken = result.token;
    });
    const getCalendarEventURL =
      'https://www.googleapis.com/calendar/v3/calendars/' +
      calendar +
      '/events/' +
      eventId;
    const fetchOpts = {
      headers: {
        accept: 'application/json',
        Authorization: 'Bearer ' + credential?.accessToken,
      },
    };
    let date;
    await fetch(getCalendarEventURL, fetchOpts).then(async (response) => {
      try {
        const json = await response.json();
        if (!json.error && json.status !== 'cancelled') {
          date = new Date(json.start.dateTime).toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
          });
          // setGoogleDateList((old) => {
          //   let newMap = new Map(old);
          //   let gDate = new Date(json.start.dateTime).toLocaleDateString(
          //     'en-US',
          //     { month: '2-digit', day: '2-digit', year: 'numeric' }
          //   );
          //   newMap.set(jobNumber, gDate);
          //   return newMap;
          // });
        } else {
          console.log('nothing to return');
          return '';
        }
      } catch (e) {
        console.log('error getting a calendar ', e);
        return '';
      }
    });
    return date || '';
  };

  const handleGetJobs = async () => {
    setLoading(true);
    setLoadingECI(true);
    setSearchVal('');
    setEciError('');
    let datalist: Data[] = [];
    let fetchMore = true;
    let fetchError = false;
    let skipRows = 0;
    let row = 1;
    setPage(0);
    while (!fetchError && fetchMore) {
      let url = reportType === 'nonADA' ? urlNonADA : urlADA;
      if (skipRows > 0) {
        url += '&skip=' + skipRows.toString();
      }
      await fetch(url, {
        headers: {
          accept: 'application/json',
          Authorization: 'Bearer ' + ec2token,
        },
      })
        .then((response) => {
          if (response.status === 200) {
            return response.json();
          } else {
            setEciError(
              'Error fetching data from ECI order items API: ' +
                response.statusText
            );
            throw new Error(
              'Fetch threw invalid response: ' +
                response.status +
                ' ' +
                response.statusText
            );
          }
        })
        // eslint-disable-next-line no-loop-func
        .then((json) => {
          if (json) {
            json.Data.forEach(async (data: Data) => {
              // getScheduledDate(data.jobNumber);
              getUpdatedDates(data.jobNumber);
              // getSalesId(data.orderNumber);
              getLatestNote(data.jobNumber);
              data.rowNum = row;
              datalist.push(data);
              row++;
            });
            // datalist.push(json.Data);
            if (json.Data.length === 200) {
              skipRows += 200;
            } else {
              fetchMore = false;
            }
          }
        })
        // eslint-disable-next-line no-loop-func
        .catch((error) => {
          console.log('Error in fetching Order Items', error);
          fetchError = true;
        });
    }
    setJobslist(datalist);
    setFilteredJobslist(datalist);
  };

  const retrieveStateMasterDate = useCallback(
    (jobNumber: string) => {
      return masterDateList.has(jobNumber)
        ? masterDateList.get(jobNumber)
        : {
            firstEventGoogleDate: '',
            firstEventStoredDate: '',
            lastEventGoogleDate: '',
            lastEventStoredDate: '',
          };
    },
    [masterDateList]
  );

  const retrieveStateNote = useCallback(
    (jobNumber: string) => {
      return notesMap.has(jobNumber) ? notesMap.get(jobNumber) : '';
    },
    [notesMap]
  );

  const retrieveOrderItem = useCallback(
    (orderNumber: string) => {
      if (
        orderNumber &&
        orderNumber.length > 0 &&
        orderItems &&
        orderItems?.length > 0
      ) {
        return orderItems.find((ord) => ord.orderNumber === orderNumber);
      } else
        return {
          salesID: '',
          orderNumber: '',
          customerCode: '',
          customerDescription: '',
          location: '',
          dateEntered: new Date(),
          user_Text1: '',
          user_Text2: '',
        } as Order;
    },
    [orderItems]
  );

  useEffect(() => {
    function createData(data: Data): Data {
      const orderTotal = data.unitPrice * data.quantityOrdered;
      const dueDateString = new Date(data.dueDate).toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
      return {
        rowNum: data.rowNum,
        jobNumber: data.jobNumber,
        orderNumber: data.orderNumber,
        partNumber: data.partNumber,
        partDescription: data.partDescription,
        dueDate: data.dueDate,
        uniqueID: data.uniqueID,
        unitPrice: data.unitPrice,
        quantityOrdered: data.quantityOrdered,
        orderTotal: orderTotal,
        dueDateString: dueDateString,
        partDescriptionTruncated:
          data.partDescription?.length > 100
            ? data.partDescription?.substring(0, 100) + ' ...'
            : data.partDescription,
        // updatedDueDate: retrieveStateDate(data.jobNumber) || '',
        // googleStartDate: retrieveStateGoogleDate(data.jobNumber) || '',
        startDate:
          retrieveStateMasterDate(data.jobNumber)?.firstEventGoogleDate || '',
        endDate:
          retrieveStateMasterDate(data.jobNumber)?.lastEventGoogleDate || '',
        salesID: retrieveOrderItem(data.orderNumber)?.salesID || '',
        customerDescription:
          retrieveOrderItem(data.orderNumber)?.customerDescription || '',
        location: retrieveOrderItem(data.orderNumber)?.location || '',
        dateEntered:
          retrieveOrderItem(data.orderNumber)?.dateEntered.toLocaleString(
            'end-US',
            { month: '2-digit', day: '2-digit', year: 'numeric' }
          ) || '',
        user_Text1: retrieveOrderItem(data.orderNumber)?.user_Text1 || '',
        user_Text2: retrieveOrderItem(data.orderNumber)?.user_Text2 || '',
        note: retrieveStateNote(data.jobNumber) || '',
      };
    }
    if (filteredJobsList) {
      let newData = new Array<Data>();
      filteredJobsList.forEach((job) => {
        newData.push(createData(job));
      });
      newData.sort((a, b) => {
        const aVal =
          a.startDate.length > 0 ? new Date(a.startDate).getTime() : 0;
        const bVal =
          b.startDate.length > 0 ? new Date(b.startDate).getTime() : 0;
        return aVal - bVal;
      });
      setData(newData);
    }
    setLoading(false);
  }, [
    filteredJobsList,
    retrieveOrderItem,
    retrieveStateMasterDate,
    retrieveStateNote,
  ]);

  const handleRowClick = (event: React.MouseEvent<unknown>, data: Data) => {
    setSelectedOrder(data);
    setDrawerOpen(true);
  };

  // const handleNotesClick = (event: React.MouseEvent<unknown>, data: Data) => {
  //   setSelectedOrder(data);
  //   setNotesOpen(true);
  // };

  const isSelected = (uniqueID: number) => selectedorder?.uniqueID === uniqueID;

  const toggleDrawer =
    (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event.type === 'keydown' &&
        ((event as React.KeyboardEvent).key === 'Tab' ||
          (event as React.KeyboardEvent).key === 'Shift')
      ) {
        return;
      }
      setDrawerOpen(open);
    };

  const searchJobs = useCallback(
    (value: string) => {
      if (value && value.length > 0) {
        setFilteredJobslist(
          jobsList?.filter((job) => {
            let orderItem = orderItems?.find(
              (order) => order.orderNumber === job.orderNumber
            );
            console.log('order item to search', orderItem);
            return (
              // scheduledDateList.get(job.jobNumber)?.includes(value) ||
              // googleDateList.get(job.jobNumber)?.includes(value) ||
              orderItem?.salesID.toLowerCase().includes(value.toLowerCase()) ||
              orderItem?.customerDescription
                .toLowerCase()
                .includes(value.toLowerCase()) ||
              orderItem?.location.toLowerCase().includes(value.toLowerCase()) ||
              orderItem?.user_Text1
                ?.toLowerCase()
                .includes(value.toLowerCase()) ||
              orderItem?.user_Text2
                ?.toLowerCase()
                .includes(value.toLowerCase()) ||
              //TODO: recheck the useeffect chain to see if it's doing what it should or can it be more efficient
              job.jobNumber.toLowerCase().includes(value.toLowerCase()) ||
              job.orderNumber.toLowerCase().includes(value.toLowerCase()) ||
              job.partDescription
                ?.toLowerCase()
                .includes(value.toLowerCase()) ||
              job.partNumber.toLowerCase().includes(value.toLowerCase())
            );
          })
        );
      } else {
        setFilteredJobslist(jobsList);
      }
      setPage(0);
    },
    [jobsList, orderItems]
  );

  const exportToExcel = () => {
    if (data) {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

      const excelBuff = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });
      const blob = new Blob([excelBuff], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
      });

      const fileName =
        'JobsList-AsOf-' +
        new Date().toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
        });
      saveAs(blob, fileName);
    }
  };

  // const {data, loading, error} = useFetchOrders(token);
  return (
    <div className="jobslist">
      <Box
        alignItems="center"
        sx={{ display: 'flex', flexWrap: 'wrap' }}
        onClick={toggleDrawer(false)}
      >
        <Stack direction="row" spacing={2} justifyContent="space-between">
          <FormControl style={{ minWidth: 120 }}>
            <InputLabel id="report-type-input-label">Job Type</InputLabel>
            <Select
              value={reportType}
              size="medium"
              labelId="report-type-input-label"
              id="report-type-select"
              onChange={handleChange}
              label="Job Type"
            >
              <MenuItem value={'nonADA'}>Non-ADA</MenuItem>
              <MenuItem value={'ADA'}>ADA</MenuItem>
            </Select>
          </FormControl>
          {user && user.accessToken.length > 0 && (
            <Button
              variant="contained"
              size="medium"
              disabled={ec2token.length === 0 || eciError.length > 0}
              onClick={handleGetJobs}
            >
              Get Orders
            </Button>
          )}
          {jobsList && jobsList.length > 0 && (
            <>
              <TextField
                label="Search"
                size="medium"
                type="search"
                value={searchVal}
                onChange={(event) => {
                  setSearchVal(event.target.value);
                  searchJobs(event.target.value);
                }}
              />
            </>
          )}
          {!user ||
            (user.accessToken.length <= 0 && (
              <Alert severity="warning">Must log in to continue</Alert>
            ))}
          {!ec2token && (
            <Alert severity="warning">Must log in to continue</Alert>
          )}
          <Button
            variant="contained"
            size="medium"
            disabled={!data}
            onClick={exportToExcel}
          >
            Export
          </Button>
          {eciError && eciError.length > 0 && (
            <>
              <Alert severity="error">{eciError}</Alert>
              <Button
                variant="contained"
                size="medium"
                onClick={() => {
                  setEciError('');
                  fetchOrders();
                }}
              >
                Retry Pre-load
              </Button>
            </>
          )}
        </Stack>
      </Box>
      {loading && <DialogTitle>Loading</DialogTitle>}
      {!loading && (
        <>
          <TableContainer component={Paper} sx={{ height: 0.8 }}>
            {data && (
              <Table size="small" stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    {columns.map((col) => (
                      <TableCell
                        key={col.id}
                        align={col.align}
                        width={col.width}
                      >
                        {col.label}
                      </TableCell>
                    ))}
                    {/* <TableCell key="notesLabel" align="center" width="80">
                      Notes
                    </TableCell> */}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((data) => {
                      const isItemSelected = isSelected(data.uniqueID);
                      return (
                        <TableRow
                          hover
                          role="checkbox"
                          tabIndex={-1}
                          key={data.jobNumber}
                          selected={isItemSelected}
                        >
                          {columns.map((col) => {
                            const value = data[col.id];
                            return (
                              <TableCell
                                key={col.id}
                                align={col.align}
                                width={col.width}
                                onClick={(event) => handleRowClick(event, data)}
                              >
                                {col.format && typeof value === 'number'
                                  ? col.format(value)
                                  : value}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[20]}
            component="div"
            count={filteredJobsList?.length || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
      <Drawer
        open={drawerOpen}
        anchor={'right'}
        PaperProps={{ sx: { width: '95%' } }}
        onClose={toggleDrawer}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', margin: 2 }}>
          <IconButton
            onClick={toggleDrawer(false)}
            style={{ position: 'absolute', top: '0', right: '0' }}
          >
            <CancelIcon sx={{ color: blue[500] }} />
          </IconButton>
        </DialogTitle>
        {selectedorder && (
          <Calendar
            orderItem={selectedorder}
            orderDetail={retrieveOrderItem(selectedorder.orderNumber)}
          />
        )}
      </Drawer>
    </div>
  );
}

export default JobsList;
