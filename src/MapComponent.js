// src/components/MapComponent.js
import React, { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import MapLayers from './MapLayers';

const MapComponent = () => {

  const [isClicked, setIsClicked] = useState(false);

  return (
    <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <div style={ { position: 'absolute', borderColor:'red',borderWidth:10,left:50,top:10,zIndex:1000} }>
        <div class="leaflet-draw-section">
          <div class="leaflet-draw-toolbar leaflet-bar leaflet-draw-toolbar-notop leaflet-draw-toolbar-nobottom">
            <a class="leaflet-draw-edit-edit leaflet-draw-toolbar-button-enabled" href="#" title="Edit layers" onMouseOver={()=>{}} onClick={ () => { setIsClicked(true)} }>
            </a>
          </div>
          {
            isClicked ? <ul class="leaflet-draw-actions leaflet-draw-actions-top leaflet-draw-actions-bottom" style={{ top:1,display:'block'}}>
            <li class="" >
              <a class="" href="#" title="Save changes" style={{padding:'7px'}} onClick={ () => { setIsClicked(false)} }>Save</a>
            </li>
            <li class="">
              <a class="" href="#" title="Cancel editing, discards all changes" style={{padding:'7px'}} onClick={ () => {setIsClicked(false) } }>Cancel</a>
            </li>
            </ul>
              :
              null
          }
          
        </div>
      </div>
      <MapLayers />
    </MapContainer>
    
  );
};

export default MapComponent;
