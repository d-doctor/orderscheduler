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
import { getAuth, onAuthStateChanged } from 'firebase/auth';

function JobsList() {
  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('USER IN JOBS LIST', user);
      console.log('AUTH IN JOBS LIST', auth);
      // ...
    } else {
      console.log('SIGNED OUT USER IN JOBS LIST', user);
      console.log('SIGNED OUT AUTH IN JOBS LIST', auth);
    }
  });
  const ec2token = useRecoilValue(ec2TokenState);
  const credential = useRecoilValue(credentialState);
  const user = useRecoilValue(userState);
  const [reportType, setReportType] = useState('nonADA');
  const [skipRows, setSkiprows] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [scheduledDateList, setScheduledDateList] = useState(
    new Map<string, string>()
  );
  const [googleDateList, setGoogleDateList] = useState(
    new Map<string, string>()
  );
  // const [firebaseStartDateMap, setFirebaseStartDateMap] = useState(
  //   new Map<string, string>()
  // );
  // const [gcalDatesMap, setGcalDatesMap] = useState(
  //   new Map<string, string>()
  // );
  const [orderMap, setOrderMap] = useState(
    new Map<
      string,
      {
        salesId: string;
        customerDescription: string;
        location: string;
        dateEntered: string;
      }
    >()
  );
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

  const urlADA =
    'https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/order-line-items?status=Open&productCode=ADA&sort=dueDate,jobNumber&take=200';
  const urlNonADA =
    'https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/order-line-items?status=Open&productCode[ne]=ADA&sort=dueDate,jobNumber&take=200';
  const getOrderURLpt1 =
    'https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/orders/';
  const getOrderURLpt2 =
    '?fields=orderNumber%2CsalesID%2CcustomerDescription%2CdateEntered%2Clocation';
  //'?fields=orderNumber%2CcustomerCode%2Clocation%2CcustomerDescription%2CsalesID%2CdateEntered';

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const getScheduledDate = async (jobNumber: string) => {
    console.log('getting scheduled date for ', jobNumber);
    let updatedDueDate = '';
    try {
      const eventSnapshot = await getDocsFromServer(
        query(
          collection(db, 'jobs', jobNumber, 'events'),
          orderBy('addedDate'),
          limit(1)
        )
      );
      if (!eventSnapshot.empty) {
        eventSnapshot.forEach((doc) => {
          updatedDueDate = doc.exists()
            ? new Date(doc.data().updatedDueDate).toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
              })
            : '';
          setScheduledDateList((old) => {
            var newmap = new Map(old);
            newmap.set(jobNumber, updatedDueDate);
            return newmap;
          });
          console.log('set scheduled date list ', scheduledDateList);
          if (doc.exists() && doc.data().calendar && doc.data().eventId) {
            getGoogleDate(doc.data().calendar, doc.data().eventId, jobNumber);
          }
        });
      }
    } catch {
      console.log('error looking up due date');
    }
  };

  const getSalesId = async (orderNumber: string) => {
    if (orderMap && orderMap.has(orderNumber)) {
      console.log('already have this sales id do nothing');
    } else {
      const getSalesIdURL = getOrderURLpt1 + orderNumber + getOrderURLpt2;
      await fetch(getSalesIdURL, {
        headers: {
          accept: 'application/json',
          Authorization: 'Bearer ' + ec2token,
        },
      })
        .then((response) => {
          return response.json();
        })
        .then((json) => {
          setOrderMap((old) => {
            let newOrderMap = new Map(old);
            newOrderMap.set(orderNumber, {
              salesId: json.Data.salesID,
              customerDescription: json.Data.customerDescription,
              location: json.Data.location,
              dateEntered: json.Data.dateEntered
                ? new Date(json.Data.dateEntered).toLocaleString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                  })
                : '',
            });
            return newOrderMap;
          });
        })
        .catch((error) => console.error(error));
    }
  };

  const getGoogleDate = async (
    calendar: string,
    eventId: string,
    jobNumber: string
  ) => {
    let accessToken;
    await firebaseAuth.currentUser?.getIdTokenResult().then((result) => {
      accessToken = result.token;
      console.log('what is this other at ', accessToken);
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
    await fetch(getCalendarEventURL, fetchOpts).then(async (response) => {
      try {
        const json = await response.json();
        if (!json.error && json.state !== 'cancelled') {
          setGoogleDateList((old) => {
            let newMap = new Map(old);
            let gDate = new Date(json.start.dateTime).toLocaleDateString(
              'en-US',
              { month: '2-digit', day: '2-digit', year: 'numeric' }
            );
            newMap.set(jobNumber, gDate);
            return newMap;
          });
        }
      } catch (e) {
        console.log('error getting a calendar ', e);
      }
    });
  };

  const handleGetJobs = async () => {
    setLoading(true);
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
        // eslint-disable-next-line no-loop-func
        .then((response) => {
          if (response.status === 200) {
            return response.json();
          } else {
            fetchError = true;
            // setOrderFetchMore(false);
            // setOrderFetcherror(true);
          }
        })
        // eslint-disable-next-line no-loop-func
        .then((json) => {
          if (json) {
            setSkiprows(skipRows + json.Data.length);
            json.Data.forEach(async (data: Data) => {
              getScheduledDate(data.jobNumber);
              getSalesId(data.orderNumber);
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
          console.log('error fetching', error);
          fetchError = true;
        });
    }
    setJobslist(datalist);
    setFilteredJobslist(datalist);
  };

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
      | 'dueDateString'
      | 'partDescriptionTruncated'
      | 'updatedDueDate'
      | 'googleStartDate'
      | 'salesID'
      | 'customerDescription'
      | 'location'
      | 'dateEntered'
      | 'note';
    label: string;
    width: number;
    align?: 'right';
    format?: (value: number) => string;
  }

  // interface JobsList {
  //   Data: Data[];
  // }

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
    updatedDueDate: string;
    googleStartDate: string;
    salesID: string;
    customerDescription: string;
    location: string;
    dateEntered: string;
    note: string;
  }

  const retrieveStateDate = useCallback(
    (jobNumber: string) => {
      return scheduledDateList.has(jobNumber)
        ? scheduledDateList.get(jobNumber)
        : '';
    },
    [scheduledDateList]
  );

  const retrieveStateGoogleDate = useCallback(
    (jobNumber: string) => {
      return googleDateList.has(jobNumber) ? googleDateList.get(jobNumber) : '';
    },
    [googleDateList]
  );

  const retrieveStateSalesID = useCallback(
    (orderNumber: string) => {
      return orderMap.has(orderNumber)
        ? orderMap.get(orderNumber)
        : {
            salesId: '',
            customerDescription: '',
            location: '',
            dateEntered: '',
          };
    },
    [orderMap]
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
        updatedDueDate: retrieveStateDate(data.jobNumber) || '',
        googleStartDate: retrieveStateGoogleDate(data.jobNumber) || '',
        salesID: retrieveStateSalesID(data.orderNumber)?.salesId || '',
        customerDescription:
          retrieveStateSalesID(data.orderNumber)?.customerDescription || '',
        location: retrieveStateSalesID(data.orderNumber)?.location || '',
        dateEntered: retrieveStateSalesID(data.orderNumber)?.dateEntered || '',
        note: '',
      };
    }
    if (filteredJobsList) {
      let newData = new Array<Data>();
      filteredJobsList.forEach((job) => {
        newData.push(createData(job));
      });
      setData(newData);
    }
    setLoading(false);
  }, [
    filteredJobsList,
    retrieveStateDate,
    retrieveStateGoogleDate,
    retrieveStateSalesID,
  ]);

  const columns: readonly Column[] = [
    { id: 'rowNum', label: 'Row', width: 5 },
    { id: 'salesID', label: 'SalesID', width: 5 },
    { id: 'dateEntered', label: 'Entered', width: 7 },
    { id: 'dueDateString', label: 'ECI Due', width: 10 },
    { id: 'updatedDueDate', label: 'Updated Due', width: 10 },
    { id: 'googleStartDate', label: 'Calendar Start Date', width: 20 },
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
  ];

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
  // const toggleNotes =
  //   (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
  //     if (
  //       event.type === 'keydown' &&
  //       ((event as React.KeyboardEvent).key === 'Tab' ||
  //         (event as React.KeyboardEvent).key === 'Shift')
  //     ) {
  //       return;
  //     }
  //     setNotesOpen(open);
  //   };

  const searchJobs = useCallback(
    (value: string) => {
      if (value && value.length > 0) {
        setFilteredJobslist(
          jobsList?.filter((job) => {
            return (
              scheduledDateList.get(job.jobNumber)?.includes(value) ||
              googleDateList.get(job.jobNumber)?.includes(value) ||
              orderMap
                .get(job.orderNumber)
                ?.salesId.includes(value.toUpperCase()) ||
              orderMap
                .get(job.orderNumber)
                ?.customerDescription.toLowerCase()
                .includes(value.toLocaleLowerCase()) ||
              orderMap
                .get(job.orderNumber)
                ?.location.toLowerCase()
                .includes(value.toLowerCase()) ||
              // job.dueDateString?.toLowerCase().includes(value.toLowerCase()) || //can't actually search this string need to format it //OR DO WE NEED TO SEARCH THE data instead of the jobslist?
              //TODO: recheck the useeffect chain to see if it's doing what it should or can it be more efficient
              job.jobNumber.toLowerCase().includes(value.toLowerCase()) ||
              job.orderNumber.toLowerCase().includes(value.toLowerCase()) ||
              job.partDescription.toLowerCase().includes(value.toLowerCase()) ||
              job.partNumber.toLowerCase().includes(value.toLowerCase())
            );
          })
        );
      } else {
        setFilteredJobslist(jobsList);
      }
      setPage(0);
    },
    [googleDateList, jobsList, orderMap, scheduledDateList]
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
      saveAs(blob);
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
              disabled={ec2token.length === 0}
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
                onChange={(event) => {
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
        {selectedorder && <Calendar orderItem={selectedorder} />}
      </Drawer>
    </div>
  );
}

export default JobsList;
