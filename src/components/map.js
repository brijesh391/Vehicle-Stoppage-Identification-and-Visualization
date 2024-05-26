import React, { useEffect, useRef, useState } from "react";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import data from "../assets/output.json";

import { Button, Dialog, DialogContent, TextField } from "@mui/material";

const MapViewer = () => {
  const [open, setOpen] = useState(false);
  const [threshold, setThreshold] = useState();
  const [thresholdTime, setThresholdTime] = useState(1000 * 60 * 1);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const mapRef = useRef(null);
  const getIcon = () => {
    return L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
  };
  const handleSubmit = () => {
    setThresholdTime(threshold);
    setOpen(false);
  };
  const stoppageLocation = data.filter((item, index) => {
    if (index === data.length - 1) {
      return false; // Skip last position, as there is no next position
    }
    const nextItem = data[index + 1];
    const timeDiff = nextItem.eventGeneratedTime - item.eventGeneratedTime;
    return timeDiff >= thresholdTime;
  });
  
  console.log(stoppageLocation.length);
  useEffect(() => {
    const mapnode = document.getElementById("mapId");
    if (!mapnode) {
      return;
    }

    // Check if map is already initialized
    if (!mapRef.current) {
      mapRef.current = L.map(mapnode)
        .setZoom(13)
        .setView(L.latLng(12.9294916, 74.9173533));
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 25,
      }).addTo(mapRef.current);
    }

    // Cleanup function to remove map instance on component unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    stoppageLocation.forEach((item, index) => {
      const reachTime = new Date(item.eventGeneratedTime).toLocaleString();
      let endTime = "";
      let stoppageDuration = "";
      if (index < stoppageLocation.length - 1) {
        const nextMovementIndex =
          data.findIndex(
            (elem) =>
              elem.latitude === stoppageLocation[index].latitude &&
              elem.longitude === stoppageLocation[index].longitude
          ) + 1;
        if (nextMovementIndex !== -1) {
          endTime = new Date(
            data[nextMovementIndex].eventGeneratedTime
          ).toLocaleString();
          const durationMs =
            data[nextMovementIndex].eventGeneratedTime -
            item.eventGeneratedTime;
          const durationMin = Math.floor(durationMs / (1000 * 60));
          if (durationMin > 60) {
            const durationHr = Math.floor(durationMin / 60);
            stoppageDuration = `${durationHr} hr ${durationMin % 60} min`;
          } else if (durationMin === 0) {
            stoppageDuration = `${Math.floor(durationMs / 1000)} sec`;
          } else stoppageDuration = `${durationMin} min`;
        } else {
          endTime = "N/A";
          stoppageDuration = "N/A";
        }
      } else {
        endTime = "N/A";
        stoppageDuration = "N/A";
      }

      L.marker(L.latLng(item.latitude, item.longitude), { icon: getIcon() })
        .addTo(mapRef.current)
        .bindPopup(
          `<b>Reach Time:</b> ${reachTime}<br><b>End Time:</b> ${endTime}<br><b>Stoppage Duration:</b> ${stoppageDuration}<br> <b>locatiion</b>: ${item.latitude}, ${item.longitude}`
        );
    });

    const paths = data.reduce((acc, item) => {
      if (!acc[item.EquipmentId]) {
        acc[item.EquipmentId] = [];
      }
      acc[item.EquipmentId].push([item.latitude, item.longitude]);
      return acc;
    }, {});

    Object.values(paths).forEach((path) => {
      L.polyline(path, { color: "red", weight: 4 }).addTo(mapRef.current);
    });
  }, [stoppageLocation]);
  return (
    <>
      <div className="" style={{ position: "relative" }}>
        <div style={{ width: "100%", height: "100vh" }} id="mapId"></div>
        <Button
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 1000,
          }}
          variant="contained"
          color="primary"
          onClick={handleClickOpen}
        >
          Set Threshold
        </Button>
      </div>
      <Dialog open={open} onClose={handleClose}>
        <DialogContent style={{ backgroundColor: "white", padding: "20px" }}>
          <TextField
            label="threshold time in minutes"
            variant="standard"
            size="small"
            type="number"
            fullWidth
            style={{ marginBottom: "20px" }}
            onChange={(e) => setThreshold(e.target.value * 1000 * 60)}
          />
          
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Submit
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MapViewer;