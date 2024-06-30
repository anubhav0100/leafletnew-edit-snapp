import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-snap';
import 'leaflet-geometryutil';

const initialLayers = {
  polylines: [
    { id: 1, latlngs: [[51.505, -0.09], [51.51, -0.1], [51.52, -0.12]] },
  ],
  polygons: [
    { id: 2, latlngs: [[51.505, -0.09], [51.51, -0.1], [51.52, -0.12], [51.505, -0.09]] },
  ],
  markers: [
    { id: 3, latlng: [51.505, -0.09], popup: 'Marker 1' },
  ],
};

const MapLayers = () => {
  const map = useMap();
  const drawControlRef = useRef(null);
  const snapGuideLayers = useRef(new L.FeatureGroup()).current;
    const [editedexistingLayers, setEditedExistingLayers] = useState(initialLayers);
    const [existingLayers, setExistingLayers] = useState(initialLayers);
  const layersAdded = useRef(false);  // To track if layers have been added
    const [editedLayer, setEditedLayer] = useState(null);
    const drawnItems = new L.FeatureGroup();

  useEffect(() => {
    
    map.addLayer(drawnItems);
    map.addLayer(snapGuideLayers);

    if (!drawControlRef.current) {
      drawControlRef.current = new L.Control.Draw({
        edit: {
              featureGroup: drawnItems,
            edit: true,  // Disable default editing
          },
          
        draw: {
          polygon: true,
          polyline: true,
          rectangle: true,
          circle: false,
          marker: true,
        },
      });
        map.addControl(drawControlRef.current);
    }

    if (!layersAdded.current) {
      // Add existing layers to the map and enable snapping
      existingLayers.polylines.forEach(({ id, latlngs }) => {
        const polyline = L.polyline(latlngs, { draggable: true }).addTo(map);
        polyline.id = id;
        polyline.on('add', function() {
          polyline.dragging.enable();
        });
        enableSnapping(polyline);
        drawnItems.addLayer(polyline);
        snapGuideLayers.addLayer(polyline);
      });

      existingLayers.polygons.forEach(({ id, latlngs }) => {
        const polygon = L.polygon(latlngs, { draggable: true }).addTo(map);
        polygon.id = id;
        polygon.on('add', function() {
          polygon.dragging.enable();
        });
        enableSnapping(polygon);
        drawnItems.addLayer(polygon);
        snapGuideLayers.addLayer(polygon);
      });

      existingLayers.markers.forEach(({ id, latlng, popup }) => {
        const marker = L.marker(latlng, { draggable: true }).addTo(map);
        marker.id = id;
        if (popup) {
          marker.bindPopup(popup);
        }
        enableSnapping(marker);
        drawnItems.addLayer(marker);
        snapGuideLayers.addLayer(marker);
      });

      layersAdded.current = true;
    }

    map.on(L.Draw.Event.CREATED, (event) => {
      const { layerType, layer } = event;
      layer.id = Date.now();  // Assign a unique id to the new layer
      if (layerType === 'marker') {
        layer.bindPopup('A popup!');
      }
      drawnItems.addLayer(layer);
      snapGuideLayers.addLayer(layer);

      enableSnapping(layer);

      if (layer.dragging) {
        layer.dragging.enable();
      }

      // Update existing layers with the newly created layer
      updateExistingLayers(drawnItems);
    });

    // map.on(L.Draw.Event.EDITSTART, (event) => {
    //     //const { layer } = event;
    //     console.log('Edit started:', event);
    //     console.log('Edit started:', layer);
    //     const { handler } = event; // Get the edit handler
    //   const { layer } = handler;
    //   setEditedLayer(layer); // Update state with the edited layer
    //   enableSnapping(layer); // Enable snapping for the edited layer
    // });

    //   map.on(L.Draw.Event.EDITSTOP, (event) => {
    //       console.log('Edit stopped:', event);
    //       const { layer } = event;
    //       console.log('Edit started:', layer);
    //   //updateExistingLayers(layer);
    //     updateExistingLayers(drawnItems);
    //   });
    
    // Event listeners for editing events
    map.on(L.Draw.Event.EDITSTART, (event) => {
      console.log('Edit started:', event);
      const { handler } = event; // Get the edit handler
        //const { layer } = handler;

        // Disable editing for all layers
    drawnItems.eachLayer((layer) => {
      if (layer.editing) {
        layer.editing.disable();
      }
      if (layer.dragging) {
        layer.dragging.disable();
      }
    });
        
    //      drawnItems.eachLayer((layer) => {
    //   if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
    //      if (layer.editing) {
    //       layer.editing.disable(); // Disable snapping when editing stops
    //      }
    //        if (layer.snapediting) {
    //       enableSnapping(layer) // Disable snapping when editing stops
    //   }
    //   } else if (layer instanceof L.Polygon) {
    //      if (layer.editing) {
    //       layer.editing.disable(); // Disable snapping when editing stops
    //      }
    //        if (layer.snapediting) {
    //     enableSnapping(layer) // Disable snapping when editing stops
    //   }
    //   } else if (layer instanceof L.Marker) {
    //     //  if (layer.editing) {
    //     //   layer.editing.disable(); // Disable snapping when editing stops
    //     // }
    //   }
    //      });
        const { layer } = handler;
        setEditedLayer(layer); // Update state with the edited layer
        //console.log('Edit started:', layer);



      //  enableSnapping(layer); // Enable snapping for the edited layer
        
       

    });

    map.on(L.Draw.Event.EDITSTOP, (editevent) => {
      console.log('Edit stopped',editevent);
      console.log('Edit drawnItems',drawnItems);
        if (editedLayer) {
          //setEditedExistingLayers(null);
        //(editedLayer); // Disable snapping when editing stops
        updateExistingLayersNewEdit(drawnItems); // Update existing layers with the edited layer changes
        setEditedLayer(null); // Clear the edited layer state
      }
    });


    map.on(L.Draw.Event.EDITMOVE, (event) => {
      const { layer } = event;
      // Capture coordinates during edit move
      console.log('Edited coordinates:', layer.getLatLngs());
    });

    map.on(L.Draw.Event.EDITED, (event) => {
      const layers = event.layers;
      layers.eachLayer((layer) => {
        enableSnapping(layer);
      });
     // updateExistingLayers(drawnItems);
    });

    map.on(L.Draw.Event.DELETED, (event) => {
      const layers = event.layers;
      layers.eachLayer((layer) => {
        snapGuideLayers.removeLayer(layer);
      });
      updateExistingLayers(drawnItems);
    });
      
       console.log("drawnItems",drawnItems)

    return () => {
      // Clean up event listeners and layers on component unmount
      map.off(L.Draw.Event.CREATED);
      map.off(L.Draw.Event.EDITSTART);
      map.off(L.Draw.Event.EDITSTOP);
      map.off(L.Draw.Event.EDITMOVE);
      map.off(L.Draw.Event.EDITED);
      map.off(L.Draw.Event.DELETED);
    };
  }, [map, snapGuideLayers, existingLayers,editedLayer]);

  const enableSnapping = (layer) => {
    const snapOptions = {
      snapDistance: 10,
      guideLayers: [snapGuideLayers],
    };

    if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
      if (!layer.snapediting) {
        layer.snapediting = new L.Handler.PolylineSnap(map, layer, snapOptions);
      }
      layer.snapediting.addGuideLayer(snapGuideLayers);

      // Listen to snap events to capture coordinates
      layer.on('snap', (snapEvent) => {
        const snappedLayer = snapEvent.layer; // The layer that was snapped to
        const snappedLatLng = snapEvent.latlng; // The snapped LatLng coordinates
        console.log(`Layer snapped to:`, snappedLayer);
        console.log(`Snapped coordinates:`, snappedLatLng);

        // Update layer's coordinates
        layer.setLatLngs(layer.getLatLngs()); // Replace with your specific update logic
      });
        
       // Listen to other events as needed
  layer.on('edit', (editEvent) => {
      console.log('Edit event layer:', editEvent);
      console.log(layer.getLatLngs());
       // Update layer's coordinates
      //layer.setLatLngs(layer.getLatLngs()); // Replace with your specific update logic

      // console.log("after", layer.getLatLngs());
      
      const updatedPolylines = [];
    const updatedPolygons = [];
    const updatedMarkers = [];

    if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
        updatedPolylines.push({ id: layer.id, latlngs: layer.getLatLngs() });
      } else if (layer instanceof L.Polygon) {
        updatedPolygons.push({ id: layer.id, latlngs: layer.getLatLngs() });
      } else if (layer instanceof L.Marker) {
        updatedMarkers.push({ id: layer.id, latlng: layer.getLatLng() });
      }

    setEditedExistingLayers({
      polylines: updatedPolylines,
      polygons: updatedPolygons,
      markers: updatedMarkers,
    });

    console.log('Updated Layers Edited:', {
      polylines: updatedPolylines,
      polygons: updatedPolygons,
      markers: updatedMarkers,
    });
      
      // Example: Update layer's coordinates when edit starts
    if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
      // For polyline or polygon, update latlngs
       //layer.setLatLngs(layer.getLatLngs()); // Replace with your specific update logic
    } else if (layer instanceof L.Marker) {
      // For marker, you may update its specific LatLng
       //layer.setLatLng(layer.getLatLngs()); // Replace with your specific update logic
    }

    // Example: Refresh snapping after edit start
    // if (layer.snapediting) {
    //   layer.snapediting.disable(); // Disable snapping temporarily
    //   layer.snapediting.enable(); // Re-enable snapping to refresh guide layers
    // }
      
    // Handle edit event logic here
  });


      //layer.snapediting.enable();
    } else if (layer instanceof L.Marker) {
      if (!layer.snapdragging) {
        layer.snapdragging = new L.Handler.MarkerSnap(map, layer, snapOptions);
      }
      layer.snapdragging.addGuideLayer(snapGuideLayers);

      // Listen to snap events to capture coordinates
      layer.on('snap', (snapEvent) => {
        const snappedLayer = snapEvent.layer; // The layer that was snapped to
        const snappedLatLng = snapEvent.latlng; // The snapped LatLng coordinates
        console.log(`Layer snapped to:`, snappedLayer);
        console.log(`Snapped coordinates:`, snappedLatLng);

        // Update layer's coordinates
        layer.setLatLng(snappedLatLng); // Replace with your specific update logic
      });

      layer.snapdragging.enable();
    }
  };


    const disableSnapping = (layer) => {
    if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
      if (layer.snapediting) {
        layer.snapediting.disable(); // Disable snapping when editing stops
      }
    } else if (layer instanceof L.Marker) {
      if (layer.snapdragging) {
        layer.snapdragging.disable(); // Disable snapping when editing stops
      }
    }
  };

  const updateExistingLayers = (drawnItems) => {
    const updatedPolylines = [];
    const updatedPolygons = [];
      const updatedMarkers = [];
      
      console.log("EditedExisting Layer",editedexistingLayers);

    drawnItems.eachLayer((layer) => {
      if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
        updatedPolylines.push({ id: layer.id, latlngs: layer.getLatLngs() });
      } else if (layer instanceof L.Polygon) {
        updatedPolygons.push({ id: layer.id, latlngs: layer.getLatLngs() });
      } else if (layer instanceof L.Marker) {
        updatedMarkers.push({ id: layer.id, latlng: layer.getLatLng() });
      }
    });

    setExistingLayers({
      polylines: updatedPolylines,
      polygons: updatedPolygons,
      markers: updatedMarkers,
    });
      
      console.log('Updated Layers Created,Deleted:', existingLayers);

    console.log('Updated Layers:', {
      polylines: updatedPolylines,
      polygons: updatedPolygons,
      markers: updatedMarkers,
    });
  };
    
        const updateExistingLayersNewEdit = () => {
            const updatedLayers = { ...existingLayers };

            // Update polylines
            updatedLayers.polylines = editedexistingLayers.polylines.map(newPolyline =>
                existingLayers.polylines.find(oldPolyline => oldPolyline.id === newPolyline.id) || newPolyline
            );

            // Update polygons
            updatedLayers.polygons = editedexistingLayers.polygons.map(newPolygon =>
                existingLayers.polygons.find(oldPolygon => oldPolygon.id === newPolygon.id) || newPolygon
            );

            // Update markers
            updatedLayers.markers = editedexistingLayers.markers.map(newMarker =>
                existingLayers.markers.find(oldMarker => oldMarker.id === newMarker.id) || newMarker
            );

            setExistingLayers(updatedLayers);
            setEditedExistingLayers(null);

            console.log('Updated Layers Edited:', existingLayers);
        };
    
   

  return null;
};

export default MapLayers;
