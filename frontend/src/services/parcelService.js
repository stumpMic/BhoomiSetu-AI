import { apiClient, USE_MOCK_API } from './apiClient';
import parcelMock from '../../../contracts/examples/parcel-response.json';

export const parcelService = {
  getParcels: async (filters = {}) => {
    try {
      const res = await apiClient.get('/parcels', { params: filters });
      return res.data;
    } catch (err) {
      return parcelMock.features.map(f => ({
        id: f.id,
        plot_number: f.properties.plot_number,
        khata_number: f.properties.khata_number,
        village_name: f.properties.village_name,
        district: f.properties.district,
        area_acres: f.properties.area_acres,
        land_type: f.properties.land_type,
        risk_level: f.properties.risk_level,
        risk_color: f.properties.risk_color,
        case_id: f.properties.case_id,
        case_number: f.properties.case_number,
        compensation_stage: f.properties.compensation_stage,
        compensation_amount: f.properties.compensation_amount,
        owners: f.properties.owners || []
      }));
    }
  },

  getMapParcels: async (filters = {}) => {
    if (USE_MOCK_API) return parcelMock;
    try {
      const res = await apiClient.get('/parcels/map', { params: filters });
      return res.data;
    } catch (err) {
      console.warn("Using GeoJSON fallback mock:", err);
      return parcelMock;
    }
  },

  getParcelById: async (id) => {
    try {
      const res = await apiClient.get(`/parcels/${id}`);
      return res.data;
    } catch (err) {
      const feature = parcelMock.features.find(f => f.id === Number(id)) || parcelMock.features[0];
      return {
        id: feature.id,
        ...feature.properties
      };
    }
  }
};
