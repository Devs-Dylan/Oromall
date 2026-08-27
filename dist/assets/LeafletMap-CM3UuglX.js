import{j as m}from"./ui-2Kp7ylu8.js";import{r as p}from"./vendor-BM590USX.js";import{L as i}from"./maps-CRt4kdYo.js";function L({markers:a,referencePoint:e,center:x=[3.868,11.521],zoom:f=12,height:y="480px",className:$="",onMarkerClick:b,onMapClick:h}){const c=p.useRef(null),r=p.useRef(null),w=p.useRef(null);return p.useEffect(()=>{if(!c.current)return;if(r.current)r.current.invalidateSize();else{const o=i.map(c.current).setView(x,f);i.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',subdomains:"abc",maxZoom:19,updateWhenIdle:!0,updateWhenZooming:!1,keepBuffer:2}).addTo(o),w.current=i.layerGroup().addTo(o),r.current=o,o.on("click",t=>{h&&h(Number(t.latlng.lat.toFixed(5)),Number(t.latlng.lng.toFixed(5)))}),setTimeout(()=>o.invalidateSize(),200)}const s=r.current,l=w.current;if(l&&l.clearLayers(),s&&l){const o=i.latLngBounds([]);if(e&&e.latitude&&e.longitude){const t=i.divIcon({className:"reference-point-marker",html:`
            <div style="
              background: linear-gradient(135deg, #f59e0b, #d97706);
              color: #000;
              padding: 6px 12px;
              border-radius: 24px;
              font-size: 11px;
              font-weight: 900;
              display: flex;
              align-items: center;
              gap: 5px;
              box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.4), 0 4px 14px rgba(0,0,0,0.4);
              border: 2px solid white;
              white-space: nowrap;
              cursor: grab;
            ">
              <span>🎯</span>
              <span>${e.label||"Point de Repère"}</span>
            </div>
          `,iconSize:[140,34],iconAnchor:[70,17]}),d=`https://www.google.com/maps/search/?api=1&query=${e.latitude},${e.longitude}`,n=`https://www.openstreetmap.org/?mlat=${e.latitude}&mlon=${e.longitude}#map=16/${e.latitude}/${e.longitude}`,u=i.marker([e.latitude,e.longitude],{icon:t});u.bindPopup(`
          <div style="font-family: system-ui, sans-serif; padding: 6px; text-align: center; max-width: 240px;">
            <p style="margin: 0; font-weight: 900; font-size: 13px; color: #b45309;">🎯 Point de Repère Actif</p>
            <p style="margin: 4px 0 2px 0; font-weight: 700; font-size: 12px; color: #111;">${e.label}</p>
            <p style="margin: 0 0 6px 0; font-size: 10px; color: #666;">GPS Réel : ${e.latitude}, ${e.longitude}</p>
            
            ${e.website?`<a href="${e.website}" target="_blank" rel="noopener noreferrer" style="display: block; margin-bottom: 6px; color: #2563eb; font-size: 11px; text-decoration: underline; font-weight: bold;">🌐 Site Officiel (${e.website.replace("https://","")})</a>`:""}

            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">
              <a href="${d}" target="_blank" rel="noopener noreferrer" style="display: block; background: #ea4335; color: white; padding: 5px 10px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: bold;">🗺️ Vérifier sur Google Maps</a>
              <a href="${n}" target="_blank" rel="noopener noreferrer" style="display: block; background: #7092BF; color: white; padding: 4px 10px; border-radius: 6px; text-decoration: none; font-size: 10px; font-weight: bold;">🌐 Ouvrir OpenStreetMap</a>
            </div>
          </div>
        `),l.addLayer(u),o.extend([e.latitude,e.longitude])}a.forEach(t=>{if(!t.latitude||!t.longitude)return;const d=t.type==="shop",n=d?"#d97706":"#10b981",u=d?"🏬":"🏠",v=i.divIcon({className:"custom-leaflet-marker",html:`
            <div style="
              background-color: ${n};
              color: white;
              padding: 4px 10px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 800;
              display: flex;
              align-items: center;
              gap: 5px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              border: 2px solid white;
              white-space: nowrap;
              cursor: pointer;
            ">
              <span>${u}</span>
              <span>${t.price||t.title}</span>
              ${t.distanceKm!==void 0?`<span style="background: rgba(0,0,0,0.35); padding: 1px 5px; border-radius: 10px; font-size: 9px;">${t.distanceKm} km</span>`:""}
            </div>
          `,iconSize:[120,30],iconAnchor:[60,15]}),g=i.marker([t.latitude,t.longitude],{icon:v}),k=`https://www.google.com/maps/search/?api=1&query=${t.latitude},${t.longitude}`,z=`
          <div style="font-family: system-ui, sans-serif; max-width: 230px; padding: 4px;">
            ${t.image_url?`<img src="${t.image_url}" alt="${t.title}" style="width: 100%; height: 95px; object-fit: cover; border-radius: 8px; margin-bottom: 6px;"/>`:""}
            <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; color: #111;">${t.title}</h4>
            ${t.subtitle?`<p style="margin: 0 0 6px 0; font-size: 11px; color: #555; line-height: 1.3;">${t.subtitle}</p>`:""}
            ${t.distanceKm!==void 0?`<p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #d97706;">📍 Distance : ${t.distanceKm} km (~${Math.round(t.distanceKm*12)} min à pied)</p>`:""}
            ${t.price?`<p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 800; color: ${n};">${t.price}</p>`:""}
            
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${t.link_url&&t.link_url!=="#"?`<a href="${t.link_url}" style="display: block; text-align: center; background: ${n}; color: white; padding: 6px 12px; border-radius: 8px; text-decoration: none; font-size: 11px; font-weight: 800;">Consulter la fiche</a>`:""}
              <a href="${k}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background: #f1f5f9; color: #334155; padding: 4px 8px; border-radius: 6px; text-decoration: none; font-size: 10px; font-weight: bold; border: 1px solid #cbd5e1;">🗺️ Voir sur Google Maps</a>
            </div>
          </div>
        `;g.bindPopup(z),b&&g.on("click",()=>b(t)),l.addLayer(g),o.extend([t.latitude,t.longitude])}),o.isValid()&&(a.length>1||e&&a.length>=1?s.fitBounds(o,{padding:[50,50],maxZoom:15}):a.length===1?s.setView([a[0].latitude,a[0].longitude],14):e&&s.setView([e.latitude,e.longitude],14))}},[a,e,x,f]),p.useEffect(()=>()=>{r.current&&(r.current.remove(),r.current=null)},[]),m.jsx("div",{className:`relative rounded-3xl overflow-hidden shadow-lg border border-border ${$}`,children:m.jsx("div",{ref:c,style:{height:y,width:"100%"}})})}export{L};
