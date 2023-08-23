import React, {useEffect} from 'react';
import {Box, Button, Divider, FormControl, InputLabel, SelectChangeEvent, Select, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, MenuItem, Paper} from '@mui/material';
import './JobsList.css';
import Calendar from '../Calendar/Calendar'

function JobsList() {  
  console.log('jobslist')
  const [reportType, setReportType] = React.useState("nonADA");
  const [jobsList, setJobslist] = React.useState<JobsList>();
  const [data, setData] = React.useState<Data[]>();
  const [token, setToken] = React.useState<string>('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(200);
  const [selectedorder, setSelectedOrder] = React.useState<Data>();
  // const useFetchOrders = require("../../hooks/useFetchOrders")

  const handleChange = (event: SelectChangeEvent) => {
    setReportType(event.target.value);
  } 

  const urlADA = 'https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/order-line-items?status=Open&productCode=ADA&sort=dueDate,jobNumber';
  const urlNonADA = 'https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/order-line-items?status=Open&productCode[ne]=ADA&sort=dueDate,jobNumber';

  const handleGetJobs = () => {
    let url = reportType === "nonADA" ? urlNonADA : urlADA;
      fetch(url, {headers: {'accept': 'application/json', 'Authorization': 'Bearer ' + token}})
        .then(response => response.json())
        .then(json => setJobslist(json))
        .catch(error => console.error(error));
  }

  interface Column {
    id: 'orderNumber' | 'jobNumber' | 'partNumber' | 'partDescription' | 'orderTotal' | 'unitPrice' | 'quantityOrdered' | 'uniqueID' | 'dueDateString' | 'jobNotes';
    label: string;
    minWidth?: number;
    align?: 'right';
    format?: (value: number) => string;
  }

  interface JobsList {
    Data: Data[];
  }

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
  }

  useEffect(() => {
    function createData(
      data: Data
    ): Data {
      const orderTotal = data.unitPrice * data.quantityOrdered;
      const dueDateString = data.dueDate.toLocaleString("en-US", {dateStyle: "short", timeStyle: "short"}).substring(0,10);
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
        jobNotes: data.jobNotes };
    }
    if (jobsList) {
      let newData = new Array<Data>();
      jobsList.Data.forEach((job)=> {
        newData.push(createData(job));
      })
      setData(newData);
    }
  }, [jobsList]);


  const columns: readonly Column[] = [
    { id: 'orderNumber', label: 'Order', minWidth: 75 },
    { id: 'jobNumber', label: 'Job', minWidth: 75},
    { id: 'partNumber', label: 'Part Number', minWidth: 75 },
    { id: 'partDescription', label: 'Part Description', minWidth: 40 },
    { id: 'dueDateString', label: 'Due', minWidth: 35 },
    { id: 'orderTotal', label: 'Total', minWidth: 30, format: (value) => `$${value}`},
    { id: 'jobNotes', label: 'Job Notes', minWidth: 40 }
  ]

  const handleRowClick = (event: React.MouseEvent<unknown>, data: Data) => {
    setSelectedOrder(data);
  };

  const isSelected = (uniqueID: number) => selectedorder?.uniqueID === uniqueID;

  // const {data, loading, error} = useFetchOrders(token);
  return (
    <div className="jobslist">
      <Box alignItems="center" sx={{ display: 'flex', flexWrap: 'wrap' }}>
        <TextField
          required
          size="medium"  
          id="outlined-required"
          label="Token"
          value={token}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setToken(event.target.value)
          }}
        />
        <FormControl  style={{minWidth: 120}}>
          <InputLabel id="report-type-input-label">Job Type</InputLabel>
            <Select value={reportType} size="medium" labelId="report-type-input-label" id="report-type-select"  onChange={handleChange} label="Job Type">
          <MenuItem value={"nonADA"}>Non-ADA</MenuItem>
          <MenuItem value={"ADA"}>ADA</MenuItem>
        </Select>
        </FormControl>
        <Button variant="contained" size="medium" disabled={token.length === 0} onClick={handleGetJobs}>Get Orders</Button>
      </Box>  
      <TableContainer component={Paper} sx={{ maxHeight: 460 }}>
      {data &&
        <Table size="small" stickyHeader aria-label="sticky table">
          <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                  key={col.id}
                  align={col.align}
                  style={{ minWidth: col.minWidth }}
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
                  <TableRow hover role="checkbox" tabIndex={-1} key={data.jobNumber} onClick={(event) => handleRowClick(event, data)} selected={isItemSelected}>
                  {columns.map((col) => {
                    const value = data[col.id]
                    return (
                      <TableCell key={col.id}  align={col.align}>
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
      }       
      </TableContainer>  
      {/* <TablePagination
        rowsPerPageOptions={[20, 50, 100]}
        component="div"
        count={jobsList.Data.length || 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      /> */}
      {/* <div>
        {jobsList ? <pre>{JSON.stringify(jobsList, null, 2)}</pre> : 'Loading...'}
      </div>         */}
      <div>
        <Divider textAlign="left">Selected Job</Divider>
        {selectedorder && (
          <Calendar orderItem={selectedorder} token={token}/>
        )}        
      </div>
    </div>
  );
}
  
export default JobsList;
  