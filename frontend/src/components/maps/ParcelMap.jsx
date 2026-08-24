import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, Tooltip } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { RiskBadge } from '../common/RiskBadge';
import { Search, Filter, Layers, ExternalLink, AlertTriangle } from 'lucide-react';

export const ParcelMap = ({ geojsonData, onSelectParcel = null, selectedParcelId = null, height = '600px' }) => {
  const navigate = useNavigate();
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFeature, setActiveFeature] = useState(null);

  const features = geojsonData?.features || [];

  const filteredFeatures = features.filter((f) => {
    const props = f.properties;
    const matchRisk = filterRisk === 'ALL' || props.risk_level?.toUpperCase() === filterRisk;
    const matchSearch =
      !searchQuery ||
      props.plot_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      props.case_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      props.khata_number?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRisk && matchSearch;
  });

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white">
      {/* Top Map Controls Overlay */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-3 bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-lg border border-slate-200">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Plot or Case #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 w-52"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          {['ALL', 'HIGH', 'MEDIUM', 'LOW', 'COMPLETED'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterRisk(lvl)}
              className={`px-2.5 py-1 rounded transition-all ${
                filterRisk === lvl
                  ? 'bg-govblue-700 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-200 text-xs">
        <div className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-govblue-700" />
          Risk Legend
        </div>
        <div className="space-y-1.5 font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-[#EF4444] border border-rose-600"></span>
            <span>High Risk (70-100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-[#F59E0B] border border-amber-600"></span>
            <span>Medium Risk (40-69%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-[#10B981] border border-emerald-600"></span>
            <span>Low Risk (0-39%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-[#3B82F6] border border-blue-600"></span>
            <span>Acquisition Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-[#9CA3AF] border border-slate-400"></span>
            <span>Insufficient Data</span>
          </div>
        </div>
      </div>

      {/* Leaflet Map Container */}
      <MapContainer
        center={[20.1228, 85.8335]}
        zoom={15}
        style={{ height, width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {filteredFeatures.map((feature) => {
          const props = feature.properties;
          const isSelected = selectedParcelId === feature.id;
          
          // GeoJSON coordinates format is [lng, lat] -> Leaflet requires [lat, lng]
          const leafletCoords = feature.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);

          return (
            <Polygon
              key={feature.id}
              positions={leafletCoords}
              pathOptions={{
                color: isSelected ? '#1E3A8A' : props.risk_color,
                fillColor: props.risk_color,
                fillOpacity: isSelected ? 0.85 : 0.60,
                weight: isSelected ? 4 : 2,
              }}
              eventHandlers={{
                click: () => {
                  setActiveFeature(feature);
                  if (onSelectParcel) onSelectParcel(feature);
                },
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-semibold">
                  Plot #{props.plot_number} ({props.village_name})
                  <div className="font-bold text-slate-800">{props.risk_level} Risk</div>
                </div>
              </Tooltip>

              <Popup className="custom-parcel-popup">
                <div className="p-1 min-w-[260px]">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Plot #{props.plot_number}
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        Khata No: {props.khata_number} • {props.village_name}
                      </span>
                    </div>
                    <RiskBadge risk={props.risk_level} />
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Land Area:</span>
                      <span className="font-bold text-slate-800">{props.area_acres} Acres</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Land Type:</span>
                      <span className="font-medium text-slate-800">{props.land_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Delay Probability:</span>
                      <span className="font-bold text-slate-800">
                        {Math.round((props.delay_probability || 0.2) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Case Ref:</span>
                      <span className="font-medium text-govblue-700">{props.case_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Compensation:</span>
                      <span className="font-medium text-slate-800">{props.compensation_stage || 'Valuation Pending'}</span>
                    </div>
                  </div>

                  {props.owners && props.owners.length > 0 && (
                    <div className="bg-slate-50 p-2 rounded-lg mb-3 border border-slate-100 text-xs">
                      <div className="font-semibold text-slate-700 mb-1">Landowners / Co-sharers:</div>
                      {props.owners.map((o, idx) => (
                        <div key={idx} className="text-slate-600 flex justify-between">
                          <span>{o.name}</span>
                          <span className="text-slate-400 font-mono">{o.share_pct}%</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/cases/${props.case_id || 4}`)}
                      className="flex-1 bg-govblue-700 hover:bg-govblue-800 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1 transition-all shadow-sm"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open Case
                    </button>
                    <button
                      onClick={() => navigate(`/parcels/${feature.id}`)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 px-3 rounded-lg text-xs transition-all"
                    >
                      Parcel Details
                    </button>
                  </div>
                </div>
              </Popup>
            </Polygon>
          );
        })}
      </MapContainer>
    </div>
  );
};
