import { useState, useEffect, useCallback } from "react";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Avatar from "@material-ui/core/Avatar";
import Container from "@material-ui/core/Container";
import React from "react";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import {
  Paper,
  CardActionArea,
  CardMedia,
  Grid,
  TableContainer,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Button,
  CircularProgress,
} from "@material-ui/core";
import cblogo from "./cblogo.jpg";
import image from "./bg.jpg";
import { DropzoneArea } from "material-ui-dropzone";
import { common } from "@material-ui/core/colors";
import Clear from "@material-ui/icons/Clear";
const axios = require("axios").default;

// Styled button
const ColorButton = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(common.white),
    backgroundColor: common.white,
    "&:hover": {
      backgroundColor: "#ffffff7a",
    },
  },
}))(Button);

const useStyles = makeStyles((theme) => ({
  grow: { flexGrow: 1 },
  clearButton: {
    width: "100%",
    borderRadius: "15px",
    padding: "15px 22px",
    color: "#000000a6",
    fontSize: "20px",
    fontWeight: 900,
  },
  appbar: {
    background: "#678372",
    boxShadow: "none",
    color: "white",
  },
  mainContainer: {
    backgroundImage: `url(${image})`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundSize: "cover",
    height: "93vh",
    marginTop: "8px",
  },
  gridContainer: {
    justifyContent: "center",
    padding: "4em 1em 0 1em",
  },
  imageCard: {
    margin: "auto",
    maxWidth: 400,
    height: 500,
    backgroundColor: "transparent",
    boxShadow: "0px 9px 70px 0px rgb(0 0 0 / 30%)",
    borderRadius: "15px",
  },
  loader: { color: "#678372 !important" },
}));

export const ImageUpload = () => {
  const classes = useStyles();
  const [selectedFile, setSelectedFile] = useState();
  const [preview, setPreview] = useState();
  const [data, setData] = useState();
  const [image, setImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // API endpoint
  const API_URL = "http://localhost:8000/predict";

  // Function to send file to backend
  const sendFile = useCallback(async () => {
    if (image) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      try {
        const response = await axios.post(API_URL, formData);
        if (response.status === 200) setData(response.data);
      } catch (error) {
        console.error("Error uploading file:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [image, selectedFile]);

  // Clear data
  const clearData = () => {
    setData(null);
    setImage(false);
    setSelectedFile(null);
    setPreview(null);
  };

  // Set preview when a file is selected
  useEffect(() => {
    if (!selectedFile) {
      setPreview(undefined);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl); // Cleanup
  }, [selectedFile]);

  // Send file when preview is ready
  useEffect(() => {
    let isMounted = true;
    if (!preview) return;

    setIsLoading(true);
    sendFile().finally(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [preview, sendFile]);

  // Handle file selection
  const onSelectFile = (files) => {
    if (!files || files.length === 0) {
      setSelectedFile(undefined);
      setImage(false);
      setData(undefined);
      return;
    }
    setSelectedFile(files[0]);
    setImage(true);
  };

  // Calculate confidence
  const confidence = data ? (parseFloat(data.confidence) * 100).toFixed(2) : 0;

  return (
    <React.Fragment>
      <AppBar position="static" className={classes.appbar}>
        <Toolbar>
          <Typography variant="h6" noWrap>
            PlantShield: Plant Leaf Disease Classification
          </Typography>
          <div className={classes.grow} />
          <Avatar src={cblogo} style={{ width: 60, height: 60 }} />
        </Toolbar>
      </AppBar>
      <Container
        maxWidth={false}
        className={classes.mainContainer}
        disableGutters={true}
      >
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={2}
          className={classes.gridContainer}
        >
          <Grid item xs={12}>
            <Card className={classes.imageCard}>
              {image ? (
                <CardActionArea>
                  <CardMedia
                    component="img"
                    className={classes.media}
                    image={preview}
                    title="Uploaded Image"
                  />
                </CardActionArea>
              ) : (
                <CardContent>
                  <DropzoneArea
                    acceptedFiles={["image/*"]}
                    dropzoneText={
                      "Drag and drop an image of a potato plant leaf to process"
                    }
                    onChange={onSelectFile}
                  />
                </CardContent>
              )}
              {data && (
                <CardContent>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Label</TableCell>
                          <TableCell align="right">Confidence</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>{data.class}</TableCell>
                          <TableCell align="right">{confidence}%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              )}
              {isLoading && (
                <CardContent>
                  <CircularProgress className={classes.loader} />
                  <Typography variant="h6">Processing</Typography>
                </CardContent>
              )}
            </Card>
          </Grid>
          {data && (
            <Grid item>
              <ColorButton
                onClick={clearData}
                variant="contained"
                size="large"
                className={classes.clearButton}
                startIcon={<Clear />}
              >
                Clear
              </ColorButton>
            </Grid>
          )}
        </Grid>
      </Container>
    </React.Fragment>
  );
};
