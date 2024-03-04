import React, { useCallback, useEffect, useState } from 'react';
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
import { userState, ec2TokenState } from '../../atoms/auth';
import CancelIcon from '@mui/icons-material/Cancel';
import { blue } from '@mui/material/colors';
import { db } from '../../service/firebase';
import {
  collection,
  getDocs,
  getDocsFromServer,
  limit,
  orderBy,
  query,
} from 'firebase/firestore';

function JobsList() {
  const ec2token = useRecoilValue(ec2TokenState);
  const user = useRecoilValue(userState);
  const [reportType, setReportType] = useState('nonADA');
  const [skipRows, setSkiprows] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [scheduledDateList, setScheduledDateList] = useState<
    { jobNumber: string; scheduledDate: string }[]
  >([]);
  // const [searchValue, setSearchValue] = useState<string>();
  // const [orderFetchError, setOrderFetcherror ] = React.useState<boolean>(false);
  // const [orderFetchMore, setOrderFetchMore ] = React.useState<boolean>(true);
  const [jobsList, setJobslist] = useState<Data[]>();
  const [filteredJobsList, setFilteredJobslist] = useState<Data[]>();
  const [data, setData] = useState<Data[]>();

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(200);
  const [selectedorder, setSelectedOrder] = React.useState<Data>();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  // const useFetchOrders = require("../../hooks/useFetchOrders")

  const handleChange = (event: SelectChangeEvent) => {
    setReportType(event.target.value);
  };

  const urlADA =
    'https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/order-line-items?status=Open&productCode=ADA&sort=dueDate,jobNumber&take=200';
  const urlNonADA =
    'https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/order-line-items?status=Open&productCode[ne]=ADA&sort=dueDate,jobNumber&take=200';

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
    console.log('lookup date for ', jobNumber);
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
          updatedDueDate = doc.exists() ? doc.data().updatedDueDate : '';
          console.log('got one doc ', doc.data());
          //TODO - also query google if we want to be really insane?
          setScheduledDateList((oldList) => [
            { jobNumber: jobNumber, scheduledDate: updatedDueDate },
            ...oldList,
          ]);
        });
      }
      // }
      // );
    } catch {
      console.log('error looking up due date');
    }
  };

  const handleGetJobs = async () => {
    setLoading(true);
    let datalist: Data[] = [];
    let fetchMore = true;
    let fetchError = false;
    let skipRows = 0;
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
              datalist.push(data);
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
      | 'orderNumber'
      | 'jobNumber'
      | 'partNumber'
      | 'partDescription'
      | 'orderTotal'
      | 'unitPrice'
      | 'quantityOrdered'
      | 'uniqueID'
      | 'dueDateString'
      | 'jobNotes'
      | 'partDescriptionTruncated'
      | 'updatedDueDate';
    label: string;
    width: number;
    align?: 'right';
    format?: (value: number) => string;
  }

  // interface JobsList {
  //   Data: Data[];
  // }

  interface Data {
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
    jobNotes: string;
    partDescriptionTruncated: string;
    updatedDueDate: string;
  }

  const retrieveStateDate = useCallback(
    (jobNumber: string) => {
      let sd = scheduledDateList.find(
        (a) => a.jobNumber === jobNumber
      )?.scheduledDate;
      return sd
        ? new Date(sd).toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
          })
        : '';
    },
    [scheduledDateList]
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
        jobNotes: data.jobNotes,
        partDescriptionTruncated:
          data.partDescription?.length > 100
            ? data.partDescription?.substring(0, 100) + ' ...'
            : data.partDescription,
        updatedDueDate: retrieveStateDate(data.jobNumber) || '',
      };
    }
    console.log('filteredJobsList useEffect');
    if (filteredJobsList) {
      let newData = new Array<Data>();
      filteredJobsList.forEach((job) => {
        newData.push(createData(job));
      });
      setData(newData);
    }
    setLoading(false);
  }, [filteredJobsList, retrieveStateDate]);

  const columns: readonly Column[] = [
    { id: 'dueDateString', label: 'ECI Due', width: 50 },
    { id: 'updatedDueDate', label: 'Updated Due', width: 50 },
    { id: 'orderNumber', label: 'Order', width: 5 },
    { id: 'jobNumber', label: 'Job', width: 15 },
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
    { id: 'jobNotes', label: 'Job Notes', width: 10 },
  ];

  const handleRowClick = (event: React.MouseEvent<unknown>, data: Data) => {
    setSelectedOrder(data);
    setDrawerOpen(true);
  };

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
            return (
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
    [jobsList]
  );

  // const {data, loading, error} = useFetchOrders(token);
  return (
    <div className="jobslist">
      <Box
        alignItems="center"
        sx={{ display: 'flex', flexWrap: 'wrap' }}
        onClick={toggleDrawer(false)}
      >
        <Stack direction={'row'} spacing={'10px'}>
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
            <Alert severity="warning">
              Must click settings and get a valid token to continue
            </Alert>
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
                          onClick={(event) => handleRowClick(event, data)}
                          selected={isItemSelected}
                        >
                          {columns.map((col) => {
                            const value = data[col.id];
                            return (
                              <TableCell
                                key={col.id}
                                align={col.align}
                                width={col.width}
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
      {/* <div>
        {jobsList ? <pre>{JSON.stringify(jobsList, null, 2)}</pre> : 'Loading...'}
      </div>         */}
      <div>
        {/* <Divider textAlign="left">Selected Job</Divider> */}
        {/* {selectedorder && <Calendar orderItem={selectedorder} />} */}
      </div>
      <Drawer
        open={drawerOpen}
        anchor={'right'}
        PaperProps={{ sx: { width: '80%' } }}
        onClose={toggleDrawer}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', margin: 1 }}>
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
