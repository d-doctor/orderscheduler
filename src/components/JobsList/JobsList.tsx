import React, { useEffect } from "react";
import {
  Box,
  Button,
  Divider,
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
} from "@mui/material";
import "./JobsList.css";
import Calendar from "../Calendar/Calendar";
import { useRecoilValue } from "recoil";
import { ec2TokenState } from "../../atoms/auth";

function JobsList() {
  const ec2token = useRecoilValue(ec2TokenState);
  const [reportType, setReportType] = React.useState("nonADA");
  const [skipRows, setSkiprows] = React.useState(0);
  // const [orderFetchError, setOrderFetcherror ] = React.useState<boolean>(false);
  // const [orderFetchMore, setOrderFetchMore ] = React.useState<boolean>(true);
  const [jobsList, setJobslist] = React.useState<Data[]>();
  const [data, setData] = React.useState<Data[]>();

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(200);
  const [selectedorder, setSelectedOrder] = React.useState<Data>();
  // const useFetchOrders = require("../../hooks/useFetchOrders")

  const handleChange = (event: SelectChangeEvent) => {
    setReportType(event.target.value);
  };

  const urlADA =
    "https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/order-line-items?status=Open&productCode=ADA&sort=dueDate,jobNumber&take=200";
  const urlNonADA =
    "https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/order-line-items?status=Open&productCode[ne]=ADA&sort=dueDate,jobNumber&take=200";

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleGetJobs = async () => {
    let datalist: Data[] = [];
    let fetchMore = true;
    let fetchError = false;
    let skipRows = 0;
    while (!fetchError && fetchMore) {
      let url = reportType === "nonADA" ? urlNonADA : urlADA;
      if (skipRows > 0) {
        url += "&skip=" + skipRows.toString();
      }
      await fetch(url, {
        headers: {
          accept: "application/json",
          Authorization: "Bearer " + ec2token,
        },
      })
        // eslint-disable-next-line no-loop-func
        .then((response) => {
          console.log("reponse", response);
          if (response.status === 200) {
            return response.json();
          } else {
            console.log("not good status");
            fetchError = true;
            // setOrderFetchMore(false);
            // setOrderFetcherror(true);
          }
        })
        // eslint-disable-next-line no-loop-func
        .then((json) => {
          if (json) {
            setSkiprows(skipRows + json.Data.length);
            json.Data.forEach((data: Data) => {
              datalist.push(data);
            });
            // datalist.push(json.Data);
            if (json.Data.length === 200) {
              skipRows += 200;
              console.log("skipRows", skipRows);
            } else {
              fetchMore = false;
            }
          }
        })
        // eslint-disable-next-line no-loop-func
        .catch((error) => {
          console.log("error fetching", error);
          fetchError = true;
        });
    }
    setJobslist(datalist);
    console.log("datalist", datalist);
    // .then(response => response.json())
    // .then(json => setJobslist(json))
    // .catch(error => console.error(error));
  };

  interface Column {
    id:
      | "orderNumber"
      | "jobNumber"
      | "partNumber"
      | "partDescription"
      | "orderTotal"
      | "unitPrice"
      | "quantityOrdered"
      | "uniqueID"
      | "dueDateString"
      | "jobNotes";
    label: string;
    minWidth?: number;
    align?: "right";
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
    function createData(data: Data): Data {
      const orderTotal = data.unitPrice * data.quantityOrdered;
      const dueDateString = data.dueDate
        .toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })
        .substring(0, 10);
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
      };
    }
    if (jobsList) {
      let newData = new Array<Data>();
      jobsList.forEach((job) => {
        newData.push(createData(job));
      });
      setData(newData);
    }
  }, [jobsList]);

  const columns: readonly Column[] = [
    { id: "orderNumber", label: "Order", minWidth: 75 },
    { id: "jobNumber", label: "Job", minWidth: 75 },
    { id: "partNumber", label: "Part Number", minWidth: 75 },
    { id: "partDescription", label: "Part Description", minWidth: 40 },
    { id: "dueDateString", label: "Due", minWidth: 35 },
    {
      id: "orderTotal",
      label: "Total",
      minWidth: 30,
      format: (value) => `$${value}`,
    },
    { id: "jobNotes", label: "Job Notes", minWidth: 40 },
  ];

  const handleRowClick = (event: React.MouseEvent<unknown>, data: Data) => {
    setSelectedOrder(data);
  };

  const isSelected = (uniqueID: number) => selectedorder?.uniqueID === uniqueID;

  // const {data, loading, error} = useFetchOrders(token);
  return (
    <div className="jobslist">
      <Box alignItems="center" sx={{ display: "flex", flexWrap: "wrap" }}>
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
            <MenuItem value={"nonADA"}>Non-ADA</MenuItem>
            <MenuItem value={"ADA"}>ADA</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          size="medium"
          disabled={ec2token.length === 0}
          onClick={handleGetJobs}
        >
          Get Orders
        </Button>
        {!ec2token && (
          <Alert severity="warning">
            Must log in and get token in settings tab to continue
          </Alert>
        )}
      </Box>
      <TableContainer component={Paper} sx={{ maxHeight: 460 }}>
        {data && (
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
                          <TableCell key={col.id} align={col.align}>
                            {col.format && typeof value === "number"
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
        rowsPerPageOptions={[100]}
        component="div"
        count={jobsList?.length || 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      {/* <div>
        {jobsList ? <pre>{JSON.stringify(jobsList, null, 2)}</pre> : 'Loading...'}
      </div>         */}
      <div>
        <Divider textAlign="left">Selected Job</Divider>
        {selectedorder && (
          <Calendar orderItem={selectedorder} token={"getTokenfromatom"} />
        )}
      </div>
    </div>
  );
}

export default JobsList;
