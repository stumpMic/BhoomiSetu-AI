import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { parcelService } from '../../services/parcelService';
import { ParcelMap } from '../../components/maps/ParcelMap';
import { ParcelMap3D } from '../../components/maps/ParcelMap3D';
import { MapPin, Layers3, Map } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ParcelMapPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [geojsonData, setGeojsonData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulation / 3D mode is strictly available ONLY to Land Acquisition Officer, Survey Officer, and Admin
  const canAccess3D = user && (user.role === 'land_acquisition_officer' || user.role === 'survey_officer' || user.role === 'admin' || user.role === 'project_authority');
  const [viewMode, setViewMode] = useState(searchParams.get('mode') === '3d' && canAccess3D ? '3D' : '2D');

  useEffect(() => {
    const loadGeojson = async () => {
      setLoading(true);
      const data = await parcelService.getMapParcels();
      setGeojsonData(data);
      setLoading(false);
    };
    loadGeojson();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-govblue-700" />
            <span>{viewMode === '3D' && canAccess3D ? '3D GIS Parcel Simulation' : t('nav.map')}</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Cadastral boundary layers for Pipili & Balipatna villages (Bhubaneswar-Puri Expressway Corridor).
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Role-Gated 2D / 3D Simulation Mode Toggle (Visible ONLY to LAO, SO, and Admin) */}
          {canAccess3D && (
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
              <button
                onClick={() => setViewMode('2D')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === '2D'
                    ? 'bg-white text-govblue-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>2D Cadastral Map</span>
              </button>

              <button
                onClick={() => setViewMode('3D')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === '3D'
                    ? 'bg-govblue-700 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers3 className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                <span>3D GIS Environment</span>
              </button>
            </div>
          )}

          <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hidden md:block">
            Spatial Projection: <strong>WGS84 / EPSG:4326</strong>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-[650px] bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-govblue-700"></div>
        </div>
      ) : viewMode === '3D' && canAccess3D ? (
        <ParcelMap3D geojsonData={geojsonData} height="680px" />
      ) : (
        <ParcelMap geojsonData={geojsonData} height="650px" />
      )}
    </div>
  );
};
