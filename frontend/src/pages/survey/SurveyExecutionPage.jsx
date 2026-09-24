import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { surveyService } from '../../services/surveyService';
import { MapContainer, TileLayer, Polygon, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import {
  Compass,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  FileCheck,
  Camera,
  AlertCircle,
  FileText,
  ShieldCheck,
  Send,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  UserCheck,
  Building,
  TreePine,
  Wheat,
  Droplets,
  Home,
  Check,
  X,
  Layers,
  ChevronRight,
  Info,
  Award,
  Zap,
  FileSpreadsheet,
  Scale,
  Gavel,
  HelpCircle,
  CheckSquare
} from 'lucide-react';

// Fix Leaflet default icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom GPS Marker Icons
const expectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const fieldGpsIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const SurveyExecutionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);

  // Sub-forms state
  // 1. Scheduling
  const [schedData, setSchedData] = useState({
    scheduled_date: '',
    time_slot: 'Morning (09:00 AM - 01:00 PM)',
    estimated_duration_hours: 3.5,
    field_team_members: 'Smt. Sunita Mishra (SO), Shri R. K. Behera (Surveyor), Shri P. Das (Amin)',
    field_instructions: 'Conduct rigorous boundary pegging, tree count, and verify occupancy.',
    equipment_used: 'DGPS Trimble R10, Electronic Total Station, 50m Steel Tape'
  });

  // 2. Documents Verification checklist
  const [docItems, setDocItems] = useState([
    { doc_type: 'RoR (Record of Rights)', doc_title: 'Khatian / Patta Document', verification_status: 'VERIFIED', mismatch_details: '', remarks: 'Owner name matches Revenue Record' },
    { doc_type: 'Cadastral Map Sheet', doc_title: 'Village Cadastral Map (Scale 1:4000)', verification_status: 'VERIFIED', mismatch_details: '', remarks: 'Plot boundary aligns with sheet' },
    { doc_type: 'Sale Deed / Title Deed', doc_title: 'Registered Conveyance Deed', verification_status: 'VERIFIED', mismatch_details: '', remarks: 'No encumbrance reported' },
    { doc_type: 'Mutation Record', doc_title: 'Tehsildar Mutation Order', verification_status: 'VERIFIED', mismatch_details: '', remarks: 'Latest mutation completed in 2022' }
  ]);

  // 3. GPS Verification
  const [gpsData, setGpsData] = useState({
    captured_latitude: '',
    captured_longitude: '',
    is_manual_entry: false
  });
  const [gpsCapturing, setGpsCapturing] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // 4. Field Observations
  const [obsData, setObsData] = useState({
    observed_area_acres: 0.85,
    land_use: 'Agricultural',
    crop_type: 'Paddy (Kharif Crop)',
    irrigation_available: true,
    general_condition: 'Level agricultural land with direct village road frontage.',
    has_house: false,
    has_building: false,
    has_boundary_wall: false,
    has_well: true,
    has_pond: false,
    trees_count: 14,
    has_electrical_infra: true,
    other_structures: '1 Submersible Borewell pump shed (10x8 ft), 14 Teakwood Trees.',
    landowner_present: true,
    occupant_present: true,
    tenant_present: false,
    occupancy_remarks: 'Primary landowner Shri Ramesh Rout verified on-site with Aadhaar ID.',
    boundary_status: 'Boundary matches records',
    boundary_remarks: 'North boundary pegs match village revenue map.',
    // Ownership Dispute
    has_ownership_dispute: false,
    dispute_nature: '',
    dispute_parties: '',
    dispute_details: '',
    dispute_remarks: '',
    // Court Case / Legal Dispute
    has_court_case: false,
    court_case_number: '',
    court_name: '',
    court_parties: '',
    court_case_description: '',
    court_case_status: 'Pending',
    court_case_remarks: '',
    // Structure / Project on Land
    has_structure_or_project: false,
    structure_type: 'House / Residential Building (Pucca)',
    structure_description: '',
    structure_location: '',
    structure_remarks: ''
  });

  // 5. Evidence Upload
  const [newEvidence, setNewEvidence] = useState({
    category: 'Land Boundary',
    title: '',
    description: '',
    file_type: 'photo',
    file_path: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    latitude: '',
    longitude: ''
  });
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  // 6. Discrepancy Form
  const [newDiscrepancy, setNewDiscrepancy] = useState({
    category: 'Boundary mismatch',
    severity: 'MEDIUM',
    description: '',
    remarks: ''
  });
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState(false);

  // 7. Resurvey Request Form
  const [resurveyData, setResurveyData] = useState({
    resurvey_reason: 'Severe boundary dispute with Plot #104 owner',
    priority: 'High',
    required_action: 'Joint demarcation required in presence of Tehsildar and Amin',
    supporting_evidence: 'Physical boundary overlapping by 4.2 meters on Northern edge.',
    remarks: 'Field survey paused pending joint revenue demarcation.'
  });
  const [showResurveyModal, setShowResurveyModal] = useState(false);

  // 8. Final Report & Submission
  const [reportData, setReportData] = useState({
    final_recommendation: 'Survey Completed',
    final_remarks: 'Field survey completed successfully. Parcel demarcated with GPS tags and photo evidence.',
    digital_signature_confirmed: false,
    certification_statement: 'I hereby certify that the measurements, observations, and evidence recorded herein were collected during physical on-site field survey under my supervision and are authentic to the best of my knowledge.',
    checklist_1: true,
    checklist_2: true,
    checklist_3: true,
    checklist_4: true
  });

  // 9. LAO / CO Review Form
  const [reviewData, setReviewData] = useState({
    action: 'APPROVE',
    remarks: 'Survey report verified and cross-checked against GIS cadastral map. Approved for section 19 declaration.',
    corrections_required: ''
  });
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Fetch full survey details
  const loadSurvey = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await surveyService.getSurveyDetail(id);
      setSurvey(data);

      // Hydrate forms if data exists
      if (data.schedule) {
        setSchedData({
          scheduled_date: data.schedule.scheduled_date ? data.schedule.scheduled_date.split('T')[0] : '',
          time_slot: data.schedule.time_slot || 'Morning (09:00 AM - 01:00 PM)',
          estimated_duration_hours: data.schedule.estimated_duration_hours || 3.5,
          field_team_members: data.schedule.field_team_members || '',
          field_instructions: data.schedule.field_instructions || '',
          equipment_used: data.schedule.equipment_used || ''
        });
      }

      if (data.document_verifications && data.document_verifications.length > 0) {
        setDocItems(data.document_verifications.map(d => ({
          doc_type: d.doc_type,
          doc_title: d.doc_title,
          verification_status: d.verification_status,
          mismatch_details: d.mismatch_details || '',
          remarks: d.remarks || ''
        })));
      }

      if (data.gps_verification) {
        setGpsData({
          captured_latitude: data.gps_verification.captured_latitude || '',
          captured_longitude: data.gps_verification.captured_longitude || '',
          is_manual_entry: data.gps_verification.is_manual_entry || false
        });
      }

      if (data.field_observation) {
        setObsData({
          observed_area_acres: data.field_observation.observed_area_acres || data.recorded_area_acres,
          land_use: data.field_observation.land_use || 'Agricultural',
          crop_type: data.field_observation.crop_type || '',
          irrigation_available: data.field_observation.irrigation_available || false,
          general_condition: data.field_observation.general_condition || '',
          has_house: data.field_observation.has_house || false,
          has_building: data.field_observation.has_building || false,
          has_boundary_wall: data.field_observation.has_boundary_wall || false,
          has_well: data.field_observation.has_well || false,
          has_pond: data.field_observation.has_pond || false,
          trees_count: data.field_observation.trees_count || 0,
          has_electrical_infra: data.field_observation.has_electrical_infra || false,
          other_structures: data.field_observation.other_structures || '',
          landowner_present: data.field_observation.landowner_present ?? true,
          occupant_present: data.field_observation.occupant_present ?? true,
          tenant_present: data.field_observation.tenant_present ?? false,
          occupancy_remarks: data.field_observation.occupancy_remarks || '',
          boundary_status: data.field_observation.boundary_status || 'Boundary matches records',
          boundary_remarks: data.field_observation.boundary_remarks || '',
          // Ownership Dispute
          has_ownership_dispute: Boolean(data.field_observation.has_ownership_dispute),
          dispute_nature: data.field_observation.dispute_nature || '',
          dispute_parties: data.field_observation.dispute_parties || '',
          dispute_details: data.field_observation.dispute_details || '',
          dispute_remarks: data.field_observation.dispute_remarks || '',
          // Court Case / Legal Dispute
          has_court_case: Boolean(data.field_observation.has_court_case),
          court_case_number: data.field_observation.court_case_number || '',
          court_name: data.field_observation.court_name || '',
          court_parties: data.field_observation.court_parties || '',
          court_case_description: data.field_observation.court_case_description || '',
          court_case_status: data.field_observation.court_case_status || 'Pending',
          court_case_remarks: data.field_observation.court_case_remarks || '',
          // Structure / Project on Land
          has_structure_or_project: Boolean(data.field_observation.has_structure_or_project),
          structure_type: data.field_observation.structure_type || 'House / Residential Building (Pucca)',
          structure_description: data.field_observation.structure_description || '',
          structure_location: data.field_observation.structure_location || '',
          structure_remarks: data.field_observation.structure_remarks || ''
        });
      } else {
        setObsData(prev => ({ ...prev, observed_area_acres: data.recorded_area_acres }));
      }

      if (data.report) {
        setReportData(prev => ({
          ...prev,
          final_recommendation: data.report.final_recommendation || 'Survey Completed',
          final_remarks: data.report.final_remarks || '',
          digital_signature_confirmed: data.report.is_digitally_confirmed || false
        }));
      }

    } catch (err) {
      console.error('Failed to load survey:', err);
      setError(err.response?.data?.detail || 'Failed to load survey details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurvey();
  }, [id]);

  // Quick Flash Alert helper
  const showFeedback = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  // Workflow Action Handlers
  const handleAcceptAssignment = async () => {
    try {
      setActionLoading(true);
      await surveyService.acceptSurvey(id);
      showFeedback('Survey assignment accepted successfully.');
      loadSurvey();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to accept survey.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartSurvey = async () => {
    try {
      setActionLoading(true);
      await surveyService.startSurvey(id);
      showFeedback('Field survey officially marked IN PROGRESS.');
      loadSurvey();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start field survey.');
    } finally {
      setActionLoading(false);
    }
  };

  // 1. Save Schedule
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await surveyService.scheduleSurvey(id, schedData);
      showFeedback('Survey schedule updated successfully.');
      loadSurvey();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update schedule.');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Save Document Verifications
  const handleSaveDocs = async () => {
    try {
      setActionLoading(true);
      await surveyService.verifyDocuments(id, { documents: docItems });
      showFeedback('Document verifications recorded.');
      loadSurvey();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save document verifications.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDocsAndNavigate = async (targetTab) => {
    try {
      setActionLoading(true);
      await surveyService.verifyDocuments(id, { documents: docItems });
      showFeedback('Document verifications saved.');
      if (targetTab) setActiveTab(targetTab);
      loadSurvey();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save document verifications.');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Capture / Verify GPS
  const handleCaptureLiveGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser. Please enter coordinates manually.');
      return;
    }
    setGpsCapturing(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setGpsData({
          captured_latitude: lat,
          captured_longitude: lng,
          is_manual_entry: false
        });
        setGpsCapturing(false);

        // Auto verify with backend
        try {
          setActionLoading(true);
          await surveyService.verifyGps(id, {
            captured_latitude: lat,
            captured_longitude: lng,
            is_manual_entry: false
          });
          showFeedback(`Live GPS Coordinates (${lat}, ${lng}) recorded & spatial distance computed.`);
          loadSurvey();
        } catch (err) {
          setError(err.response?.data?.detail || 'Spatial calculation failed.');
        } finally {
          setActionLoading(false);
        }
      },
      (err) => {
        setGpsCapturing(false);
        console.warn('Geolocation warning/fallback:', err);
        // Provide demo fallback coordinates if in development/testing
        const fallbackLat = survey?.expected_latitude ? survey.expected_latitude + 0.00012 : 20.1234;
        const fallbackLng = survey?.expected_longitude ? survey.expected_longitude + 0.00008 : 85.8341;
        setGpsData({
          captured_latitude: fallbackLat,
          captured_longitude: fallbackLng,
          is_manual_entry: true
        });
        setGpsError(`Device GPS note: ${err.message}. Loaded simulated field coordinates for parcel testing.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleManualGpsSubmit = async (e) => {
    e.preventDefault();
    if (!gpsData.captured_latitude || !gpsData.captured_longitude) {
      setError('Please provide valid Latitude and Longitude values.');
      return;
    }
    try {
      setActionLoading(true);
      await surveyService.verifyGps(id, {
        captured_latitude: parseFloat(gpsData.captured_latitude),
        captured_longitude: parseFloat(gpsData.captured_longitude),
        is_manual_entry: true
      });
      showFeedback('Manual coordinates verified and spatial offset calculated.');
      loadSurvey();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to verify GPS coordinates.');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Save Field Observations
  const handleSaveObservations = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      setActionLoading(true);
      await surveyService.updateObservations(id, {
        ...obsData,
        observed_area_acres: parseFloat(obsData.observed_area_acres || survey?.recorded_area_acres || 0),
        trees_count: parseInt(obsData.trees_count || 0)
      });
      showFeedback('Field observations updated successfully.');
      loadSurvey();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save field observations.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveObservationsAndNavigate = async (targetTab) => {
    try {
      setActionLoading(true);
      await surveyService.updateObservations(id, {
        ...obsData,
        observed_area_acres: parseFloat(obsData.observed_area_acres || survey?.recorded_area_acres || 0),
        trees_count: parseInt(obsData.trees_count || 0)
      });
      showFeedback('Survey progress saved successfully.');
      if (targetTab) setActiveTab(targetTab);
      loadSurvey();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save observations.');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Upload Evidence Item
  const handleAddEvidence = async (e) => {
    e.preventDefault();
    if (!newEvidence.title) {
      setError('Please enter a title for the evidence.');
      return;
    }
    try {
      setActionLoading(true);
      const payload = {
        ...newEvidence,
        latitude: gpsData.captured_latitude ? parseFloat(gpsData.captured_latitude) : survey?.expected_latitude,
        longitude: gpsData.captured_longitude ? parseFloat(gpsData.captured_longitude) : survey?.expected_longitude
      };
      await surveyService.uploadEvidence(id, payload);
      showFeedback('Evidence media recorded with spatial coordinates.');
      setShowEvidenceModal(false);
      setNewEvidence({
        category: 'Land Boundary',
        title: '',
        description: '',
        file_type: 'photo',
        file_path: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
        latitude: '',
        longitude: ''
      });
      loadSurvey();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record evidence.');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Add Discrepancy
  const handleAddDiscrepancy = async (e) => {
    e.preventDefault();
    if (!newDiscrepancy.description) {
      setError('Please provide a description of the discrepancy.');
      return;
    }
    try {
      setActionLoading(true);
      await surveyService.addDiscrepancy(id, newDiscrepancy);
      showFeedback('Discrepancy logged and predictive delay risk updated.');
      setShowDiscrepancyModal(false);
      setNewDiscrepancy({
        category: 'Boundary mismatch',
        severity: 'MEDIUM',
        description: '',
        remarks: ''
      });
      loadSurvey();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record discrepancy.');
    } finally {
      setActionLoading(false);
    }
  };

  // 7. Request Resurvey
  const handleRequestResurvey = async (e) => {
    e.preventDefault();
    if (!resurveyData.resurvey_reason || !resurveyData.required_action) {
      setError('Please provide the reason and required action for resurvey.');
      return;
    }
    try {
      setActionLoading(true);
      await surveyService.requestResurvey(id, resurveyData);
      showFeedback('Resurvey requested. Survey state transitioned to RESURVEY_REQUIRED.');
      setShowResurveyModal(false);
      loadSurvey();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to request resurvey.');
    } finally {
      setActionLoading(false);
    }
  };

  // 8. Submit Final Survey Report
  const handleSubmitReport = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!reportData.digital_signature_confirmed) {
      setError('You must confirm digital certification before submitting the survey report.');
      return;
    }
    try {
      setActionLoading(true);
      await surveyService.updateObservations(id, {
        ...obsData,
        observed_area_acres: parseFloat(obsData.observed_area_acres || survey?.recorded_area_acres || 0),
        trees_count: parseInt(obsData.trees_count || 0)
      });
      await surveyService.submitSurveyReport(id, {
        digital_signature_confirmed: true,
        certification_statement: reportData.certification_statement,
        final_recommendation: reportData.final_recommendation,
        final_remarks: reportData.final_remarks
      });
      showFeedback('Survey Report digitally signed and successfully submitted to LAO!');
      loadSurvey();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit survey report.');
    } finally {
      setActionLoading(false);
    }
  };

  // 9. LAO / CO Review Action
  const handleReviewAction = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await surveyService.reviewSurveyReport(id, reviewData);
      showFeedback(`Survey report review recorded: ${reviewData.action}`);
      setShowReviewModal(false);
      loadSurvey();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record review decision.');
    } finally {
      setActionLoading(false);
    }
  };

  // Parse Cadastral Polygon coordinates for Leaflet
  const mapPolygonCoords = useMemo(() => {
    if (!survey) return null;
    if (survey.parcel_geometry_geojson) {
      try {
        const parsed = JSON.parse(survey.parcel_geometry_geojson);
        if (parsed.coordinates && parsed.coordinates[0]) {
          return parsed.coordinates[0].map(([lng, lat]) => [lat, lng]);
        }
      } catch (e) {
        console.warn('GeoJSON parsing failed, generating fallback polygon', e);
      }
    }
    // Fallback polygon around expected centroid
    const centerLat = survey.expected_latitude || 20.1228;
    const centerLng = survey.expected_longitude || 85.8335;
    const d = 0.0008;
    return [
      [centerLat - d, centerLng - d],
      [centerLat - d, centerLng + d],
      [centerLat + d, centerLng + d],
      [centerLat + d, centerLng - d]
    ];
  }, [survey]);

  // Calculate Area Deviation Percentage
  const areaDeviationPct = useMemo(() => {
    if (!survey || !obsData.observed_area_acres) return 0;
    const recorded = survey.recorded_area_acres;
    const observed = parseFloat(obsData.observed_area_acres);
    if (!recorded || recorded === 0) return 0;
    return (((observed - recorded) / recorded) * 100).toFixed(2);
  }, [survey, obsData.observed_area_acres]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-govblue-700"></div>
        <p className="text-slate-600 font-semibold text-sm">Loading Survey Field Workspace...</p>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto my-12 shadow-sm space-y-4">
        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-600 border border-rose-100">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Unable to load survey details</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {error || 'Unable to connect to survey records or the requested survey assignment is currently unavailable. Please try again.'}
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={loadSurvey}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-govblue-700 hover:bg-govblue-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
          <Link
            to="/survey/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Status Badge Color Helper
  const getStatusBadge = (st) => {
    const s = st?.toUpperCase();
    if (s === 'COMPLETED') return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    if (s === 'IN_PROGRESS') return 'bg-blue-50 text-blue-700 border-blue-300';
    if (s === 'SCHEDULED') return 'bg-purple-50 text-purple-700 border-purple-300';
    if (s === 'ASSIGNED') return 'bg-amber-50 text-amber-700 border-amber-300';
    if (s === 'RESURVEY_REQUIRED') return 'bg-rose-50 text-rose-700 border-rose-300';
    if (s === 'RETURNED') return 'bg-orange-50 text-orange-700 border-orange-300';
    return 'bg-slate-50 text-slate-700 border-slate-300';
  };

  const getPriorityBadge = (p) => {
    const pr = p?.toUpperCase();
    if (pr === 'URGENT') return 'bg-rose-100 text-rose-800 font-extrabold';
    if (pr === 'HIGH') return 'bg-orange-100 text-orange-800 font-bold';
    return 'bg-slate-100 text-slate-700';
  };

  const isSO = user?.role === 'survey_officer' || user?.role === 'admin';
  const isLAO = user?.role === 'land_acquisition_officer' || user?.role === 'compensation_officer' || user?.role === 'admin';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Workflow Status Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/survey/dashboard')}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-govblue-700 uppercase tracking-wider">
                Survey Execution Workspace
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-mono font-bold text-slate-600">{survey.request_number}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Plot #{survey.plot_number} • Khata #{survey.khata_number}
              </h1>
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusBadge(survey.status)}`}>
                {survey.status.replace(/_/g, ' ')}
              </span>
              <span className={`px-2.5 py-0.5 text-[11px] rounded-md ${getPriorityBadge(survey.priority)}`}>
                {survey.priority} Priority
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              {survey.village_name}, {survey.district} District • Project: <strong className="text-slate-700">{survey.project_name}</strong> • Case: <strong className="text-slate-700">{survey.case_number}</strong>
            </p>
          </div>

          {/* Quick Action Progression Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {survey.status === 'ASSIGNED' && isSO && (
              <button
                onClick={handleAcceptAssignment}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                <Check className="w-4 h-4" /> Accept Assignment
              </button>
            )}

            {survey.status === 'SCHEDULED' && isSO && (
              <button
                onClick={handleStartSurvey}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-govblue-700 hover:bg-govblue-800 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                <Compass className="w-4 h-4" /> Start Field Survey
              </button>
            )}

            {['IN_PROGRESS', 'RESURVEY_REQUIRED', 'RETURNED'].includes(survey.status) && isSO && (
              <button
                onClick={() => setActiveTab('report')}
                className="flex items-center gap-2 px-4 py-2.5 bg-govblue-700 hover:bg-govblue-800 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                <ShieldCheck className="w-4 h-4" /> Sign & Submit Report
              </button>
            )}

            {survey.status === 'COMPLETED' && isLAO && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                <Award className="w-4 h-4" /> LAO / CO Review
              </button>
            )}

            <button
              onClick={loadSurvey}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
              title="Refresh Record"
            >
              <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dynamic Alerts Banner */}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-600"><X className="w-4 h-4" /></button>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-emerald-600"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Operational Delay Risk Warning (if ML detected) */}
        {survey.delay_risk_score > 0.4 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-3 text-xs text-amber-900">
            <Zap className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-extrabold">Predictive Analytics Delay Alert:</span> Risk Score is <strong>{Math.round(survey.delay_risk_score * 100)}% ({survey.delay_risk_level} Risk)</strong>. Estimated timeline impact: <strong>+{survey.predicted_delay_days} days</strong>. Ensure all discrepancies and boundary measurements are strictly documented.
            </div>
          </div>
        )}
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { id: 'overview', label: '1. Survey Information', icon: Info },
          { id: 'dispute', label: '2. Ownership Dispute', icon: AlertTriangle, alert: obsData.has_ownership_dispute },
          { id: 'court', label: '3. Court Case / Legal Dispute', icon: Gavel, alert: obsData.has_court_case },
          { id: 'structure', label: '4. Structure / Project', icon: Building, alert: obsData.has_structure_or_project },
          { id: 'docs', label: '5. Document Verification', icon: FileCheck, badge: survey.document_verifications?.length },
          { id: 'observations', label: '6. Remarks & Observations', icon: FileText },
          { id: 'report', label: '7. Review & Submit to LAO', icon: ShieldCheck },
          { id: 'gps', label: 'GPS Map & Centroid', icon: MapPin, status: survey.gps_verification?.location_status },
          { id: 'evidence', label: 'Media Evidence', icon: Camera, badge: survey.evidence_items?.length },
          { id: 'schedule', label: 'Schedule & Team', icon: Calendar },
          { id: 'discrepancies', label: 'Discrepancies', icon: AlertCircle, badge: survey.discrepancies?.length, alert: survey.discrepancies?.length > 0 },
          { id: 'resurvey', label: 'Resurvey', icon: RefreshCw, badge: survey.resurvey_requests?.length },
          { id: 'audit', label: 'Audit Log', icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-govblue-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-300' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${tab.alert ? 'bg-rose-500 text-white font-extrabold' : isActive ? 'bg-govblue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREA */}

      {/* 1. OVERVIEW & CONTEXT TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Parcel Information Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileSpreadsheet className="w-4 h-4 text-govblue-700" />
                Cadastral Parcel & Ownership Specifications
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Plot / Survey No</div>
                  <div className="font-extrabold text-slate-800 text-sm mt-0.5">{survey.plot_number}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Khata / Khatian No</div>
                  <div className="font-extrabold text-slate-800 text-sm mt-0.5">{survey.khata_number}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Recorded Area</div>
                  <div className="font-extrabold text-slate-800 text-sm mt-0.5">{survey.recorded_area_acres} Acres</div>
                  <div className="text-[10px] text-slate-400">({(survey.recorded_area_acres * 4046.86).toFixed(1)} Sq.m)</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Classification</div>
                  <div className="font-bold text-slate-800 mt-0.5">{survey.land_type}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Landowner</div>
                  <div className="font-bold text-slate-800 mt-0.5">{survey.landowner_name}</div>
                  <div className="text-[10px] text-slate-400">{survey.landowner_phone || 'Phone not on record'}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Village / Revenue Circle</div>
                  <div className="font-bold text-slate-800 mt-0.5">{survey.village_name}</div>
                  <div className="text-[10px] text-slate-400">{survey.district} District</div>
                </div>
              </div>

              {/* LAO Instructions */}
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-slate-700 space-y-1">
                <div className="font-bold text-govblue-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-govblue-700" />
                  Survey Mandate & LAO Directives
                </div>
                <p className="leading-relaxed text-slate-600">
                  {survey.instructions || 'Conduct physical boundary demarcation, verify RoR vs ground tenancy, record all tree & structure assets, and capture GPS reference coordinates.'}
                </p>
                <div className="text-[11px] text-slate-400 pt-1">
                  Purpose: <strong>{survey.purpose}</strong> • Issued by: <strong>{survey.lao_name || 'Land Acquisition Officer'}</strong>
                </div>
              </div>

              {/* Recorded vs Observed Area Physical Verification */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
                <div className="font-extrabold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-govblue-700" />
                    Physical Cadastral Area Verification
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    Math.abs(areaDeviationPct) > 5 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    Variance: {areaDeviationPct > 0 ? `+${areaDeviationPct}` : areaDeviationPct}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Recorded Revenue Area</span>
                    <span className="font-black text-slate-800 text-sm">{survey.recorded_area_acres} Acres</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Observed Field Area</span>
                    <span className="font-black text-govblue-900 text-sm">{obsData.observed_area_acres || survey.recorded_area_acres} Acres</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Boundary Demarcation</span>
                    <span className="font-bold text-slate-800 text-xs truncate block">{obsData.boundary_status}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab('dispute')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-govblue-700 hover:bg-govblue-800 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    <span>Proceed to Step 2: Ownership Dispute</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Current Summary Progress Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Workflow Readiness Checklist
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className={`p-3 rounded-xl border flex items-center gap-3 ${survey.document_verifications?.length > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  {survey.document_verifications?.length > 0 ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Clock className="w-5 h-5 text-slate-400" />}
                  <div>
                    <div className="font-bold">Documents Cross-Verified</div>
                    <div className="text-[11px] opacity-80">{survey.document_verifications?.length || 0} documents recorded</div>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center gap-3 ${survey.gps_verification ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  {survey.gps_verification ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Clock className="w-5 h-5 text-slate-400" />}
                  <div>
                    <div className="font-bold">GPS Proximity Checked</div>
                    <div className="text-[11px] opacity-80">{survey.gps_verification ? survey.gps_verification.location_status : 'Pending field capture'}</div>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center gap-3 ${survey.field_observation ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  {survey.field_observation ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Clock className="w-5 h-5 text-slate-400" />}
                  <div>
                    <div className="font-bold">Field Observations Recorded</div>
                    <div className="text-[11px] opacity-80">{survey.field_observation ? `${survey.field_observation.observed_area_acres} Acres observed` : 'Pending field inspection'}</div>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center gap-3 ${survey.evidence_items?.length > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  {survey.evidence_items?.length > 0 ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Clock className="w-5 h-5 text-slate-400" />}
                  <div>
                    <div className="font-bold">Photo Evidence Uploaded</div>
                    <div className="text-[11px] opacity-80">{survey.evidence_items?.length || 0} media assets tagged</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Officers & Key Timeline Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
              <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                Assigned Personnel
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-govblue-100 text-govblue-800 flex items-center justify-center font-bold text-xs">
                    SO
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{survey.assigned_so_name || 'Unassigned'}</div>
                    <div className="text-[11px] text-slate-400">Survey Officer (In-Charge)</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                    LAO
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{survey.lao_name || 'Competent Authority'}</div>
                    <div className="text-[11px] text-slate-400">Land Acquisition Officer</div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Assignment Date:</span>
                  <span className="font-semibold">{survey.assignment_date ? new Date(survey.assignment_date).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Scheduled Date:</span>
                  <span className="font-semibold">{survey.scheduled_date || 'Pending'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Survey Deadline:</span>
                  <span className="font-semibold text-rose-600">{survey.deadline || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* AI Risk Score Summary Widget */}
            <div className="bg-gradient-to-br from-slate-900 to-govblue-950 text-white rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-300">
                  Predictive ML Analytics
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${survey.delay_risk_score > 0.6 ? 'bg-rose-500' : survey.delay_risk_score > 0.3 ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                  {survey.delay_risk_level} Risk
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black">{Math.round((survey.delay_risk_score || 0) * 100)}%</span>
                <span className="text-xs text-slate-300">Delay Likelihood</span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Calculated based on cadastral parcel complexity, discrepancy history, and area variance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. OWNERSHIP DISPUTE TAB */}
      {activeTab === 'dispute' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-govblue-700 text-xs font-bold uppercase tracking-wider">
              <span>Step 2 of 7</span>
              <span>•</span>
              <span>Land Title & Conflict Verification</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
              <Scale className="w-5 h-5 text-govblue-700" />
              Ownership Dispute Verification
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify whether any competing ownership claims, family inheritance disputes, or boundary conflicts exist on Plot #{survey.plot_number}.
            </p>
          </div>

          {/* Primary Question */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <label className="block text-sm font-extrabold text-slate-900">
              Is there any ownership dispute for this land?
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setObsData({ ...obsData, has_ownership_dispute: true })}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition border ${
                  obsData.has_ownership_dispute
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-200'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="w-4 h-4" /> YES, Dispute Exists
              </button>
              <button
                type="button"
                onClick={() => setObsData({ ...obsData, has_ownership_dispute: false })}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition border ${
                  !obsData.has_ownership_dispute
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-200'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> NO Disputes (Clear Title)
              </button>
            </div>
          </div>

          {/* Dynamic Dispute Details (If YES) */}
          {obsData.has_ownership_dispute ? (
            <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-5">
              <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm border-b border-rose-200 pb-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Ownership Dispute Particulars & Documentation
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Nature of Dispute *</label>
                  <select
                    value={obsData.dispute_nature || 'Family inheritance / partition'}
                    onChange={(e) => setObsData({ ...obsData, dispute_nature: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-xs"
                  >
                    <option value="Family inheritance / partition">Family inheritance / partition</option>
                    <option value="Boundary conflict with neighbor">Boundary conflict with neighbor</option>
                    <option value="Co-sharer claim without partition">Co-sharer claim without partition</option>
                    <option value="Illegal encroachment claim">Illegal encroachment claim</option>
                    <option value="Tenant / sharecropper claim">Tenant / sharecropper claim</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Parties Involved in Dispute *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Rout vs Suresh Rout & Brothers"
                    value={obsData.dispute_parties}
                    onChange={(e) => setObsData({ ...obsData, dispute_parties: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="block font-bold text-slate-800">Detailed Description of Dispute *</label>
                <textarea
                  rows={3}
                  placeholder="Describe the nature of disagreement, claimed portions, documented evidence presented, or oral objections..."
                  value={obsData.dispute_details}
                  onChange={(e) => setObsData({ ...obsData, dispute_details: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="block font-bold text-slate-800">Survey Officer Remarks / Field Observations</label>
                <textarea
                  rows={2}
                  placeholder="Record officer remarks, mediator statements, or physical boundary marks affected by the dispute..."
                  value={obsData.dispute_remarks}
                  onChange={(e) => setObsData({ ...obsData, dispute_remarks: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 flex items-center gap-3 text-xs text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-extrabold block">Clear Ownership Verified</span>
                <span>No ownership dispute, family conflict, or adverse possession reported for Plot #{survey.plot_number}. Proceed cleanly.</span>
              </div>
            </div>
          )}

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Survey Info
            </button>

            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleSaveObservationsAndNavigate('court')}
              className="flex items-center gap-2 px-6 py-2.5 bg-govblue-700 hover:bg-govblue-800 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <span>Save & Continue to Court Case</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. COURT CASE / LEGAL DISPUTE TAB */}
      {activeTab === 'court' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-govblue-700 text-xs font-bold uppercase tracking-wider">
              <span>Step 3 of 7</span>
              <span>•</span>
              <span>Judicial & Statutory Injunction Check</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
              <Gavel className="w-5 h-5 text-govblue-700" />
              Court Case & Legal Dispute Verification
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify if any litigation, injunction, stay order, or revenue appeal is pending in civil court or land tribunal.
            </p>
          </div>

          {/* Primary Question */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <label className="block text-sm font-extrabold text-slate-900">
              Is there any ongoing court case or legal dispute related to this land?
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setObsData({ ...obsData, has_court_case: true })}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition border ${
                  obsData.has_court_case
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-200'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Gavel className="w-4 h-4" /> YES, Legal Dispute / Case Exists
              </button>
              <button
                type="button"
                onClick={() => setObsData({ ...obsData, has_court_case: false })}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition border ${
                  !obsData.has_court_case
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-200'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> NO Legal Disputes (Clean Record)
              </button>
            </div>
          </div>

          {/* Dynamic Legal Details (If YES) */}
          {obsData.has_court_case ? (
            <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-5">
              <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm border-b border-rose-200 pb-2">
                <Gavel className="w-4 h-4 text-rose-600" />
                Judicial Case Particulars & Injunction Status
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Court Case Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. CS No. 104/2023 or WP(C) 4120/2024"
                    value={obsData.court_case_number}
                    onChange={(e) => setObsData({ ...obsData, court_case_number: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Court / Authority Name *</label>
                  <select
                    value={obsData.court_name || 'Civil Court (Senior Division)'}
                    onChange={(e) => setObsData({ ...obsData, court_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs font-semibold"
                  >
                    <option value="Civil Court (Senior Division)">Civil Court (Senior Division)</option>
                    <option value="Civil Court (Junior Division)">Civil Court (Junior Division)</option>
                    <option value="High Court of Orissa">High Court of Orissa</option>
                    <option value="Revenue Court / Sub-Collector">Revenue Court / Sub-Collector</option>
                    <option value="Land Acquisition Tribunal">Land Acquisition Tribunal (LARR)</option>
                    <option value="Tehsildar Mutation Court">Tehsildar Mutation Court</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Stay Order / Injunction Status *</label>
                  <select
                    value={obsData.court_case_status || 'Pending Hearing'}
                    onChange={(e) => setObsData({ ...obsData, court_case_status: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs font-bold text-rose-700"
                  >
                    <option value="None">None (No Stay)</option>
                    <option value="Interim Stay">Interim Stay on Possession</option>
                    <option value="Injunction">Injunction Granted</option>
                    <option value="Pending Hearing">Pending Hearing</option>
                    <option value="Decided">Decided / Disposed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Parties Involved (Petitioner vs Respondent) *</label>
                  <input
                    type="text"
                    placeholder="e.g. Petitioner: Shri B. K. Das vs Respondent: State of Odisha & Others"
                    value={obsData.court_parties}
                    onChange={(e) => setObsData({ ...obsData, court_parties: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Case Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Challenge against survey demarcation and partition deed validity"
                    value={obsData.court_case_description}
                    onChange={(e) => setObsData({ ...obsData, court_case_description: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="block font-bold text-slate-800">Survey Officer Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Record whether physical acquisition can proceed or if stay order prohibits possession..."
                  value={obsData.court_case_remarks}
                  onChange={(e) => setObsData({ ...obsData, court_case_remarks: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 flex items-center gap-3 text-xs text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-extrabold block">No Ongoing Litigation</span>
                <span>No court cases, injunctions, or stay orders registered against Plot #{survey.plot_number}. Proceed cleanly.</span>
              </div>
            </div>
          )}

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('dispute')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Ownership Dispute
            </button>

            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleSaveObservationsAndNavigate('structure')}
              className="flex items-center gap-2 px-6 py-2.5 bg-govblue-700 hover:bg-govblue-800 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <span>Save & Continue to Structure / Project</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. STRUCTURE / PROJECT ON LAND TAB */}
      {activeTab === 'structure' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-govblue-700 text-xs font-bold uppercase tracking-wider">
              <span>Step 4 of 7</span>
              <span>•</span>
              <span>Built Assets & Valuation Enumeration</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
              <Building className="w-5 h-5 text-govblue-700" />
              Existing Structure & Project Verification
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify whether any buildings, wells, walls, religious shrines, or ongoing projects exist on Plot #{survey.plot_number}.
            </p>
          </div>

          {/* Primary Question */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <label className="block text-sm font-extrabold text-slate-900">
              Is there any existing structure or project on the land?
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setObsData({ ...obsData, has_structure_or_project: true })}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition border ${
                  obsData.has_structure_or_project
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Building className="w-4 h-4" /> YES, Structure / Project Exists
              </button>
              <button
                type="button"
                onClick={() => setObsData({ ...obsData, has_structure_or_project: false })}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition border ${
                  !obsData.has_structure_or_project
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-200'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> NO Structures (Vacant Land)
              </button>
            </div>
          </div>

          {/* Dynamic Structure Details (If YES) */}
          {obsData.has_structure_or_project ? (
            <div className="p-6 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-5">
              <div className="flex items-center gap-2 text-govblue-900 font-extrabold text-sm border-b border-blue-200 pb-2">
                <Building className="w-4 h-4 text-govblue-700" />
                Structure Specifications & Valuation Impact
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Structure Type *</label>
                  <select
                    value={obsData.structure_type || 'Residential house'}
                    onChange={(e) => setObsData({ ...obsData, structure_type: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-govblue-500 font-semibold text-xs"
                  >
                    <option value="Residential house">Residential house</option>
                    <option value="Commercial building">Commercial building</option>
                    <option value="Boundary wall">Boundary wall</option>
                    <option value="Well / Borewell">Well / Borewell</option>
                    <option value="Religious structure">Religious structure</option>
                    <option value="Pond / Water body">Pond / Water body</option>
                    <option value="Shed / Outhouse">Shed / Outhouse</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Location on Parcel *</label>
                  <input
                    type="text"
                    placeholder="e.g. Center, North-East corner, Western boundary"
                    value={obsData.structure_location}
                    onChange={(e) => setObsData({ ...obsData, structure_location: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-govblue-500 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="block font-bold text-slate-800">Description / Specifications of Structure *</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Single-story RCC structure measuring 35ft x 28ft, plaster finish, electrified, borewell pump adjacent..."
                  value={obsData.structure_description}
                  onChange={(e) => setObsData({ ...obsData, structure_description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-govblue-500 text-xs"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="block font-bold text-slate-800">Impact on Acquisition / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Requires structural valuation by PWD Executive Engineer under Section 29 of RFCTLARR Act..."
                  value={obsData.structure_remarks}
                  onChange={(e) => setObsData({ ...obsData, structure_remarks: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-govblue-500 text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 flex items-center gap-3 text-xs text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-extrabold block">Vacant Land Verified</span>
                <span>No buildings, permanent structures, wells, or ongoing projects identified on this parcel. Proceed cleanly.</span>
              </div>
            </div>
          )}

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('court')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Court Case
            </button>

            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleSaveObservationsAndNavigate('docs')}
              className="flex items-center gap-2 px-6 py-2.5 bg-govblue-700 hover:bg-govblue-800 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <span>Save & Continue to Document Verification</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 5. DOCUMENT VERIFICATION TAB */}
      {activeTab === 'docs' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-govblue-700 text-xs font-bold uppercase tracking-wider">
                <span>Step 5 of 7</span>
                <span>•</span>
                <span>Statutory Revenue Records</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-govblue-700" />
                Document Verification & Cross-Examination
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify physical land records against official District Revenue & Settlement archives. Select status and record remarks for each document.
              </p>
            </div>

            <button
              onClick={handleSaveDocs}
              disabled={actionLoading}
              className="px-4 py-2 bg-govblue-700 hover:bg-govblue-800 text-white text-xs font-bold rounded-xl shadow-sm transition self-start sm:self-auto"
            >
              Save Verifications
            </button>
          </div>

          <div className="space-y-4">
            {docItems.map((doc, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold text-govblue-700 uppercase">{doc.doc_type}</span>
                    <h4 className="text-sm font-bold text-slate-800">{doc.doc_title}</h4>
                  </div>

                  {/* Verification Status Toggle: VERIFIED, MISSING, MISMATCHED, UNAVAILABLE */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 text-xs font-bold">
                    {[
                      { key: 'VERIFIED', label: 'VERIFIED', activeClass: 'bg-emerald-600 text-white shadow-sm' },
                      { key: 'MISSING', label: 'MISSING', activeClass: 'bg-amber-600 text-white shadow-sm' },
                      { key: 'MISMATCHED', label: 'MISMATCHED', activeClass: 'bg-rose-600 text-white shadow-sm' },
                      { key: 'UNAVAILABLE', label: 'UNAVAILABLE', activeClass: 'bg-slate-700 text-white shadow-sm' }
                    ].map(({ key, label, activeClass }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          const updated = [...docItems];
                          updated[idx].verification_status = key;
                          setDocItems(updated);
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] transition ${
                          doc.verification_status === key || (key === 'MISMATCHED' && doc.verification_status === 'MISMATCH')
                            ? activeClass
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mismatch Details (if any)</label>
                    <input
                      type="text"
                      placeholder="e.g. Spelling difference in landowner surname"
                      value={doc.mismatch_details}
                      onChange={(e) => {
                        const updated = [...docItems];
                        updated[idx].mismatch_details = e.target.value;
                        setDocItems(updated);
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Verification Remarks *</label>
                    <input
                      type="text"
                      placeholder="e.g. Original Patta verified with Tehsildar seal"
                      value={doc.remarks}
                      onChange={(e) => {
                        const updated = [...docItems];
                        updated[idx].remarks = e.target.value;
                        setDocItems(updated);
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('structure')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Structure / Project
            </button>

            <button
              type="button"
              onClick={() => handleSaveDocsAndNavigate('observations')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-govblue-700 hover:bg-govblue-800 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              <span>Save & Continue to Remarks & Observations</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. SCHEDULING & TEAM TAB */}
      {activeTab === 'schedule' && (
        <form onSubmit={handleSaveSchedule} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-govblue-700" />
              Physical Field Survey Scheduling & Logistics
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify date, time slot, field team composition, and surveying instrumentation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Scheduled Date *</label>
              <input
                type="date"
                required
                value={schedData.scheduled_date}
                onChange={(e) => setSchedData({ ...schedData, scheduled_date: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Time Slot</label>
              <select
                value={schedData.time_slot}
                onChange={(e) => setSchedData({ ...schedData, time_slot: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white font-medium"
              >
                <option value="Morning (09:00 AM - 01:00 PM)">Morning (09:00 AM - 01:00 PM)</option>
                <option value="Afternoon (02:00 PM - 05:30 PM)">Afternoon (02:00 PM - 05:30 PM)</option>
                <option value="Full Day (09:00 AM - 05:00 PM)">Full Day (09:00 AM - 05:00 PM)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Estimated Duration (Hours)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={schedData.estimated_duration_hours}
                onChange={(e) => setSchedData({ ...schedData, estimated_duration_hours: parseFloat(e.target.value) })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Surveying Instruments / Equipment</label>
              <input
                type="text"
                value={schedData.equipment_used}
                onChange={(e) => setSchedData({ ...schedData, equipment_used: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white font-medium"
                placeholder="e.g. DGPS Trimble R10, Total Station, Tape"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Field Team Members</label>
              <textarea
                rows={2}
                value={schedData.field_team_members}
                onChange={(e) => setSchedData({ ...schedData, field_team_members: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white font-medium"
                placeholder="List SO, Surveyors, Amin, and local Revenue Officials"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Special Field Directives / Instructions</label>
              <textarea
                rows={2}
                value={schedData.field_instructions}
                onChange={(e) => setSchedData({ ...schedData, field_instructions: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white font-medium"
                placeholder="Any safety notes, landowner notice confirmations, or village liaison instructions"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2.5 bg-govblue-700 hover:bg-govblue-800 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              Update Schedule Details
            </button>
          </div>
        </form>
      )}

      {/* 4. GPS & SPATIAL MAP TAB */}
      {activeTab === 'gps' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live GPS Capture & Manual Verification Panel */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-govblue-700" />
                Live GPS Verification
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Compare actual field coordinates against Cadastral Parcel centroid.
              </p>
            </div>

            {/* One-Click Geolocation Capture */}
            <div className="p-4 bg-govblue-50/70 rounded-xl border border-govblue-100 space-y-3 text-xs">
              <div className="font-bold text-govblue-950">Field Device Geolocation</div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Click below while on-site to query device GPS hardware sensors and calculate real-time Haversine distance offset.
              </p>

              <button
                type="button"
                onClick={handleCaptureLiveGps}
                disabled={gpsCapturing || actionLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2"
              >
                <Compass className={`w-4 h-4 ${gpsCapturing ? 'animate-spin' : ''}`} />
                {gpsCapturing ? 'Acquiring Satellite Fix...' : 'Capture Device GPS Fix'}
              </button>

              {gpsError && (
                <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  {gpsError}
                </div>
              )}
            </div>

            {/* Coordinate Status Results */}
            {survey.gps_verification && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Proximity Result:</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                    survey.gps_verification.location_status === 'LOCATION VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : survey.gps_verification.location_status === 'NEAR EXPECTED LOCATION'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {survey.gps_verification.location_status}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Distance from Cadastral:</span>
                  <span className="font-bold text-slate-800">{survey.gps_verification.distance_from_expected_meters?.toFixed(1) || 0} meters</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Captured At:</span>
                  <span className="font-medium text-slate-700">{new Date(survey.gps_verification.captured_at).toLocaleTimeString()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Entry Mode:</span>
                  <span className="font-semibold text-slate-700">{survey.gps_verification.is_manual_entry ? 'Manual / Total Station' : 'Device GPS Sensor'}</span>
                </div>
              </div>
            )}

            {/* Manual Coordinate Form */}
            <form onSubmit={handleManualGpsSubmit} className="space-y-3 pt-2 border-t border-slate-100 text-xs">
              <div className="font-bold text-slate-800">Manual / DGPS Station Entry</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Latitude (°N)</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="20.123456"
                    value={gpsData.captured_latitude}
                    onChange={(e) => setGpsData({ ...gpsData, captured_latitude: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Longitude (°E)</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="85.834123"
                    value={gpsData.captured_longitude}
                    onChange={(e) => setGpsData({ ...gpsData, captured_longitude: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-sm transition"
              >
                Validate Manual Coordinates
              </button>
            </form>
          </div>

          {/* Interactive Leaflet Map Display */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-govblue-700" />
                Cadastral Parcel Boundary & Field Points
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-600 rounded-sm"></span>
                  <span>Cadastral Boundary</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-emerald-600 rounded-full"></span>
                  <span>Field Fix</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 flex-1 min-h-[420px]">
              <MapContainer
                center={[survey.expected_latitude || 20.1228, survey.expected_longitude || 85.8335]}
                zoom={16}
                style={{ height: '100%', minHeight: '420px', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Cadastral Polygon */}
                {mapPolygonCoords && (
                  <Polygon
                    positions={mapPolygonCoords}
                    pathOptions={{
                      color: '#1E3A8A',
                      fillColor: '#3B82F6',
                      fillOpacity: 0.35,
                      weight: 3
                    }}
                  >
                    <Tooltip sticky>
                      <div className="text-xs font-bold">
                        Plot #{survey.plot_number} • {survey.recorded_area_acres} Acres
                      </div>
                    </Tooltip>
                  </Polygon>
                )}

                {/* Expected Cadastral Centroid Marker */}
                {survey.expected_latitude && survey.expected_longitude && (
                  <Marker
                    position={[survey.expected_latitude, survey.expected_longitude]}
                    icon={expectedIcon}
                  >
                    <Popup>
                      <div className="text-xs">
                        <strong>Cadastral Centroid</strong>
                        <div>Plot #{survey.plot_number} ({survey.village_name})</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {survey.expected_latitude.toFixed(5)}, {survey.expected_longitude.toFixed(5)}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Captured GPS Field Marker */}
                {gpsData.captured_latitude && gpsData.captured_longitude && (
                  <Marker
                    position={[parseFloat(gpsData.captured_latitude), parseFloat(gpsData.captured_longitude)]}
                    icon={fieldGpsIcon}
                  >
                    <Popup>
                      <div className="text-xs">
                        <strong className="text-emerald-700">Field Survey GPS Fix</strong>
                        <div>Recorded by {survey.assigned_so_name || 'Survey Officer'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {parseFloat(gpsData.captured_latitude).toFixed(5)}, {parseFloat(gpsData.captured_longitude).toFixed(5)}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* 6. FIELD OBSERVATIONS & REMARKS TAB */}
      {activeTab === 'observations' && (
        <form onSubmit={handleSaveObservations} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-govblue-700 text-xs font-bold uppercase tracking-wider">
                <span>Step 6 of 7</span>
                <span>•</span>
                <span>Physical Field Verification</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                <FileText className="w-5 h-5 text-govblue-700" />
                Remarks & Physical Field Observations
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Record actual boundary status, ground land use, observed area, tree count, and physical verification remarks.
              </p>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-govblue-700 hover:bg-govblue-800 text-white text-xs font-bold rounded-xl shadow-sm transition self-start sm:self-auto"
            >
              Save Observations
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            {/* Area & Land Use */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                <Wheat className="w-4 h-4 text-amber-600" /> Land Character & Dimension
              </h4>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Observed Area (Acres) *</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={obsData.observed_area_acres}
                  onChange={(e) => setObsData({ ...obsData, observed_area_acres: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white font-bold"
                />
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="text-slate-400">Recorded: {survey.recorded_area_acres} Ac</span>
                  <span className={`font-bold ${Math.abs(areaDeviationPct) > 5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    Variance: {areaDeviationPct > 0 ? `+${areaDeviationPct}` : areaDeviationPct}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Actual Ground Land Use</label>
                <select
                  value={obsData.land_use}
                  onChange={(e) => setObsData({ ...obsData, land_use: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                >
                  <option value="Agricultural">Agricultural</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Barren">Barren</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Mixed">Mixed</option>
                  <option value="Forest">Forest</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Standing Crops (if any)</label>
                <input
                  type="text"
                  placeholder="e.g. Paddy, Sugarcane, Vegetables"
                  value={obsData.crop_type}
                  onChange={(e) => setObsData({ ...obsData, crop_type: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="font-semibold text-slate-700">Irrigation Facility Available</span>
                <input
                  type="checkbox"
                  checked={obsData.irrigation_available}
                  onChange={(e) => setObsData({ ...obsData, irrigation_available: e.target.checked })}
                  className="w-4 h-4 rounded text-govblue-700"
                />
              </div>
            </div>

            {/* Structures & Assets */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" /> Structures & Trees Count
              </h4>

              <div className="space-y-2">
                {[
                  { key: 'has_house', label: 'Residential House / Hut' },
                  { key: 'has_building', label: 'Commercial / Pucca Building' },
                  { key: 'has_boundary_wall', label: 'Masonry Boundary Wall / Fence' },
                  { key: 'has_well', label: 'Open Well / Borewell' },
                  { key: 'has_pond', label: 'Water Body / Farm Pond' },
                  { key: 'has_electrical_infra', label: 'HT / LT Electrical Lines / Poles' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center justify-between text-slate-700 cursor-pointer hover:bg-white p-1 rounded">
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={obsData[key]}
                      onChange={(e) => setObsData({ ...obsData, [key]: e.target.checked })}
                      className="w-4 h-4 rounded text-govblue-700"
                    />
                  </label>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200">
                <label className="block font-semibold text-slate-600 mb-1">Total Trees Count</label>
                <input
                  type="number"
                  min="0"
                  value={obsData.trees_count}
                  onChange={(e) => setObsData({ ...obsData, trees_count: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Other Assets Specification</label>
                <input
                  type="text"
                  placeholder="e.g. Shed dimensions, tree species"
                  value={obsData.other_structures}
                  onChange={(e) => setObsData({ ...obsData, other_structures: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                />
              </div>
            </div>

            {/* Occupancy & Boundary Verification */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-600" /> Occupancy & Demarcation
              </h4>

              <div className="space-y-2">
                <label className="flex items-center justify-between text-slate-700 cursor-pointer">
                  <span>Landowner Present at Survey</span>
                  <input
                    type="checkbox"
                    checked={obsData.landowner_present}
                    onChange={(e) => setObsData({ ...obsData, landowner_present: e.target.checked })}
                    className="w-4 h-4 rounded text-govblue-700"
                  />
                </label>

                <label className="flex items-center justify-between text-slate-700 cursor-pointer">
                  <span>Actual Occupant Present</span>
                  <input
                    type="checkbox"
                    checked={obsData.occupant_present}
                    onChange={(e) => setObsData({ ...obsData, occupant_present: e.target.checked })}
                    className="w-4 h-4 rounded text-govblue-700"
                  />
                </label>

                <label className="flex items-center justify-between text-slate-700 cursor-pointer">
                  <span>Tenant / Sharecropper Present</span>
                  <input
                    type="checkbox"
                    checked={obsData.tenant_present}
                    onChange={(e) => setObsData({ ...obsData, tenant_present: e.target.checked })}
                    className="w-4 h-4 rounded text-govblue-700"
                  />
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Boundary Ground Status *</label>
                <select
                  value={obsData.boundary_status}
                  onChange={(e) => setObsData({ ...obsData, boundary_status: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                >
                  <option value="Boundary matches records">Boundary matches records</option>
                  <option value="Encroachment detected">Encroachment detected</option>
                  <option value="Boundary overlap with adjacent plot">Boundary overlap with adjacent plot</option>
                  <option value="Disputed boundary">Disputed boundary</option>
                  <option value="Unclear / Submerged">Unclear / Submerged</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Survey Officer Field Verification Remarks</label>
                <textarea
                  rows={2}
                  value={obsData.occupancy_remarks}
                  onChange={(e) => setObsData({ ...obsData, occupancy_remarks: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                  placeholder="Record identity checks, ground demarcation conditions, and neighbour statements"
                />
              </div>
            </div>
          </div>

          {/* Live GPS Verification Quick Status */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-govblue-100 text-govblue-800 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-800 block">Spatial Demarcation & GPS Status</span>
                <span className="text-[11px] text-slate-500">
                  {gpsData.captured_latitude ? `Fix: ${gpsData.captured_latitude}, ${gpsData.captured_longitude} (${survey.gps_verification?.location_status || 'Verified'})` : 'No live coordinates captured yet'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCaptureLiveGps}
              disabled={gpsCapturing}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-govblue-700 hover:bg-govblue-800 text-white rounded-lg text-xs font-bold transition shrink-0"
            >
              <Compass className={`w-3.5 h-3.5 ${gpsCapturing ? 'animate-spin' : ''}`} />
              {gpsCapturing ? 'Capturing Fix...' : 'Capture GPS Coordinates'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('docs')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Document Verification
            </button>

            <button
              type="button"
              onClick={() => handleSaveObservationsAndNavigate('report')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-govblue-700 hover:bg-govblue-800 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <span>Save & Review Survey Report (Step 7)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* 6. MEDIA EVIDENCE GALLERY TAB */}
      {activeTab === 'evidence' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-govblue-700" />
                Geo-Tagged Photo & Video Evidence Gallery
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical on-site photographs capturing boundaries, structures, and crop assets.
              </p>
            </div>

            <button
              onClick={() => setShowEvidenceModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-govblue-700 hover:bg-govblue-800 text-white text-xs font-bold rounded-xl shadow-sm transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Add Evidence Media
            </button>
          </div>

          {/* Evidence Grid */}
          {survey.evidence_items && survey.evidence_items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {survey.evidence_items.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-sm hover:shadow-md transition">
                  <div className="h-44 bg-slate-200 relative overflow-hidden flex items-center justify-center">
                    <img
                      src={item.file_path.startsWith('http') ? item.file_path : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80'}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 backdrop-blur-md text-white font-bold text-[10px] rounded-md">
                      {item.category}
                    </span>
                    {item.latitude && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-950/80 text-emerald-300 font-mono text-[9px] rounded">
                        📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                      </span>
                    )}
                  </div>

                  <div className="p-3 text-xs space-y-1">
                    <h4 className="font-bold text-slate-800 truncate">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{item.description || 'No additional description provided.'}</p>
                    <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200/60">
                      <span>By: {item.uploaded_by_name || 'Surveyor'}</span>
                      <span>{new Date(item.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <div className="font-bold text-slate-700 text-xs">No Evidence Uploaded Yet</div>
              <p className="text-[11px] text-slate-400 mt-1">Upload boundary pegs, standing structures, or crop pictures.</p>
              <button
                onClick={() => setShowEvidenceModal(true)}
                className="mt-3 px-3.5 py-1.5 bg-govblue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Upload Media
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. DISCREPANCIES TRACKER TAB */}
      {activeTab === 'discrepancies' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Discrepancy Identification & Risk Flagging
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Log area mismatches, boundary overlaps, or unrecorded structures to trigger ML delay re-computation.
              </p>
            </div>

            <button
              onClick={() => setShowDiscrepancyModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Log New Discrepancy
            </button>
          </div>

          {survey.discrepancies && survey.discrepancies.length > 0 ? (
            <div className="space-y-3">
              {survey.discrepancies.map((disc) => (
                <div
                  key={disc.id}
                  className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        disc.severity === 'CRITICAL' ? 'bg-rose-600 text-white' :
                        disc.severity === 'HIGH' ? 'bg-orange-500 text-white' :
                        disc.severity === 'MEDIUM' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {disc.severity} SEVERITY
                      </span>
                      <span className="font-bold text-slate-800">{disc.category}</span>
                    </div>

                    <p className="text-slate-700 leading-relaxed font-medium">{disc.description}</p>
                    {disc.remarks && (
                      <p className="text-[11px] text-slate-500 italic">Remarks: {disc.remarks}</p>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 shrink-0 self-end sm:self-auto">
                    Logged: {new Date(disc.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-emerald-50/50 rounded-xl border border-emerald-200 text-emerald-900">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <div className="font-bold text-xs">No Discrepancies Flagged</div>
              <p className="text-[11px] text-emerald-700 mt-0.5">Field measurements align with revenue records.</p>
            </div>
          )}
        </div>
      )}

      {/* 8. REMARKS & RESURVEY WORKFLOW TAB */}
      {activeTab === 'resurvey' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-govblue-700" />
                Resurvey Request Escalation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Trigger formal resurvey if boundary distortion, heavy encroachment, or title disputes prevent normal completion.
              </p>
            </div>

            <button
              onClick={() => setShowResurveyModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition self-start sm:self-auto"
            >
              <AlertCircle className="w-4 h-4" /> Request Joint Resurvey
            </button>
          </div>

          {/* Previous Resurvey History */}
          {survey.resurvey_requests && survey.resurvey_requests.length > 0 ? (
            <div className="space-y-4">
              {survey.resurvey_requests.map((req) => (
                <div key={req.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">Resurvey Request #{req.id}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-extrabold">
                      {req.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-semibold">Reason: </span>
                      <span className="font-bold text-slate-700">{req.resurvey_reason}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Priority: </span>
                      <span className="font-bold text-rose-700">{req.priority}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 font-semibold">Required Action: </span>
                      <span className="text-slate-700">{req.required_action}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 pt-1 border-t border-amber-200/50 flex justify-between">
                    <span>Requested by: {req.requested_by_name || 'Survey Officer'}</span>
                    <span>{new Date(req.requested_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs">
              <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="font-bold">No Resurvey Requested</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Normal single-phase survey procedure is underway.</p>
            </div>
          )}
        </div>
      )}

      {/* 7. DIGITAL REPORT & SIGNATURE SUBMISSION TAB */}
      {activeTab === 'report' && (
        <form onSubmit={handleSubmitReport} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-govblue-700 text-xs font-bold uppercase tracking-wider">
              <span>Step 7 of 7</span>
              <span>•</span>
              <span>Final Comprehensive Review & Statutory Dispatch</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-govblue-700" />
              Review Survey Report & Submit to LAO
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review compiled cadastral findings, ownership disputes, court cases, structural assets, and statutory verifications before digital certification.
            </p>
          </div>

          {/* Submission Status Alert (if already submitted or completed) */}
          {['SUBMITTED', 'UNDER_REVIEW', 'COMPLETED', 'APPROVED'].includes(survey.status) && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-extrabold block">Survey Report Official Status: {survey.status.replace(/_/g, ' ')}</span>
                <span>This survey report has been digitally signed and submitted to the Land Acquisition Officer (LAO).</span>
              </div>
            </div>
          )}

          {/* COMPREHENSIVE REVIEW SUMMARY CARDS (Steps 1 to 6) */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-govblue-700" /> Compiled Survey Field Verification Summary
            </h4>

            {/* Card 1: Cadastral Specifications & Area */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-govblue-700" /> 1. Cadastral Parcel & Area Specifications
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  Math.abs(areaDeviationPct) > 5 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  Variance: {areaDeviationPct > 0 ? `+${areaDeviationPct}` : areaDeviationPct}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Plot / Khata</span>
                  <span className="font-bold text-slate-800">Plot #{survey.plot_number} • Khata #{survey.khata_number}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Location</span>
                  <span className="font-bold text-slate-800">{survey.village_name}, {survey.district}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Recorded Revenue Area</span>
                  <span className="font-bold text-slate-800">{survey.recorded_area_acres} Acres</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Observed Ground Area</span>
                  <span className="font-bold text-govblue-900">{obsData.observed_area_acres || survey.recorded_area_acres} Acres</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Boundary Demarcation</span>
                  <span className="font-bold text-slate-800">{obsData.boundary_status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Land Use</span>
                  <span className="font-bold text-slate-800">{obsData.land_use}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Trees Count</span>
                  <span className="font-bold text-slate-800">{obsData.trees_count || 0} Trees</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Landowner</span>
                  <span className="font-bold text-slate-800">{survey.landowner_name}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Ownership Dispute Verification */}
            <div className={`p-5 rounded-2xl border space-y-3 ${obsData.has_ownership_dispute ? 'bg-rose-50/50 border-rose-200' : 'bg-emerald-50/40 border-emerald-200'}`}>
              <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-govblue-700" /> 2. Ownership Dispute Status
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                  obsData.has_ownership_dispute ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {obsData.has_ownership_dispute ? 'DISPUTE REPORTED (YES)' : 'NO DISPUTES - CLEAR TITLE (NO)'}
                </span>
              </div>

              {obsData.has_ownership_dispute ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Nature of Dispute:</span>
                    <span className="font-bold text-rose-800">{obsData.dispute_nature || 'Family inheritance / partition'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Parties Involved:</span>
                    <span className="font-bold text-slate-800">{obsData.dispute_parties || 'Not specified'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Dispute Description:</span>
                    <span className="text-slate-700">{obsData.dispute_details || 'Recorded in field inspection.'}</span>
                  </div>
                  {obsData.dispute_remarks && (
                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Officer Observations:</span>
                      <span className="text-slate-700">{obsData.dispute_remarks}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-emerald-800">
                  Physical inquiry and revenue records confirm clean title with no family or neighbor boundary disputes.
                </div>
              )}
            </div>

            {/* Card 3: Court Case / Legal Dispute Verification */}
            <div className={`p-5 rounded-2xl border space-y-3 ${obsData.has_court_case ? 'bg-rose-50/50 border-rose-200' : 'bg-emerald-50/40 border-emerald-200'}`}>
              <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                  <Gavel className="w-4 h-4 text-govblue-700" /> 3. Court Case / Legal Dispute Status
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                  obsData.has_court_case ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {obsData.has_court_case ? 'ACTIVE LITIGATION / STAY (YES)' : 'NO LITIGATION - CLEAN TITLE (NO)'}
                </span>
              </div>

              {obsData.has_court_case ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Case Number:</span>
                    <span className="font-mono font-bold text-rose-800">{obsData.court_case_number || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Court / Authority:</span>
                    <span className="font-bold text-slate-800">{obsData.court_name || 'Civil Court'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Injunction / Stay Status:</span>
                    <span className="font-bold text-rose-700">{obsData.court_case_status || 'Pending Hearing'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Parties:</span>
                    <span className="font-bold text-slate-800">{obsData.court_parties || 'N/A'}</span>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Matter in Controversy:</span>
                    <span className="text-slate-700">{obsData.court_case_description || 'Recorded in field verification.'}</span>
                  </div>
                  {obsData.court_case_remarks && (
                    <div className="sm:col-span-3">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Legal Findings & Remarks:</span>
                      <span className="text-slate-700">{obsData.court_case_remarks}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-emerald-800">
                  No judicial proceedings, writ petitions, injunctions, or stay orders registered against Plot #{survey.plot_number}.
                </div>
              )}
            </div>

            {/* Card 4: Structure / Project Verification */}
            <div className={`p-5 rounded-2xl border space-y-3 ${obsData.has_structure_or_project ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-govblue-700" /> 4. Existing Structure / Project on Land
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                  obsData.has_structure_or_project ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white'
                }`}>
                  {obsData.has_structure_or_project ? 'STRUCTURE PRESENT (YES)' : 'VACANT LAND (NO)'}
                </span>
              </div>

              {obsData.has_structure_or_project ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Structure Type:</span>
                    <span className="font-bold text-govblue-900">{obsData.structure_type || 'Residential house'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Location on Parcel:</span>
                    <span className="font-bold text-slate-800">{obsData.structure_location || 'Center of plot'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Description / Dimensions:</span>
                    <span className="text-slate-700">{obsData.structure_description || 'Recorded during inspection.'}</span>
                  </div>
                  {obsData.structure_remarks && (
                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Valuation Impact / Officer Remarks:</span>
                      <span className="text-slate-700">{obsData.structure_remarks}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-600">
                  Land is completely vacant. No houses, permanent masonry structures, wells, or ongoing projects identified.
                </div>
              )}
            </div>

            {/* Card 5: Document Verification Table */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-govblue-700" /> 5. Statutory Document Verifications Checklist
                </span>
                <span className="text-slate-400 text-[11px] font-semibold">
                  {docItems.filter(d => d.verification_status === 'VERIFIED').length} of {docItems.length} Verified
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Document Title</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Verification Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {docItems.map((doc, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-800">{doc.doc_title}</td>
                        <td className="py-2.5 px-3 text-slate-500">{doc.doc_type}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            doc.verification_status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : doc.verification_status === 'MISMATCHED' || doc.verification_status === 'MISMATCH'
                              ? 'bg-rose-100 text-rose-800'
                              : doc.verification_status === 'MISSING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {doc.verification_status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{doc.remarks || doc.mismatch_details || 'Verified with district revenue record.'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Final Recommendation Dropdown */}
          <div className="space-y-2 text-xs">
            <label className="block font-bold text-slate-800">Final Survey Officer Recommendation *</label>
            <select
              value={reportData.final_recommendation}
              onChange={(e) => setReportData({ ...reportData, final_recommendation: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white font-semibold"
            >
              <option value="Survey Completed">Survey Completed (Ready for Section 19)</option>
              <option value="Survey Completed with Discrepancy">Survey Completed with Discrepancy (Conditional)</option>
              <option value="Need Resurvey">Need Resurvey (Demarcation Required)</option>
              <option value="Need Additional Documents">Need Additional Documents from Landowner</option>
              <option value="Boundary Verification Required">Boundary Verification Required by Tehsildar</option>
              <option value="Unable to Conduct Survey">Unable to Conduct Survey (Access Denied / Submerged)</option>
            </select>
          </div>

          {/* Final Remarks */}
          <div className="space-y-2 text-xs">
            <label className="block font-bold text-slate-800">Survey Officer Concluding Remarks & Recommendations</label>
            <textarea
              rows={3}
              value={reportData.final_remarks}
              onChange={(e) => setReportData({ ...reportData, final_remarks: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
              placeholder="Detailed synthesis of findings for Land Acquisition Officer..."
            />
          </div>

          {/* Mandatory Compliance Checkboxes */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
            <h4 className="font-extrabold text-slate-800">Statutory Survey Checklist</h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reportData.checklist_1}
                onChange={(e) => setReportData({ ...reportData, checklist_1: e.target.checked })}
                className="w-4 h-4 rounded text-govblue-700"
              />
              <span>1. Boundaries verified on-ground using DGPS / Total Station against Cadastral Village Map.</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reportData.checklist_2}
                onChange={(e) => setReportData({ ...reportData, checklist_2: e.target.checked })}
                className="w-4 h-4 rounded text-govblue-700"
              />
              <span>2. Landowner / authorized representative identity and occupancy verified on-site.</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reportData.checklist_3}
                onChange={(e) => setReportData({ ...reportData, checklist_3: e.target.checked })}
                className="w-4 h-4 rounded text-govblue-700"
              />
              <span>3. All structural improvements, trees, and wells enumerated for compensation evaluation.</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reportData.checklist_4}
                onChange={(e) => setReportData({ ...reportData, checklist_4: e.target.checked })}
                className="w-4 h-4 rounded text-govblue-700"
              />
              <span>4. High-resolution geo-tagged photographic evidence attached.</span>
            </label>
          </div>

          {/* Digital Signature Confirmation Box */}
          <div className="p-5 rounded-2xl border-2 border-dashed border-govblue-400 bg-blue-50/50 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-govblue-800 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-govblue-950 text-sm">Official Certification & Digital Signature</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {reportData.certification_statement}
                </p>
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-govblue-200 cursor-pointer text-xs font-bold text-govblue-950">
              <input
                type="checkbox"
                checked={reportData.digital_signature_confirmed}
                onChange={(e) => setReportData({ ...reportData, digital_signature_confirmed: e.target.checked })}
                className="w-4 h-4 rounded text-govblue-700"
              />
              <span>I, {survey.assigned_so_name || user?.name || 'Survey Officer'}, confirm and digitally sign this Survey Report.</span>
            </label>
          </div>

          {/* Stepper & Submission Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('observations')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Remarks & Observations
            </button>

            <button
              type="submit"
              disabled={actionLoading || !reportData.digital_signature_confirmed}
              className={`flex items-center gap-2 px-8 py-3.5 rounded-xl text-xs font-black shadow-lg transition tracking-wider uppercase ${
                reportData.digital_signature_confirmed
                  ? 'bg-govblue-800 hover:bg-govblue-900 text-white cursor-pointer hover:shadow-xl'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" /> SUBMIT SURVEY REPORT TO LAO
            </button>
          </div>
        </form>
      )}

      {/* 10. AUDIT HISTORY & ML METRICS TAB */}
      {activeTab === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="w-5 h-5 text-govblue-700" />
              Chronological Audit Trail & Status Transitions
            </h3>

            {survey.status_history && survey.status_history.length > 0 ? (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 text-xs">
                {survey.status_history.map((hist) => (
                  <div key={hist.id} className="relative space-y-1">
                    <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-govblue-700 border-2 border-white shadow-sm"></span>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-xs">{hist.action}</span>
                      <span className="text-[10px] text-slate-400">{new Date(hist.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Transition: <strong>{hist.previous_status || 'INIT'}</strong> ➔ <strong className="text-govblue-700">{hist.new_status}</strong>
                    </div>
                    {hist.remarks && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                        {hist.remarks}
                      </p>
                    )}
                    <div className="text-[10px] text-slate-400">By: {hist.performed_by_name || 'System'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No transition history logged yet.</p>
            )}
          </div>

          {/* ML Feature Impact Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              ML Delay Feature Vectors
            </h3>

            <div className="space-y-3 text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-400">Discrepancy Severity Score</div>
                <div className="font-black text-slate-800 text-base">{survey.discrepancies?.length ? `${survey.discrepancies.length} Active Flags` : 'Clean (0.0)'}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-400">Area Variance Impact</div>
                <div className="font-black text-slate-800 text-base">{areaDeviationPct}% Deviation</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-400">Predicted Timeline Impact</div>
                <div className="font-black text-rose-600 text-base">+{survey.predicted_delay_days || 0} Business Days</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Upload Evidence */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-govblue-700" />
                Add Photo / Video Evidence
              </h3>
              <button onClick={() => setShowEvidenceModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddEvidence} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Evidence Category *</label>
                <select
                  value={newEvidence.category}
                  onChange={(e) => setNewEvidence({ ...newEvidence, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                >
                  <option value="Land Boundary">Land Boundary</option>
                  <option value="Parcel Location">Parcel Location</option>
                  <option value="Existing Structure">Existing Structure</option>
                  <option value="Crop">Crop</option>
                  <option value="Road/Access">Road/Access</option>
                  <option value="Occupation">Occupation</option>
                  <option value="Encroachment">Encroachment</option>
                  <option value="Document Issue">Document Issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Title / Caption *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North-West Peg Landmark Marker"
                  value={newEvidence.title}
                  onChange={(e) => setNewEvidence({ ...newEvidence, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional context on condition or structural measurement..."
                  value={newEvidence.description}
                  onChange={(e) => setNewEvidence({ ...newEvidence, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Simulated Sample Media Image</label>
                <select
                  value={newEvidence.file_path}
                  onChange={(e) => setNewEvidence({ ...newEvidence, file_path: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white font-mono text-[11px]"
                >
                  <option value="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80">Agricultural Boundary Pegging</option>
                  <option value="https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80">Borewell & Pump Shed Structure</option>
                  <option value="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80">Standing Teakwood Tree Assets</option>
                  <option value="https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=600&q=80">Homestead Boundary Wall</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEvidenceModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-govblue-700 hover:bg-govblue-800 text-white rounded-xl text-xs font-bold"
                >
                  Save Evidence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Discrepancy */}
      {showDiscrepancyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Log Discrepancy / Risk Issue
              </h3>
              <button onClick={() => setShowDiscrepancyModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddDiscrepancy} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Discrepancy Category *</label>
                <select
                  value={newDiscrepancy.category}
                  onChange={(e) => setNewDiscrepancy({ ...newDiscrepancy, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                >
                  <option value="Boundary mismatch">Boundary mismatch</option>
                  <option value="Area mismatch">Area mismatch</option>
                  <option value="Ownership mismatch">Ownership mismatch</option>
                  <option value="GIS/map vs ground mismatch">GIS/map vs ground mismatch</option>
                  <option value="Missing document">Missing document</option>
                  <option value="Structure not recorded">Structure not recorded</option>
                  <option value="Occupancy mismatch">Occupancy mismatch</option>
                  <option value="Encroachment">Encroachment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Severity Level *</label>
                <select
                  value={newDiscrepancy.severity}
                  onChange={(e) => setNewDiscrepancy({ ...newDiscrepancy, severity: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white font-bold"
                >
                  <option value="LOW">LOW (Informational)</option>
                  <option value="MEDIUM">MEDIUM (Requires Clarification)</option>
                  <option value="HIGH">HIGH (Potential Legal Delay)</option>
                  <option value="CRITICAL">CRITICAL (Halts Acquisition Process)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain exact ground variance, dispute boundaries, or unlisted structures..."
                  value={newDiscrepancy.description}
                  onChange={(e) => setNewDiscrepancy({ ...newDiscrepancy, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mitigation / Recommendation Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule joint demarcation with Tehsildar"
                  value={newDiscrepancy.remarks}
                  onChange={(e) => setNewDiscrepancy({ ...newDiscrepancy, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDiscrepancyModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                >
                  Save Discrepancy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Request Resurvey */}
      {showResurveyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-rose-600" />
                Initiate Resurvey Request
              </h3>
              <button onClick={() => setShowResurveyModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleRequestResurvey} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Resurvey *</label>
                <input
                  type="text"
                  required
                  value={resurveyData.resurvey_reason}
                  onChange={(e) => setResurveyData({ ...resurveyData, resurvey_reason: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Required Joint Action *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Joint demarcation in presence of Amin & Tehsildar"
                  value={resurveyData.required_action}
                  onChange={(e) => setResurveyData({ ...resurveyData, required_action: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Supporting Evidence / Field Summary</label>
                <textarea
                  rows={2}
                  value={resurveyData.supporting_evidence}
                  onChange={(e) => setResurveyData({ ...resurveyData, supporting_evidence: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowResurveyModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                >
                  Escalate Resurvey
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LAO / CO Review Decision */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-700" />
                LAO / CO Survey Report Review
              </h3>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleReviewAction} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Review Decision *</label>
                <select
                  value={reviewData.action}
                  onChange={(e) => setReviewData({ ...reviewData, action: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white font-bold"
                >
                  <option value="APPROVE">APPROVE (Accept Survey & Proceed)</option>
                  <option value="RETURN_FOR_CORRECTION">RETURN FOR CORRECTION (SO Modification)</option>
                  <option value="REQUIRE_RESURVEY">REQUIRE FORMAL RESURVEY</option>
                  <option value="REJECT">REJECT (Survey Invalid)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Review Remarks *</label>
                <textarea
                  rows={3}
                  required
                  value={reviewData.remarks}
                  onChange={(e) => setReviewData({ ...reviewData, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                />
              </div>

              {reviewData.action === 'RETURN_FOR_CORRECTION' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Required Corrections</label>
                  <input
                    type="text"
                    placeholder="e.g. Verify North boundary measurement"
                    value={reviewData.corrections_required}
                    onChange={(e) => setReviewData({ ...reviewData, corrections_required: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold"
                >
                  Submit Official Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
