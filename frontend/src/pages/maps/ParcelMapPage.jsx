import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parcelService } from '../../services/parcelService';
import { ParcelMap } from '../../components/maps/ParcelMap';
import { Layers, MapPin, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ParcelMapPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [geojsonData, setGeojsonData] = useState(null);
  const [loading, setLoading] = useState(true);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-govblue-700" />
            <span>{t('nav.map')}</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Cadastral boundary layers for Pipili & Balipatna villages (Bhubaneswar-Puri Expressway Corridor).
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm self-start sm:self-auto">
          Spatial Projection: <strong>WGS84 / EPSG:4326</strong>
        </div>
      </div>

      {loading ? (
        <div className="h-[600px] bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-govblue-700"></div>
        </div>
      ) : (
        <ParcelMap geojsonData={geojsonData} height="650px" />
      )}
    </div>
  );
};
