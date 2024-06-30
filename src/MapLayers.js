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
  const layersAdded = useRef(false); // To track if layers have been added
  const [editedLayer, setEditedLayer] = useState(null);
  const drawnItems = useRef(new L.FeatureGroup()).current;
  const layerRefs = useRef({});

  useEffect(() => {
    map.addLayer(drawnItems);
    map.addLayer(snapGuideLayers);

    if (!drawControlRef.current) {
      drawControlRef.current = new L.Control.Draw({
        edit: {
          featureGroup: drawnItems,
          edit: true, // Disable default editing
          remove: false,
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
      addExistingLayersToMap(existingLayers);
      layersAdded.current = true;
    }

    map.on(L.Draw.Event.CREATED, handleLayerCreated);
    map.on(L.Draw.Event.EDITSTART, handleEditStart);
    map.on(L.Draw.Event.EDITSTOP, handleEditStop);
    map.on(L.Draw.Event.EDITED, handleLayersEdited);
    map.on(L.Draw.Event.DELETED, handleLayersDeleted);

    return () => {
      map.off(L.Draw.Event.CREATED, handleLayerCreated);
      map.off(L.Draw.Event.EDITSTART, handleEditStart);
      map.off(L.Draw.Event.EDITSTOP, handleEditStop);
      map.off(L.Draw.Event.EDITED, handleLayersEdited);
      map.off(L.Draw.Event.DELETED, handleLayersDeleted);
    };
  }, [map, existingLayers]);

  const handleLayerCreated = (event) => {
    const { layerType, layer } = event;
    layer.id = Date.now(); // Assign a unique id to the new layer
    if (layerType === 'marker') {
      layer.bindPopup('A popup!');
    }
    drawnItems.addLayer(layer);
    snapGuideLayers.addLayer(layer);
    layerRefs.current[layer.id] = layer;
    enableSnapping(layer);
    if (layer.dragging) {
      layer.dragging.enable();
    }
    updateExistingLayers(drawnItems);
  };

  const handleEditStart = (event) => {
    // Override default behavior to prevent entering edit mode
    const { handler } = event;
   // const layerToEdit = handler._featureGroup._layers[handler._featureGroup._leaflet_id];

    // Disable editing and dragging for all layers
    // Object.values(layerRefs.current).forEach((layer) => {
    //   if (layer.editing) {
    //     layer.editing.disable();
    //   }
    //   if (layer.dragging) {
    //     layer.dragging.disable();
    //   }
    // });

    // // Enable dragging for the selected layer manually if needed
    // if (layerToEdit.dragging) {
    //   layerToEdit.dragging.enable();
    // }

   // setEditedLayer(layerToEdit);
  };

  const handleEditStop = () => {
    if (editedLayer) {
      updateExistingLayers(drawnItems);
      setEditedLayer(null);
    }
  };

  const handleLayersEdited = (event) => {
    const layers = event.layers;
    layers.eachLayer((layer) => {
      enableSnapping(layer);
    });
  };

  const handleLayersDeleted = (event) => {
    const layers = event.layers;
    layers.eachLayer((layer) => {
      snapGuideLayers.removeLayer(layer);
      delete layerRefs.current[layer.id];
    });
    updateExistingLayers(drawnItems);
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
      layer.snapediting.enable();
    } else if (layer instanceof L.Marker) {
      if (!layer.snapdragging) {
        layer.snapdragging = new L.Handler.MarkerSnap(map, layer, snapOptions);
      }
      layer.snapdragging.addGuideLayer(snapGuideLayers);
      layer.snapdragging.enable();
    }
  };

  const addExistingLayersToMap = (layers) => {
    layers.polylines.forEach(({ id, latlngs }) => {
      const polyline = L.polyline(latlngs, { draggable: true }).addTo(map);
      polyline.id = id;
      enableSnapping(polyline);
      drawnItems.addLayer(polyline);
      snapGuideLayers.addLayer(polyline);
      layerRefs.current[id] = polyline;
    });

    layers.polygons.forEach(({ id, latlngs }) => {
      const polygon = L.polygon(latlngs, { draggable: true }).addTo(map);
      polygon.id = id;
      enableSnapping(polygon);
      drawnItems.addLayer(polygon);
      snapGuideLayers.addLayer(polygon);
      layerRefs.current[id] = polygon;
    });

    layers.markers.forEach(({ id, latlng, popup }) => {
      const marker = L.marker(latlng, { draggable: true }).addTo(map);
      marker.id = id;
      if (popup) {
        marker.bindPopup(popup);
      }
      enableSnapping(marker);
      drawnItems.addLayer(marker);
      snapGuideLayers.addLayer(marker);
      layerRefs.current[id] = marker;
    });
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
