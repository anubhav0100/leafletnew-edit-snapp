// src/components/MapLayers.js
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
  const [existingLayers, setExistingLayers] = useState(initialLayers);
  const layersAdded = useRef(false);  // To track if layers have been added

  useEffect(() => {
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    map.addLayer(snapGuideLayers);

    if (!drawControlRef.current) {
      drawControlRef.current = new L.Control.Draw({
        edit: {
          featureGroup: drawnItems,
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

    map.on(L.Draw.Event.EDITSTOP, () => {
      updateExistingLayers(drawnItems);
    });

    map.on(L.Draw.Event.EDITED, (event) => {
      const layers = event.layers;
      layers.eachLayer((layer) => {
        enableSnapping(layer);
      });
      updateExistingLayers(drawnItems);
    });

    map.on(L.Draw.Event.DELETED, (event) => {
      const layers = event.layers;
      layers.eachLayer((layer) => {
        snapGuideLayers.removeLayer(layer);
      });
      updateExistingLayers(drawnItems);
    });
  }, [map, snapGuideLayers, existingLayers]);

  const enableSnapping1 = (layer) => {
    const snapOptions = {
      snapDistance: 10,
      guideLayers: [snapGuideLayers],
    };

    if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
      if (!layer.snapediting) {
        layer.snapediting = new L.Handler.PolylineSnap(map, layer, snapOptions);
      }
      layer.snapediting.addGuideLayer(snapGuideLayers);
      layer.snapediting.enable();
    } else if (layer instanceof L.Marker) {
      if (!layer.snapdragging) {
        layer.snapdragging = new L.Handler.MarkerSnap(map, layer, snapOptions);
      }
      layer.snapdragging.addGuideLayer(snapGuideLayers);
      layer.snapdragging.enable();
    }
  };
    
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

    layer.snapediting.enable();
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


  const updateExistingLayers = (drawnItems) => {
    const updatedPolylines = [];
    const updatedPolygons = [];
    const updatedMarkers = [];

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

    console.log('Updated Layers:', {
      polylines: updatedPolylines,
      polygons: updatedPolygons,
      markers: updatedMarkers,
    });
  };

  return null;
};

export default MapLayers;
