import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RiskBadge } from '../common/RiskBadge';
import { predictionService } from '../../services/predictionService';
import {
  RotateCcw,
  Compass,
  Layers,
  Info,
  X,
  AlertTriangle,
  Layers3,
  Box,
  Search,
  CheckCircle2,
  Clock,
  FileCheck,
  User,
  CreditCard,
  Building2,
  FileWarning,
  Eye,
  EyeOff,
  Focus,
  Sliders,
  ChevronRight,
  MousePointer,
  Ruler,
  Maximize2,
  MapPin,
  Spline,
  Pentagon,
  Trash2,
  Check,
  Undo2,
  Copy,
  Download,
  ListOrdered,
  Route,
  Navigation,
  Milestone,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Scale,
  Landmark,
  BadgeAlert,
  AlertOctagon,
  FileText,
  BrainCircuit,
  TrendingUp,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Lightbulb,
  Plus,
  GitBranch,
  Columns,
  Sparkles,
  ExternalLink,
  Target,
  BarChart3,
  Layers2,
  FlaskConical,
  Play,
  LogOut,
  RefreshCw,
  Wand2,
  ToggleLeft,
  ToggleRight,
  CheckSquare,
  Calculator
} from 'lucide-react';

const ROUTE_PALETTE = [
  { id: 'orig', colorHex: 0x38bdf8, name: 'Original Alignment (Route A)', cssText: 'text-sky-400', cssBg: 'bg-sky-500', hex: '#38BDF8' },
  { id: 'alt1', colorHex: 0x10b981, name: 'Alternative Route 1', cssText: 'text-emerald-400', cssBg: 'bg-emerald-500', hex: '#10B981' },
  { id: 'alt2', colorHex: 0xa855f7, name: 'Alternative Route 2', cssText: 'text-purple-400', cssBg: 'bg-purple-500', hex: '#A855F7' },
  { id: 'alt3', colorHex: 0xf59e0b, name: 'Alternative Route 3', cssText: 'text-amber-400', cssBg: 'bg-amber-500', hex: '#F59E0B' },
  { id: 'alt4', colorHex: 0xec4899, name: 'Alternative Route 4', cssText: 'text-pink-400', cssBg: 'bg-pink-500', hex: '#EC4899' }
];

export const ParcelMap3D = ({
  geojsonData,
  onSelectParcel = null,
  selectedParcelId = null,
  height = '680px'
}) => {
  const mountRef = useRef(null);
  
  // Selection & Filters
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [extrusionHeight, setExtrusionHeight] = useState(4);
  const [filterState, setFilterState] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // GIS Survey & AI Measurement Calculator Toolbar State
  // 'select' | 'measure_distance' | 'measure_area' | 'mark_point' | 'draw_line' | 'draw_polygon' | 'create_route'
  const [activeTool, setActiveTool] = useState('select');
  const [activePoints, setActivePoints] = useState([]); // Array of { x, y, z, lat, lng }
  const [cursorGeoPos, setCursorGeoPos] = useState(null);
  const [surveyAnnotations, setSurveyAnnotations] = useState([]);
  const [showSurveyPanel, setShowSurveyPanel] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Multi-Route Alignment Architecture
  const [routes, setRoutes] = useState([
    {
      id: 'route-original',
      name: 'Original Alignment (Route A)',
      colorHex: 0x38bdf8,
      hex: '#38BDF8',
      cssText: 'text-sky-400',
      cssBg: 'bg-sky-500',
      points: [],
      corridorWidth: 30,
      curveType: 'spline',
      visible: true,
      calculation: null,
      mlPrediction: null
    },
    {
      id: 'route-alt-1',
      name: 'Alternative Route 1',
      colorHex: 0x10b981,
      hex: '#10B981',
      cssText: 'text-emerald-400',
      cssBg: 'bg-emerald-500',
      points: [],
      corridorWidth: 30,
      curveType: 'spline',
      visible: true,
      calculation: null,
      mlPrediction: null
    },
    {
      id: 'route-alt-2',
      name: 'Alternative Route 2',
      colorHex: 0xa855f7,
      hex: '#A855F7',
      cssText: 'text-purple-400',
      cssBg: 'bg-purple-500',
      points: [],
      corridorWidth: 30,
      curveType: 'spline',
      visible: true,
      calculation: null,
      mlPrediction: null
    }
  ]);

  const [activeRouteId, setActiveRouteId] = useState('route-original');
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [routeActiveTab, setRouteActiveTab] = useState('routes_list'); // 'routes_list' | 'route_comparison' | 'whatif_sandbox' | 'active_route' | 'ai_predict'
  const [comparisonViewMode, setComparisonViewMode] = useState('cards'); // 'cards' | 'table'
  const [selectedAffectedParcel, setSelectedAffectedParcel] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);

  // What-If Simulation Sandbox State
  const [isWhatIfMode, setIsWhatIfMode] = useState(false);
  const [simulatedOverrides, setSimulatedOverrides] = useState({});
  const [baselineScenario, setBaselineScenario] = useState(null);

  // References
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const groundPlaneRef = useRef(null);
  const meshesMapRef = useRef(new Map());
  const surveyGroupRef = useRef(new THREE.Group());
  const tempDrawGroupRef = useRef(new THREE.Group());
  const multiRoutesGroupRef = useRef(new THREE.Group());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const animationFrameRef = useRef(null);
  const isDraggingRef = useRef(false);
  const pointerDownPosRef = useRef({ x: 0, y: 0 });

  const rawFeatures = useMemo(() => geojsonData?.features || [], [geojsonData]);

  // Effective Features reflecting What-If Overrides without touching database
  const features = useMemo(() => {
    if (!isWhatIfMode || Object.keys(simulatedOverrides).length === 0) {
      return rawFeatures;
    }
    return rawFeatures.map((feat) => {
      const override = simulatedOverrides[feat.id];
      if (!override) return feat;
      return {
        ...feat,
        properties: {
          ...feat.properties,
          ...override
        }
      };
    });
  }, [rawFeatures, isWhatIfMode, simulatedOverrides]);

  // Active Route Reference Helper
  const activeRoute = useMemo(() => {
    return routes.find((r) => r.id === activeRouteId) || routes[0];
  }, [routes, activeRouteId]);

  // Reverse Parcel-to-Route Impact Calculator
  const routesAffectingSelected = useMemo(() => {
    if (!selectedFeature) return [];
    return routes
      .map((r) => {
        if (!r.calculation || !r.calculation.affectedParcels) return null;
        const match = r.calculation.affectedParcels.find((p) => p.id === selectedFeature.id);
        if (!match) return null;
        return {
          route: r,
          impact: match
        };
      })
      .filter(Boolean);
  }, [selectedFeature, routes]);

  // Sync external selectedParcelId
  useEffect(() => {
    if (selectedParcelId) {
      const found = features.find((f) => f.id === selectedParcelId);
      if (found) setSelectedFeature(found);
    }
  }, [selectedParcelId, features]);

  // Compute GeoJSON Geographic Bounds & Centroid
  const { centerLng, centerLat, scaleX, scaleZ } = useMemo(() => {
    if (!features.length) {
      return { centerLng: 85.8245, centerLat: 20.1782, scaleX: 100000, scaleZ: 100000 };
    }

    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    features.forEach((feat) => {
      const coords = feat.geometry?.coordinates?.[0] || [];
      coords.forEach(([lng, lat]) => {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      });
    });

    const cLng = (minLng + maxLng) / 2 || 85.8245;
    const cLat = (minLat + maxLat) / 2 || 20.1782;

    const latRad = (cLat * Math.PI) / 180;
    const sX = 111320 * Math.cos(latRad);
    const sZ = 110540;

    return { centerLng: cLng, centerLat: cLat, scaleX: sX, scaleZ: sZ };
  }, [features]);

  // Geographic Projection Utilities
  const geoToWorld = useCallback((lng, lat, y = 0.4) => {
    const x = (lng - centerLng) * scaleX;
    const z = -(lat - centerLat) * scaleZ;
    return new THREE.Vector3(x, y, z);
  }, [centerLng, centerLat, scaleX, scaleZ]);

  const worldToGeo = useCallback((worldPos) => {
    const lng = centerLng + worldPos.x / scaleX;
    const lat = centerLat - worldPos.z / scaleZ;
    return { lng: parseFloat(lng.toFixed(6)), lat: parseFloat(lat.toFixed(6)) };
  }, [centerLng, centerLat, scaleX, scaleZ]);

  // Geodesic Math Utilities
  const calculateDistanceMeters = (p1, p2) => {
    const R = 6371008.8;
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1.lat * Math.PI) / 180) *
        Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateTotalDistance = useCallback((pts) => {
    if (!pts || pts.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      total += calculateDistanceMeters(pts[i], pts[i + 1]);
    }
    return total;
  }, []);

  const calculatePolygonArea = useCallback((pts) => {
    if (!pts || pts.length < 3) return 0;
    const avgLat = pts.reduce((acc, p) => acc + p.lat, 0) / pts.length;
    const metersPerLat = 111132.954 - 559.822 * Math.cos((2 * avgLat * Math.PI) / 180);
    const metersPerLng = (Math.PI / 180) * 6378137.0 * Math.cos((avgLat * Math.PI) / 180);

    const projected = pts.map((p) => ({
      x: (p.lng - pts[0].lng) * metersPerLng,
      y: (p.lat - pts[0].lat) * metersPerLat
    }));

    let area = 0;
    for (let i = 0; i < projected.length; i++) {
      const j = (i + 1) % projected.length;
      area += projected[i].x * projected[j].y;
      area -= projected[j].x * projected[i].y;
    }
    return Math.abs(area) / 2;
  }, []);

  const isPointInPolygon = (pt, ring) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      const intersect =
        yi > pt.lat !== yj > pt.lat &&
        pt.lng < ((xj - xi) * (pt.lat - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const distanceToSegmentMeters = (pt, s1, s2, centerLatLocal) => {
    const mLng = 111320 * Math.cos((centerLatLocal * Math.PI) / 180);
    const mLat = 110540;

    const px = pt.lng * mLng;
    const py = pt.lat * mLat;
    const x1 = s1.lng * mLng;
    const y1 = s1.lat * mLat;
    const x2 = s2.lng * mLng;
    const y2 = s2.lat * mLat;

    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);

    let t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));
    const nearestX = x1 + t * dx;
    const nearestY = y1 + t * dy;
    return Math.hypot(px - nearestX, py - nearestY);
  };

  const formatDistance = (meters) => {
    if (!meters || isNaN(meters)) return '0 m';
    if (meters < 1000) {
      return `${meters.toFixed(1)} m`;
    }
    return `${(meters / 1000).toFixed(3)} km (${meters.toFixed(0)} m)`;
  };

  const formatArea = (sqm) => {
    const acres = sqm / 4046.8564;
    const ha = sqm / 10000;
    return {
      sqm: `${sqm.toLocaleString(undefined, { maximumFractionDigits: 1 })} m²`,
      acres: `${acres.toFixed(3)} Acres`,
      ha: `${ha.toFixed(3)} Ha`
    };
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3400);
  };

  // Live active AI measurement computation for Distance and Area tools
  const liveActiveMeasurement = useMemo(() => {
    if (activePoints.length < 2) return null;
    if (activeTool === 'measure_distance' || activeTool === 'draw_line') {
      const dist = calculateTotalDistance(activePoints);
      return { type: 'distance', label: 'AI Measured Distance', value: formatDistance(dist) };
    }
    if ((activeTool === 'measure_area' || activeTool === 'draw_polygon') && activePoints.length >= 3) {
      const area = calculatePolygonArea(activePoints);
      const fmt = formatArea(area);
      return { type: 'area', label: 'AI Measured Land Area', value: `${fmt.acres} (${fmt.ha} • ${fmt.sqm})` };
    }
    return null;
  }, [activePoints, activeTool, calculateTotalDistance, calculatePolygonArea]);

  // Deterministic Land Acquisition Situation Classifier
  const classifyAcquisitionSituation = useCallback((props) => {
    const consent = props.owner_consent_status || props.consent_status || '';
    const comp = props.compensation_status || '';
    const doc = props.document_status || '';
    const survey = props.survey_status || '';
    const acq = props.acquisition_status || '';

    const isConflict =
      props.visual_state === 'conflict' ||
      props.risk_level === 'High' ||
      consent.includes('Objection') ||
      consent.includes('Dispute') ||
      doc.includes('Discrepancy') ||
      survey.includes('Disputed') ||
      Boolean(props.conflict_reason);

    const isCompleted =
      acq === 'Completed' ||
      props.visual_state === 'completed' ||
      comp.includes('Disbursed');

    const isInProgress =
      props.visual_state === 'in_progress' ||
      survey.includes('In Progress') ||
      acq.includes('Section 11') ||
      acq.includes('Section 6') ||
      acq.includes('Section 19') ||
      consent.includes('Pending') ||
      comp.includes('Estimate');

    let stateKey = 'REQUIRED';
    let label = 'Acquisition Required';
    let colorHex = 0x6366f1;
    let cssBg = 'bg-indigo-600';
    let textColor = 'text-indigo-400';

    if (isConflict) {
      stateKey = 'CONFLICT';
      label = 'Acquisition Conflict';
      colorHex = 0xef4444;
      cssBg = 'bg-rose-600';
      textColor = 'text-rose-400';
    } else if (isCompleted) {
      stateKey = 'COMPLETED';
      label = 'Acquisition Completed';
      colorHex = 0x3b82f6;
      cssBg = 'bg-blue-600';
      textColor = 'text-blue-400';
    } else if (isInProgress) {
      stateKey = 'IN_PROGRESS';
      label = 'Acquisition In Progress';
      colorHex = 0xf59e0b;
      cssBg = 'bg-amber-600';
      textColor = 'text-amber-400';
    }

    return {
      stateKey,
      label,
      colorHex,
      cssBg,
      textColor,
      isConflict,
      isCompleted,
      isInProgress,
      conflictType: props.conflict_type || (isConflict ? 'Title Contestation / Dispute' : null),
      conflictReason: props.conflict_reason || null,
      consentStatus: consent || 'Consent Granted',
      documentStatus: doc || 'RoR Verified',
      surveyStatus: survey || 'Completed',
      compensationStatus: comp || 'Estimate Prepared',
      processStage: props.current_process_stage || acq || 'Section 4(1) Notification'
    };
  }, []);

  const getVisualStateInfo = useCallback((props) => {
    const situ = classifyAcquisitionSituation(props);
    return {
      key: situ.stateKey,
      label: situ.label,
      colorHex: situ.colorHex,
      cssBg: situ.cssBg,
      textColor: situ.textColor,
      borderColor: situ.stateKey === 'CONFLICT' ? 'border-rose-500/50' : 'border-slate-700',
      heightMultiplier: situ.stateKey === 'CONFLICT' ? 1.45 : situ.stateKey === 'IN_PROGRESS' ? 1.15 : 1.0,
      emissiveGlow: situ.stateKey === 'CONFLICT'
    };
  }, [classifyAcquisitionSituation]);

  // Highlight & Focus Route in 3D Environment
  const selectAndHighlightRoute = useCallback((routeId) => {
    setActiveRouteId(routeId);
    setRoutes((prev) =>
      prev.map((r) => (r.id === routeId ? { ...r, visible: true } : r))
    );
    const targetRoute = routes.find((r) => r.id === routeId);
    if (targetRoute && targetRoute.points && targetRoute.points.length > 0) {
      const pts = targetRoute.points;
      const midIdx = Math.floor(pts.length / 2);
      const midPt = pts[midIdx];
      if (controlsRef.current && cameraRef.current) {
        controlsRef.current.target.set(midPt.x, 0, midPt.z);
        cameraRef.current.position.set(midPt.x, 75, midPt.z + 95);
        controlsRef.current.update();
      }
      showToast(`Selected and highlighted ${targetRoute.name} in 3D scene`);
    } else {
      showToast(`Selected ${targetRoute?.name || 'Alignment'}`);
    }
  }, [routes]);

  // Route Editing Tools (Undo, Clear, ROW, Curve Toggle)
  const undoLastWaypoint = () => {
    if (!activeRoute.points || activeRoute.points.length === 0) return;
    const updated = activeRoute.points.slice(0, -1);
    calculateRouteStatutoryAndML(activeRoute.id, updated, activeRoute.corridorWidth);
    showToast(`Removed last waypoint from ${activeRoute.name}`);
  };

  const clearActiveRouteWaypoints = () => {
    calculateRouteStatutoryAndML(activeRoute.id, [], activeRoute.corridorWidth);
    showToast(`Cleared all waypoints for ${activeRoute.name}`);
  };

  const toggleCurveType = () => {
    const nextType = activeRoute.curveType === 'spline' ? 'polyline' : 'spline';
    setRoutes((prev) =>
      prev.map((r) => (r.id === activeRouteId ? { ...r, curveType: nextType } : r))
    );
    showToast(`Switched geometry to ${nextType === 'spline' ? 'Smooth Catmull-Rom Spline' : 'Straight Polyline'}`);
  };

  const handleCorridorWidthChange = (val) => {
    const width = parseInt(val, 10);
    setRoutes((prev) =>
      prev.map((r) => (r.id === activeRouteId ? { ...r, corridorWidth: width } : r))
    );
    if (activeRoute.points && activeRoute.points.length >= 2) {
      calculateRouteStatutoryAndML(activeRoute.id, activeRoute.points, width);
    }
  };

  // GIS Measurement Tools: Finish, Undo, Cancel & Clear
  const finishActiveDrawing = () => {
    if (activePoints.length === 0) return;
    const id = `survey-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (activeTool === 'measure_distance' || activeTool === 'draw_line') {
      const dist = calculateTotalDistance(activePoints);
      const newAnno = {
        id,
        type: 'distance',
        name: `Path Distance #${surveyAnnotations.length + 1}`,
        points: activePoints,
        measurement: { distanceFormatted: formatDistance(dist), meters: dist, segments: activePoints.length - 1 },
        timestamp
      };
      setSurveyAnnotations((prev) => [...prev, newAnno]);
      showToast(`Saved Distance: ${formatDistance(dist)}`);
    } else if (activeTool === 'measure_area' || activeTool === 'draw_polygon') {
      const area = calculatePolygonArea(activePoints);
      const perim = calculateTotalDistance([...activePoints, activePoints[0]]);
      const fmtArea = formatArea(area);
      const newAnno = {
        id,
        type: 'area',
        name: `Land Zone #${surveyAnnotations.length + 1}`,
        points: activePoints,
        measurement: { areaFormatted: fmtArea, perimeterFormatted: formatDistance(perim), areaSqm: area },
        timestamp
      };
      setSurveyAnnotations((prev) => [...prev, newAnno]);
      showToast(`Saved Area: ${fmtArea.acres} (${fmtArea.sqm})`);
    }

    setActivePoints([]);
    setActiveTool('select');
  };

  const undoLastPoint = () => {
    if (activePoints.length === 0) return;
    setActivePoints((prev) => prev.slice(0, -1));
  };

  const cancelActiveDrawing = () => {
    setActivePoints([]);
    setActiveTool('select');
    showToast('Measurement cancelled.');
  };

  const clearAllDrawings = () => {
    setActivePoints([]);
    setSurveyAnnotations([]);
    showToast('Cleared all temporary survey measurements.');
  };

  const deleteAnnotation = (id) => {
    setSurveyAnnotations((prev) => prev.filter((a) => a.id !== id));
    showToast('Measurement item removed.');
  };

  // What-If Simulation Sandbox Life-cycle Controls
  const startWhatIfSimulation = () => {
    setIsWhatIfMode(true);
    setBaselineScenario({
      routeId: activeRouteId,
      routeName: activeRoute.name,
      calculation: activeRoute.calculation ? { ...activeRoute.calculation } : null,
      mlPrediction: activeRoute.mlPrediction ? { ...activeRoute.mlPrediction } : null
    });
    setSimulatedOverrides({});
    setShowRoutePanel(true);
    setRouteActiveTab('whatif_sandbox');
    showToast('🧪 What-If Simulation Sandbox Activated. Changes are temporary.');
  };

  const resetWhatIfSimulation = () => {
    setSimulatedOverrides({});
    showToast('Simulation Sandbox reset to baseline scenario.');
  };

  const exitWhatIfSimulation = () => {
    setIsWhatIfMode(false);
    setSimulatedOverrides({});
    setBaselineScenario(null);
    showToast('Exited Simulation Mode. Real database records remain 100% untouched.');
  };

  // Modify Single Parcel in What-If Sandbox
  const handleWhatIfParcelChange = (parcelId, attributeKey, value) => {
    setSimulatedOverrides((prev) => {
      const existing = prev[parcelId] || {};
      const updated = { ...existing, [attributeKey]: value };

      if (attributeKey === 'owner_consent_status' && value === 'Consent Granted') {
        updated.conflict_reason = null;
        updated.conflict_type = null;
        updated.risk_level = 'Low';
        updated.visual_state = 'in_progress';
      } else if (attributeKey === 'owner_consent_status' && value === 'Owner Objection Lodged') {
        updated.conflict_reason = 'Contested valuation & route alignment objection lodged by pattadar.';
        updated.conflict_type = 'Landowner Alignment Objection';
        updated.risk_level = 'High';
        updated.visual_state = 'conflict';
      }

      if (attributeKey === 'compensation_status' && value.includes('Disbursed')) {
        updated.visual_state = 'completed';
      }

      return {
        ...prev,
        [parcelId]: updated
      };
    });
    showToast(`Simulated ${attributeKey.replace(/_/g, ' ')} update applied.`);
  };

  // Bulk Preset - Resolve All Conflicts for Current Alignment
  const handleBulkResolveConflicts = () => {
    if (!activeRoute.calculation?.affectedParcels) return;
    const newOverrides = { ...simulatedOverrides };
    activeRoute.calculation.affectedParcels.forEach((p) => {
      newOverrides[p.id] = {
        owner_consent_status: 'Consent Granted',
        document_status: 'RoR Verified',
        survey_status: 'Completed (Field Verified)',
        compensation_status: 'Award Disbursed (Direct Benefit Transfer)',
        acquisition_status: 'Completed',
        conflict_reason: null,
        conflict_type: null,
        risk_level: 'Low',
        visual_state: 'completed'
      };
    });
    setSimulatedOverrides(newOverrides);
    showToast(`Simulated conflict resolution across all ${activeRoute.calculation.affectedParcels.length} affected parcels.`);
  };

  // Bulk Preset - Inject High Objections
  const handleBulkInjectObjections = () => {
    if (!activeRoute.calculation?.affectedParcels) return;
    const newOverrides = { ...simulatedOverrides };
    activeRoute.calculation.affectedParcels.slice(0, 3).forEach((p) => {
      newOverrides[p.id] = {
        owner_consent_status: 'Owner Objection Lodged',
        document_status: 'Discrepancy in Boundary Records',
        survey_status: 'Disputed Boundary (Re-survey Demanded)',
        conflict_reason: 'Title dispute and market valuation grievance filed before Land Tribunal.',
        conflict_type: 'High-Risk Statutory Contest',
        risk_level: 'High',
        visual_state: 'conflict'
      };
    });
    setSimulatedOverrides(newOverrides);
    showToast('Simulated objection & boundary contest escalation on 3 parcels.');
  };

  // Three.js Scene Setup & Render Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const heightPx = container.clientHeight || parseInt(height) || 680;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.0026);
    sceneRef.current = scene;

    scene.add(surveyGroupRef.current);
    scene.add(tempDrawGroupRef.current);
    scene.add(multiRoutesGroupRef.current);

    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 1, 3500);
    camera.position.set(0, 115, 165);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.08;
    controls.minDistance = 15;
    controls.maxDistance = 500;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xe0f2fe, 1.4);
    dirLight.position.set(80, 160, 90);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
    fillLight.position.set(-90, 80, -90);
    scene.add(fillLight);

    // Ground Grid & Plane
    const gridHelper = new THREE.GridHelper(300, 60, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -0.05;
    scene.add(gridHelper);

    const planeGeo = new THREE.PlaneGeometry(500, 500);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x080e1a,
      roughness: 0.9,
      metalness: 0.1
    });
    const groundPlane = new THREE.Mesh(planeGeo, planeMat);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.1;
    groundPlane.receiveShadow = true;
    groundPlane.name = 'groundPlane';
    scene.add(groundPlane);
    groundPlaneRef.current = groundPlane;

    // Pulse Animation Clock
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();

      const elapsed = clock.getElapsedTime();

      // Animate active route beacons & beams
      multiRoutesGroupRef.current.traverse((child) => {
        if (child.userData?.isPulseBeacon) {
          const scale = 1.0 + Math.sin(elapsed * 4) * 0.22;
          child.scale.set(scale, scale, 1);
        }
        if (child.userData?.isBeam) {
          child.material.opacity = 0.35 + Math.sin(elapsed * 3) * 0.15;
        }
      });

      // Animate temporary drawing markers
      tempDrawGroupRef.current.traverse((child) => {
        if (child.userData?.isTempRing) {
          const s = 1.0 + Math.sin(elapsed * 5) * 0.15;
          child.scale.set(s, s, 1);
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || parseInt(height) || 680;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [height]);

  // Re-build 3D Parcel Meshes (Reflects Live / What-If Simulated Features)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    meshesMapRef.current.forEach((mesh) => {
      scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
        else mesh.material.dispose();
      }
    });
    meshesMapRef.current.clear();

    if (!features.length) return;

    features.forEach((feature) => {
      const props = feature.properties || {};
      const ring = feature.geometry?.coordinates?.[0];
      if (!ring || ring.length < 3) return;

      const stateInfo = getVisualStateInfo(props);

      if (filterState !== 'ALL' && stateInfo.key !== filterState) {
        return;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const plotMatch = props.plot_number?.toLowerCase().includes(query);
        const khataMatch = props.khata_number?.toLowerCase().includes(query);
        const ownerMatch = (props.landowner_name || props.owners?.[0]?.name || '').toLowerCase().includes(query);
        if (!plotMatch && !khataMatch && !ownerMatch) return;
      }

      const shape = new THREE.Shape();
      let sumX = 0, sumY = 0;
      ring.forEach(([lng, lat], idx) => {
        const x = (lng - centerLng) * scaleX;
        const y = (lat - centerLat) * scaleZ;
        sumX += x;
        sumY += y;
        if (idx === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      });

      const centroidX = sumX / ring.length;
      const centroidZ = -sumY / ring.length;

      const parcelDepth = extrusionHeight * stateInfo.heightMultiplier;

      const extrudeSettings = {
        steps: 1,
        depth: parcelDepth,
        bevelEnabled: true,
        bevelThickness: 0.28,
        bevelSize: 0.25,
        bevelSegments: 2
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.computeVertexNormals();

      const material = new THREE.MeshStandardMaterial({
        color: stateInfo.colorHex,
        roughness: 0.32,
        metalness: 0.18,
        transparent: true,
        opacity: 0.88
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = {
        feature,
        stateInfo,
        centroid: new THREE.Vector3(centroidX, parcelDepth, centroidZ),
        baseColorHex: stateInfo.colorHex,
        isConflict: stateInfo.key === 'CONFLICT'
      };

      const edgesGeo = new THREE.EdgesGeometry(geometry, 25);
      const edgeMat = new THREE.LineBasicMaterial({
        color: stateInfo.key === 'CONFLICT' ? 0xff4d4d : 0xffffff,
        transparent: true,
        opacity: stateInfo.key === 'CONFLICT' ? 0.9 : 0.5,
        linewidth: 1.5
      });
      const edgeLines = new THREE.LineSegments(edgesGeo, edgeMat);
      mesh.add(edgeLines);

      scene.add(mesh);
      meshesMapRef.current.set(feature.id, mesh);
    });
  }, [features, centerLng, centerLat, scaleX, scaleZ, extrusionHeight, filterState, searchQuery, getVisualStateInfo]);

  // Render Temporary Active Drawing Geometry (Lines, Points, Polygons, Area Fill)
  useEffect(() => {
    const tempGroup = tempDrawGroupRef.current;
    if (!tempGroup) return;

    while (tempGroup.children.length > 0) {
      const obj = tempGroup.children[0];
      tempGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    }

    if (activePoints.length === 0) return;

    activePoints.forEach((pt, idx) => {
      const sphereGeo = new THREE.SphereGeometry(0.7, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: idx === 0 ? 0x10b981 : 0x38bdf8,
        emissive: idx === 0 ? 0x059669 : 0x0284c7,
        emissiveIntensity: 0.8,
        roughness: 0.2
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.position.set(pt.x, pt.y + 0.4, pt.z);
      tempGroup.add(sphereMesh);

      const ringGeo = new THREE.RingGeometry(0.8, 1.3, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.set(pt.x, 0.1, pt.z);
      ringMesh.userData = { isTempRing: true };
      tempGroup.add(ringMesh);
    });

    if (activePoints.length >= 2) {
      const linePts = activePoints.map((p) => new THREE.Vector3(p.x, p.y + 0.4, p.z));
      if (activeTool === 'measure_area' || activeTool === 'draw_polygon') {
        linePts.push(new THREE.Vector3(activePoints[0].x, activePoints[0].y + 0.4, activePoints[0].z));
      }

      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
      const lineMat = new THREE.LineBasicMaterial({
        color: activeTool.includes('area') || activeTool.includes('polygon') ? 0x10b981 : 0x38bdf8,
        linewidth: 3
      });
      const line = new THREE.Line(lineGeo, lineMat);
      tempGroup.add(line);
    }
  }, [activePoints, activeTool]);

  // Render Saved Survey Annotations
  useEffect(() => {
    const sGroup = surveyGroupRef.current;
    if (!sGroup) return;

    while (sGroup.children.length > 0) {
      const obj = sGroup.children[0];
      sGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    }

    surveyAnnotations.forEach((anno) => {
      const itemGroup = new THREE.Group();
      if (anno.type === 'point' && anno.points[0]) {
        const pt = anno.points[0];
        const markerGeo = new THREE.ConeGeometry(0.6, 2.0, 16);
        markerGeo.rotateX(Math.PI);
        markerGeo.translate(0, 1.0, 0);
        const markerMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, roughness: 0.3 });
        const markerMesh = new THREE.Mesh(markerGeo, markerMat);
        markerMesh.position.set(pt.x, pt.y + 0.4, pt.z);
        itemGroup.add(markerMesh);
      } else if (anno.points && anno.points.length >= 2) {
        const linePts = anno.points.map((p) => new THREE.Vector3(p.x, p.y + 0.4, p.z));
        if (anno.type === 'area' || anno.type === 'polygon') {
          linePts.push(new THREE.Vector3(anno.points[0].x, anno.points[0].y + 0.4, anno.points[0].z));
        }
        const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
        const lineMat = new THREE.LineBasicMaterial({
          color: anno.type === 'area' ? 0x10b981 : 0x38bdf8,
          linewidth: 2.5
        });
        const line = new THREE.Line(lineGeo, lineMat);
        itemGroup.add(line);
      }
      sGroup.add(itemGroup);
    });
  }, [surveyAnnotations]);

  // Update Visual Highlights for Hovered, Selected & Active Route Intersected Features
  useEffect(() => {
    const affectedMap = new Map();
    if (activeRoute?.calculation?.affectedParcels) {
      activeRoute.calculation.affectedParcels.forEach((p) => affectedMap.set(p.id, p));
    }

    const hasAnyRoute = routes.some((r) => r.points && r.points.length >= 2 && r.visible);

    meshesMapRef.current.forEach((mesh, id) => {
      const isSelected = selectedFeature && selectedFeature.id === id;
      const isHovered = hoveredFeature && hoveredFeature.id === id;
      const affectedItem = affectedMap.get(id);
      const isConflict = mesh.userData.isConflict;
      const baseColor = mesh.userData.baseColorHex;

      if (isSelected) {
        mesh.material.color.setHex(0x38bdf8);
        mesh.material.opacity = 1.0;
        mesh.material.emissive.setHex(0x0369a1);
        mesh.material.emissiveIntensity = 0.7;
        mesh.position.y = 2.4;
      } else if (affectedItem) {
        if (affectedItem.isConflict) {
          mesh.material.color.setHex(0xef4444);
          mesh.material.opacity = 1.0;
          mesh.material.emissive.setHex(0xb91c1c);
          mesh.material.emissiveIntensity = 0.75;
          mesh.position.y = 2.4;
        } else if (affectedItem.category === 'Completed') {
          mesh.material.color.setHex(0x3b82f6);
          mesh.material.opacity = 0.95;
          mesh.material.emissive.setHex(0x1d4ed8);
          mesh.material.emissiveIntensity = 0.45;
          mesh.position.y = 1.6;
        } else if (affectedItem.category === 'In Progress') {
          mesh.material.color.setHex(0xf59e0b);
          mesh.material.opacity = 0.95;
          mesh.material.emissive.setHex(0xb45309);
          mesh.material.emissiveIntensity = 0.45;
          mesh.position.y = 1.8;
        } else {
          mesh.material.color.setHex(0x6366f1);
          mesh.material.opacity = 0.95;
          mesh.material.emissive.setHex(0x4338ca);
          mesh.material.emissiveIntensity = 0.45;
          mesh.position.y = 1.6;
        }
      } else if (isHovered && activeTool === 'select') {
        mesh.material.color.setHex(baseColor);
        mesh.material.opacity = 0.98;
        mesh.material.emissive.setHex(0xffffff);
        mesh.material.emissiveIntensity = 0.35;
        mesh.position.y = 1.0;
      } else {
        mesh.material.color.setHex(baseColor);
        mesh.material.opacity = hasAnyRoute ? 0.45 : 0.88;
        if (!isConflict) {
          mesh.material.emissive.setHex(0x000000);
          mesh.material.emissiveIntensity = 0.0;
        }
        mesh.position.y = 0.0;
      }
    });
  }, [selectedFeature, hoveredFeature, activeTool, activeRoute, routes]);

  // Render All Alternative Routes in 3D Scene
  useEffect(() => {
    const multiGroup = multiRoutesGroupRef.current;
    if (!multiGroup) return;

    while (multiGroup.children.length > 0) {
      const obj = multiGroup.children[0];
      multiGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    }

    routes.forEach((route) => {
      if (!route.visible || !route.points || route.points.length === 0) return;

      const rGroup = new THREE.Group();
      const isActive = route.id === activeRouteId;
      const pts = route.points;

      // 1. Waypoint Nodes & Start/End Beacons
      pts.forEach((pt, idx) => {
        const isStart = idx === 0;
        const isEnd = idx === pts.length - 1 && pts.length > 1;

        if ((isStart || isEnd) && isActive) {
          const beamGeo = new THREE.CylinderGeometry(0.35, 1.2, 14, 16, 1, true);
          beamGeo.translate(0, 7, 0);
          const beamMat = new THREE.MeshBasicMaterial({
            color: isStart ? 0x10b981 : 0xef4444,
            transparent: true,
            opacity: 0.45,
            side: THREE.DoubleSide
          });
          const beam = new THREE.Mesh(beamGeo, beamMat);
          beam.position.set(pt.x, 0.2, pt.z);
          beam.userData = { isBeam: true };
          rGroup.add(beam);
        }

        const sphereGeo = new THREE.SphereGeometry(isStart || isEnd ? 0.9 : 0.6, 16, 16);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: isStart ? 0x10b981 : isEnd ? 0xef4444 : route.colorHex,
          emissive: isStart ? 0x059669 : isEnd ? 0xdc2626 : route.colorHex,
          emissiveIntensity: isActive ? 0.9 : 0.45,
          roughness: 0.1
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.set(pt.x, pt.y + 0.55, pt.z);
        rGroup.add(sphere);

        if (isActive) {
          const ringGeo = new THREE.RingGeometry(1.0, 1.8, 24);
          const ringMat = new THREE.MeshBasicMaterial({
            color: isStart ? 0x10b981 : isEnd ? 0xef4444 : route.colorHex,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.75
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = -Math.PI / 2;
          ring.position.set(pt.x, 0.15, pt.z);
          ring.userData = { isPulseBeacon: true };
          rGroup.add(ring);
        }
      });

      // 2. Centerline Tube
      if (pts.length >= 2) {
        const v3Points = pts.map((p) => new THREE.Vector3(p.x, p.y + 0.6, p.z));

        let curvePoints = v3Points;
        if (route.curveType === 'spline' && pts.length >= 3) {
          const curve = new THREE.CatmullRomCurve3(v3Points, false, 'centripetal', 0.4);
          curvePoints = curve.getPoints(50);
        }

        const pathCurve = new THREE.CatmullRomCurve3(curvePoints, false, 'centripetal', 0.1);
        const tubeGeo = new THREE.TubeGeometry(pathCurve, 64, isActive ? 0.45 : 0.32, 8, false);
        const tubeMat = new THREE.MeshStandardMaterial({
          color: route.colorHex,
          emissive: route.colorHex,
          emissiveIntensity: isActive ? 0.85 : 0.35,
          roughness: 0.2
        });
        const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        rGroup.add(tubeMesh);

        // 3. Corridor Ribbon (ROW)
        const halfWidthUnits = (route.corridorWidth / 2) * (scaleX / 111320 / Math.cos((centerLat * Math.PI) / 180));
        const ribbonGeo = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];

        for (let i = 0; i < curvePoints.length; i++) {
          const curr = curvePoints[i];
          let tangent = new THREE.Vector3();
          if (i < curvePoints.length - 1) {
            tangent.subVectors(curvePoints[i + 1], curr).normalize();
          } else {
            tangent.subVectors(curr, curvePoints[i - 1]).normalize();
          }
          const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

          const pLeft = new THREE.Vector3().addVectors(curr, normal.clone().multiplyScalar(halfWidthUnits));
          const pRight = new THREE.Vector3().addVectors(curr, normal.clone().multiplyScalar(-halfWidthUnits));

          vertices.push(pLeft.x, 0.35, pLeft.z);
          vertices.push(pRight.x, 0.35, pRight.z);

          if (i < curvePoints.length - 1) {
            const idx = i * 2;
            indices.push(idx, idx + 1, idx + 2);
            indices.push(idx + 1, idx + 3, idx + 2);
          }
        }

        ribbonGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        ribbonGeo.setIndex(indices);
        ribbonGeo.computeVertexNormals();

        const ribbonMat = new THREE.MeshStandardMaterial({
          color: route.colorHex,
          transparent: true,
          opacity: isActive ? 0.38 : 0.18,
          side: THREE.DoubleSide,
          roughness: 0.5
        });
        const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
        rGroup.add(ribbonMesh);
      }

      multiGroup.add(rGroup);
    });
  }, [routes, activeRouteId, scaleX, centerLat]);

  // Calculate Geometry & Connected ML for a Given Route
  const calculateRouteStatutoryAndML = useCallback(async (routeId, pts, bufferMeters) => {
    if (!pts || pts.length < 2) {
      setRoutes((prev) =>
        prev.map((r) => (r.id === routeId ? { ...r, points: pts, calculation: null, mlPrediction: null } : r))
      );
      return;
    }

    const totalLength = calculateTotalDistance(pts);
    const halfBuffer = bufferMeters / 2;
    const affected = [];

    let totalAcres = 0;
    let totalCost = 0;
    let countRequired = 0;
    let countInProgress = 0;
    let countCompleted = 0;
    let countConflict = 0;
    let countCompPending = 0;

    features.forEach((feature) => {
      const ring = feature.geometry?.coordinates?.[0];
      if (!ring || ring.length < 3) return;

      const props = feature.properties || {};
      const polyNodes = ring.map(([lng, lat]) => ({ lng, lat }));

      let isAffected = false;
      let reason = '';

      for (let idx = 0; idx < pts.length; idx++) {
        if (isPointInPolygon(pts[idx], ring)) {
          isAffected = true;
          reason = `Waypoint #${idx === 0 ? 'A (Start)' : idx === pts.length - 1 ? 'B (End)' : idx + 1} located inside parcel`;
          break;
        }
      }

      if (!isAffected) {
        for (let i = 0; i < pts.length - 1; i++) {
          const p1 = pts[i];
          const p2 = pts[i + 1];

          for (let k = 0; k < polyNodes.length; k++) {
            const dist = distanceToSegmentMeters(polyNodes[k], p1, p2, centerLat);
            if (dist <= halfBuffer) {
              isAffected = true;
              reason = `Boundary within ${dist.toFixed(1)}m of alignment centerline (ROW: ${bufferMeters}m)`;
              break;
            }
          }
          if (isAffected) break;
        }
      }

      if (isAffected) {
        const situation = classifyAcquisitionSituation(props);
        const acres = Number(props.area_acres || 1.25);
        const valuation = props.total_valuation_inr || acres * 1200000;

        totalAcres += acres;
        totalCost += valuation;

        if (situation.stateKey === 'CONFLICT') countConflict++;
        else if (situation.stateKey === 'IN_PROGRESS') countInProgress++;
        else if (situation.stateKey === 'COMPLETED') countCompleted++;
        else countRequired++;

        if (situation.compensationStatus && !situation.compensationStatus.includes('Disbursed')) {
          countCompPending++;
        }

        affected.push({
          id: feature.id,
          feature,
          parcel_id: props.parcel_id || `PARCEL-OD-KH-${feature.id.toString().padStart(3, '0')}`,
          plot_number: props.plot_number || 'N/A',
          survey_number: props.survey_number || `Plot #${props.plot_number || 'N/A'}`,
          khata_number: props.khata_number || 'N/A',
          village_name: props.village_name || 'Pipili',
          district: props.district || 'Khurda',
          landowner_name: props.landowner_name || props.owners?.[0]?.name || 'Recorded Landowner',
          area_acres: acres,
          valuation_inr: valuation,
          category: situation.stateKey === 'CONFLICT' ? 'Conflict' : situation.stateKey === 'COMPLETED' ? 'Completed' : situation.stateKey === 'IN_PROGRESS' ? 'In Progress' : 'Required',
          situationCondition: situation.label,
          acquisition_status: props.acquisition_status || situation.processStage,
          consent_status: situation.consentStatus,
          conflict_type: situation.conflictType,
          conflict_reason: situation.conflictReason,
          compensation_status: situation.compensationStatus,
          document_status: situation.documentStatus,
          survey_status: situation.surveyStatus,
          current_process_stage: situation.processStage,
          isConflict: situation.isConflict,
          reason
        });
      }
    });

    const calculation = {
      totalLengthMeters: totalLength,
      totalLengthFormatted: formatDistance(totalLength),
      startPoint: {
        label: 'Point A (Start)',
        lat: pts[0].lat,
        lng: pts[0].lng,
        village: affected[0]?.village_name || 'Project Origin'
      },
      endPoint: {
        label: 'Point B (Terminus)',
        lat: pts[pts.length - 1].lat,
        lng: pts[pts.length - 1].lng,
        village: affected[affected.length - 1]?.village_name || 'Project Terminus'
      },
      waypointsCount: pts.length,
      corridorWidthMeters: bufferMeters,
      affectedParcels: affected,
      totalAffectedAreaAcres: totalAcres.toFixed(2),
      totalAffectedAreaHa: (totalAcres * 0.404686).toFixed(2),
      estimatedCostInr: totalCost,
      countRequired,
      countInProgress,
      countCompleted,
      countPending: countRequired + countInProgress,
      countConflict,
      countCompPending
    };

    // ML Delay Prediction Request
    const totalCount = affected.length;
    const surveyDoneCount = affected.filter((p) => p.survey_status && p.survey_status.includes('Completed')).length;
    const surveyCompletedPct = totalCount > 0 ? (surveyDoneCount / totalCount) * 100 : 100;
    const docIssuesCount = affected.filter(
      (p) => p.document_status && (p.document_status.includes('Issue') || p.document_status.includes('Discrepancy') || p.document_status.includes('Pending'))
    ).length;
    const missingDocPct = totalCount > 0 ? (docIssuesCount / totalCount) * 100 : 0;
    const compDoneCount = affected.filter((p) => p.compensation_status && p.compensation_status.includes('Disbursed')).length;
    const compProgressPct = totalCount > 0 ? (compDoneCount / totalCount) * 100 : 0;

    const mlPayload = {
      total_parcels: totalCount,
      total_landowners: totalCount,
      total_land_area: totalAcres,
      estimated_compensation: totalCost,
      survey_completed_percentage: surveyCompletedPct,
      missing_documents_percentage: missingDocPct,
      compensation_disbursed_percentage: compProgressPct,
      active_objections_count: countConflict,
      legal_disputes_count: countConflict,
      encroachment_cases_count: 0
    };

    let mlPrediction = null;
    try {
      setMlLoading(true);
      const res = await predictionService.simulateRouteDelay(mlPayload);
      mlPrediction = res.data;
    } catch (err) {
      console.warn('ML Prediction fallback:', err);
      mlPrediction = {
        predicted_delay_days: Math.round(countConflict * 24 + countRequired * 4 + 12),
        delay_probability: countConflict > 1 ? 0.82 : countConflict === 1 ? 0.58 : 0.22,
        risk_level: countConflict > 1 ? 'High' : countConflict === 1 ? 'Medium' : 'Low',
        contributing_factors: [
          { factor: 'Acquisition Conflicts', impact: countConflict * 25, direction: 'increases_risk', description: `${countConflict} contested parcels` }
        ]
      };
    } finally {
      setMlLoading(false);
    }

    setRoutes((prev) =>
      prev.map((r) =>
        r.id === routeId ? { ...r, points: pts, corridorWidth: bufferMeters, calculation, mlPrediction } : r
      )
    );
  }, [features, centerLat, classifyAcquisitionSituation, calculateTotalDistance]);

  // Pre-seed Demo Alignments & Re-calculate on Features Change
  useEffect(() => {
    if (!features.length) return;

    routes.forEach((r) => {
      if (r.points && r.points.length >= 2) {
        calculateRouteStatutoryAndML(r.id, r.points, r.corridorWidth);
      }
    });
  }, [features]);

  // Initial Sample Route Loading
  useEffect(() => {
    if (!rawFeatures.length) return;

    const samplePtsOrig = [
      { lng: 85.8180, lat: 20.1840, x: -65, y: 0.4, z: -55 },
      { lng: 85.8235, lat: 20.1795, x: -10, y: 0.4, z: -10 },
      { lng: 85.8300, lat: 20.1730, x: 55, y: 0.4, z: 50 }
    ];

    const samplePtsAlt1 = [
      { lng: 85.8175, lat: 20.1855, x: -70, y: 0.4, z: -68 },
      { lng: 85.8210, lat: 20.1830, x: -35, y: 0.4, z: -45 },
      { lng: 85.8285, lat: 20.1760, x: 40, y: 0.4, z: 20 },
      { lng: 85.8315, lat: 20.1710, x: 70, y: 0.4, z: 68 }
    ];

    const samplePtsAlt2 = [
      { lng: 85.8160, lat: 20.1820, x: -85, y: 0.4, z: -35 },
      { lng: 85.8250, lat: 20.1750, x: 5, y: 0.4, z: 30 },
      { lng: 85.8290, lat: 20.1715, x: 45, y: 0.4, z: 65 }
    ];

    calculateRouteStatutoryAndML('route-original', samplePtsOrig, 30);
    calculateRouteStatutoryAndML('route-alt-1', samplePtsAlt1, 30);
    calculateRouteStatutoryAndML('route-alt-2', samplePtsAlt2, 30);
  }, [rawFeatures]);

  // Add a New Alternative Route
  const addNewAlternativeRoute = () => {
    if (routes.length >= 5) {
      showToast('Maximum of 5 route alternatives supported simultaneously.');
      return;
    }
    const nextIdx = routes.length;
    const palette = ROUTE_PALETTE[nextIdx % ROUTE_PALETTE.length];
    const newRoute = {
      id: `route-alt-${Date.now()}`,
      name: `Alternative Route ${nextIdx}`,
      colorHex: palette.colorHex,
      hex: palette.hex,
      cssText: palette.cssText,
      cssBg: palette.cssBg,
      points: [],
      corridorWidth: 30,
      curveType: 'spline',
      visible: true,
      calculation: null,
      mlPrediction: null
    };

    setRoutes((prev) => [...prev, newRoute]);
    setActiveRouteId(newRoute.id);
    setActiveTool('create_route');
    setShowRoutePanel(true);
    setRouteActiveTab('active_route');
    showToast(`Created ${newRoute.name}. Click on 3D map to place alignment waypoints.`);
  };

  // Delete Alternative Route
  const deleteAlternativeRoute = (routeId) => {
    if (routeId === 'route-original') {
      showToast('The Original Alignment cannot be deleted.');
      return;
    }
    setRoutes((prev) => prev.filter((r) => r.id !== routeId));
    if (activeRouteId === routeId) {
      setActiveRouteId('route-original');
    }
    showToast('Alternative route deleted.');
  };

  // Toggle Route Visibility
  const toggleRouteVisibility = (routeId) => {
    setRoutes((prev) =>
      prev.map((r) => (r.id === routeId ? { ...r, visible: !r.visible } : r))
    );
  };

  // Mouse Interaction Handlers
  const handlePointerDown = (e) => {
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  };

  const handlePointerMove = (e) => {
    const dx = Math.abs(e.clientX - pointerDownPosRef.current.x);
    const dy = Math.abs(e.clientY - pointerDownPosRef.current.y);
    if (dx > 4 || dy > 4) {
      isDraggingRef.current = true;
    }

    const rect = mountRef.current?.getBoundingClientRect();
    if (!rect || !cameraRef.current || !groundPlaneRef.current) return;

    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    if (activeTool === 'select') {
      const parcelMeshes = Array.from(meshesMapRef.current.values());
      const intersects = raycasterRef.current.intersectObjects(parcelMeshes, true);

      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit && !hit.userData?.feature && hit.parent) {
          hit = hit.parent;
        }
        if (hit?.userData?.feature) {
          setHoveredFeature(hit.userData.feature);
          if (mountRef.current) mountRef.current.style.cursor = 'pointer';
          return;
        }
      }
      setHoveredFeature(null);
      if (mountRef.current) mountRef.current.style.cursor = 'default';
    } else {
      const groundHits = raycasterRef.current.intersectObject(groundPlaneRef.current);
      if (groundHits.length > 0) {
        const pt = groundHits[0].point;
        const geo = worldToGeo(pt);
        setCursorGeoPos({ ...geo, x: pt.x, z: pt.z });
        if (mountRef.current) mountRef.current.style.cursor = 'crosshair';
      }
    }
  };

  const handlePointerUp = (e) => {
    if (isDraggingRef.current) return;

    const rect = mountRef.current?.getBoundingClientRect();
    if (!rect || !cameraRef.current || !groundPlaneRef.current) return;

    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    if (activeTool === 'select') {
      const parcelMeshes = Array.from(meshesMapRef.current.values());
      const intersects = raycasterRef.current.intersectObjects(parcelMeshes, true);

      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit && !hit.userData?.feature && hit.parent) {
          hit = hit.parent;
        }
        if (hit?.userData?.feature) {
          const feat = hit.userData.feature;
          setSelectedFeature(feat);
          if (onSelectParcel) onSelectParcel(feat.id);

          if (activeRoute?.calculation?.affectedParcels) {
            const aff = activeRoute.calculation.affectedParcels.find((p) => p.id === feat.id);
            setSelectedAffectedParcel(aff || null);
          }
          return;
        }
      }
      setSelectedFeature(null);
      setSelectedAffectedParcel(null);
      if (onSelectParcel) onSelectParcel(null);
    } else if (activeTool === 'create_route') {
      const groundHits = raycasterRef.current.intersectObject(groundPlaneRef.current);
      if (groundHits.length > 0) {
        const pt = groundHits[0].point;
        const geo = worldToGeo(pt);
        const newWaypoint = { lat: geo.lat, lng: geo.lng, x: pt.x, y: 0.4, z: pt.z };
        const updatedPoints = [...activeRoute.points, newWaypoint];

        calculateRouteStatutoryAndML(activeRoute.id, updatedPoints, activeRoute.corridorWidth);
        showToast(`Added Waypoint #${updatedPoints.length} to ${activeRoute.name}`);
      }
    } else if (activeTool === 'measure_distance' || activeTool === 'measure_area' || activeTool === 'draw_line' || activeTool === 'draw_polygon') {
      const groundHits = raycasterRef.current.intersectObject(groundPlaneRef.current);
      if (groundHits.length > 0) {
        const pt = groundHits[0].point;
        const geo = worldToGeo(pt);
        const newPt = { lat: geo.lat, lng: geo.lng, x: pt.x, y: 0.4, z: pt.z };
        setActivePoints((prev) => [...prev, newPt]);
      }
    } else if (activeTool === 'mark_point') {
      const groundHits = raycasterRef.current.intersectObject(groundPlaneRef.current);
      if (groundHits.length > 0) {
        const pt = groundHits[0].point;
        const geo = worldToGeo(pt);
        const newAnno = {
          id: `point-${Date.now()}`,
          type: 'point',
          name: `Survey Benchmark #${surveyAnnotations.length + 1}`,
          points: [{ lat: geo.lat, lng: geo.lng, x: pt.x, y: 0.4, z: pt.z }],
          measurement: { lat: geo.lat, lng: geo.lng, elevation: '0.4m AGL' },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setSurveyAnnotations((prev) => [...prev, newAnno]);
        showToast(`Placed Landmark Pin at ${geo.lat}°, ${geo.lng}°`);
        setActiveTool('select');
      }
    }
  };

  // Focus Camera on Selected Parcel
  const focusOnSelected = (feature) => {
    if (!feature) return;
    const mesh = meshesMapRef.current.get(feature.id);
    if (mesh && controlsRef.current && cameraRef.current) {
      const c = mesh.userData.centroid;
      controlsRef.current.target.set(c.x, 0, c.z);
      cameraRef.current.position.set(c.x, 40, c.z + 50);
      controlsRef.current.update();
    }
  };

  const resetCamera = () => {
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      cameraRef.current.position.set(0, 115, 165);
      controlsRef.current.update();
      showToast('3D View reset to default perspective');
    }
  };

  const activeStateInfo = selectedFeature ? getVisualStateInfo(selectedFeature.properties || {}) : null;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-950 select-none" style={{ height }}>
      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        className="w-full h-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-sky-500/80 px-4 py-2 rounded-2xl shadow-2xl text-xs font-semibold text-white flex items-center gap-2 animate-fadeIn backdrop-blur-md">
          <Info className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP WHAT-IF SIMULATION SCENARIO COMPARISON HUD */}
      {isWhatIfMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl px-4 animate-fadeIn">
          <div className="bg-slate-900/95 backdrop-blur-xl border-2 border-amber-500/80 p-3 rounded-3xl shadow-2xl text-white space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                  <FlaskConical className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider block">
                    What-If Simulation Sandbox Active
                  </span>
                  <span className="text-[9.5px] text-slate-400">
                    Temporary in-memory sandbox. Official database records remain unaffected.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={resetWhatIfSimulation}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-[10px] border border-slate-700 transition-all"
                  title="Reset simulated parcel overrides to baseline state"
                >
                  <RefreshCw className="w-3 h-3 text-amber-400" />
                  <span>Reset Sandbox</span>
                </button>

                <button
                  onClick={exitWhatIfSimulation}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold text-[10px] border border-rose-800 transition-all"
                  title="Exit What-If Sandbox"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Exit Simulation</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Current Scenario</span>
                  <span className="text-[9.5px] text-slate-400 font-mono">{baselineScenario?.routeName || activeRoute.name}</span>
                </div>
                <div className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Affected parcels:</span>
                    <span className="font-bold text-white">{baselineScenario?.calculation?.affectedParcels?.length || activeRoute.calculation?.affectedParcels?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Conflicts:</span>
                    <span className="font-bold text-rose-400">{baselineScenario?.calculation?.countConflict ?? activeRoute.calculation?.countConflict ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Predicted delay:</span>
                    <span className="font-bold text-amber-300">
                      {baselineScenario?.mlPrediction ? `+${baselineScenario.mlPrediction.predicted_delay_days} days` : activeRoute.mlPrediction ? `+${activeRoute.mlPrediction.predicted_delay_days} days` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-950/30 p-2.5 rounded-2xl border border-amber-500/50 space-y-1">
                <div className="flex items-center justify-between border-b border-amber-500/30 pb-1">
                  <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Simulated Scenario</span>
                  </span>
                  <span className="text-[9.5px] text-amber-300 font-mono">{activeRoute.name}</span>
                </div>
                <div className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Affected parcels:</span>
                    <span className="font-bold text-purple-300">{activeRoute.calculation?.affectedParcels?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Conflicts:</span>
                    <span className={`font-bold ${activeRoute.calculation?.countConflict > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {activeRoute.calculation?.countConflict || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Predicted delay:</span>
                    <span className="font-bold text-emerald-300">
                      {activeRoute.mlPrediction ? `+${activeRoute.mlPrediction.predicted_delay_days} days` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP LEFT: COMPLETE 3D GIS SURVEY & AI MEASUREMENT CALCULATOR TOOLBAR */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5 bg-slate-900/95 backdrop-blur-xl p-2 rounded-2xl border border-slate-700 shadow-2xl">
        {/* Tool 1: Select Parcel */}
        <button
          onClick={() => {
            setActiveTool('select');
            setActivePoints([]);
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
            activeTool === 'select' ? 'bg-sky-600 text-white shadow-md ring-1 ring-sky-300' : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Select and Inspect 3D Land Parcels"
        >
          <MousePointer className="w-3.5 h-3.5 text-sky-300" />
          <span>Select</span>
        </button>

        {/* Tool 2: AI Measure Distance */}
        <button
          onClick={() => {
            setActiveTool('measure_distance');
            setActivePoints([]);
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
            activeTool === 'measure_distance' ? 'bg-sky-600 text-white shadow-md ring-1 ring-sky-300' : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Measure Geodesic Distance along Path (Meters/Km)"
        >
          <Ruler className="w-3.5 h-3.5 text-sky-300" />
          <span>Distance</span>
        </button>

        {/* Tool 3: AI Measure Area */}
        <button
          onClick={() => {
            setActiveTool('measure_area');
            setActivePoints([]);
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
            activeTool === 'measure_area' ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-300' : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Measure Polygon Area (Acres, Ha, m²)"
        >
          <Maximize2 className="w-3.5 h-3.5 text-emerald-300" />
          <span>Area</span>
        </button>

        {/* Tool 4: Mark Point Pin */}
        <button
          onClick={() => {
            setActiveTool('mark_point');
            setActivePoints([]);
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
            activeTool === 'mark_point' ? 'bg-amber-600 text-white shadow-md ring-1 ring-amber-300' : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Place Landmark / Benchmark Pin"
        >
          <MapPin className="w-3.5 h-3.5 text-amber-300" />
          <span>Pin</span>
        </button>

        {/* Tool 5: Draw Line Corridor */}
        <button
          onClick={() => {
            setActiveTool('draw_line');
            setActivePoints([]);
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
            activeTool === 'draw_line' ? 'bg-rose-600 text-white shadow-md ring-1 ring-rose-300' : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Draw Survey Corridor Line"
        >
          <Spline className="w-3.5 h-3.5 text-rose-300" />
          <span>Line</span>
        </button>

        {/* Tool 6: Draw Polygon Zone */}
        <button
          onClick={() => {
            setActiveTool('draw_polygon');
            setActivePoints([]);
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
            activeTool === 'draw_polygon' ? 'bg-purple-600 text-white shadow-md ring-1 ring-purple-300' : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Draw Survey Boundary Polygon"
        >
          <Pentagon className="w-3.5 h-3.5 text-purple-300" />
          <span>Polygon</span>
        </button>

        <div className="h-5 w-px bg-slate-700 mx-0.5"></div>

        {/* Alignment Design & Simulation Launcher */}
        <button
          onClick={() => {
            setActiveTool('create_route');
            setShowRoutePanel(true);
            setRouteActiveTab('active_route');
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
            activeTool === 'create_route' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-400 hover:bg-slate-800'
          }`}
          title="Design and Edit Proposed Alignments"
        >
          <Route className="w-3.5 h-3.5" />
          <span>Alignment</span>
        </button>

        {/* Compare Alignments */}
        <button
          onClick={() => {
            setShowRoutePanel(true);
            setRouteActiveTab('route_comparison');
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
            showRoutePanel && routeActiveTab === 'route_comparison'
              ? 'bg-amber-600 text-white shadow-md ring-1 ring-amber-400'
              : 'text-amber-300 hover:bg-slate-800 border border-amber-500/30'
          }`}
          title="Compare Alternative Project Alignments"
        >
          <Scale className="w-3.5 h-3.5 text-amber-400" />
          <span>Compare</span>
        </button>

        {/* Start / Exit What-If Simulation */}
        {!isWhatIfMode ? (
          <button
            onClick={startWhatIfSimulation}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md border border-purple-400/50 transition-all"
            title="Start Interactive What-If Simulation"
          >
            <FlaskConical className="w-3.5 h-3.5 text-purple-200" />
            <span>What-If</span>
          </button>
        ) : (
          <button
            onClick={exitWhatIfSimulation}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs bg-rose-700 hover:bg-rose-600 text-white shadow-md border border-rose-500 transition-all"
            title="Exit Simulation"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        )}

        <div className="h-5 w-px bg-slate-700 mx-0.5"></div>

        {/* Clear Measurements / Drawings */}
        {(activePoints.length > 0 || surveyAnnotations.length > 0) && (
          <button
            onClick={clearAllDrawings}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-xs font-bold transition-all border border-slate-700"
            title="Clear All Measurements"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={resetCamera}
          className="flex items-center gap-1 px-2 py-1.5 rounded-xl font-semibold text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          title="Reset 3D Perspective"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ACTIVE AI GIS MEASUREMENT DRAWING HUD (LIVE LENGTH & AREA CALCULATOR) */}
      {activeTool !== 'select' && activeTool !== 'create_route' && (
        <div className="absolute top-16 left-4 z-20 bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-sky-500/60 shadow-2xl text-xs text-white max-w-sm space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-sky-400 uppercase tracking-wider text-[11px]">
              {activeTool === 'measure_distance' && <Ruler className="w-4 h-4 text-sky-400" />}
              {activeTool === 'measure_area' && <Maximize2 className="w-4 h-4 text-emerald-400" />}
              {activeTool === 'mark_point' && <MapPin className="w-4 h-4 text-amber-400" />}
              {activeTool === 'draw_line' && <Spline className="w-4 h-4 text-rose-400" />}
              {activeTool === 'draw_polygon' && <Pentagon className="w-4 h-4 text-purple-400" />}
              <span>
                {activeTool === 'measure_distance' && 'AI Distance Calculator'}
                {activeTool === 'measure_area' && 'AI Land Area Calculator'}
                {activeTool === 'mark_point' && 'Landmark Landmark Marker'}
                {activeTool === 'draw_line' && 'Survey Line Drawing'}
                {activeTool === 'draw_polygon' && 'Survey Polygon Zone'}
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {activePoints.length} Points
            </span>
          </div>

          <p className="text-[10.5px] text-slate-300">
            {activeTool === 'mark_point'
              ? 'Click anywhere on the terrain or parcel surface to place a 3D survey landmark pin.'
              : 'Click on the 3D map to place vertex points. Click Finish to calculate and save.'}
          </p>

          {/* Dynamic AI Measurement Value Display */}
          {liveActiveMeasurement && (
            <div className="bg-sky-950/70 border border-sky-700/60 p-2 rounded-xl text-sky-200">
              <span className="text-[10px] uppercase font-bold text-sky-400 block">{liveActiveMeasurement.label}</span>
              <span className="text-sm font-extrabold text-white">{liveActiveMeasurement.value}</span>
            </div>
          )}

          {cursorGeoPos && (
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-800/60">
              <span>Cursor GPS:</span>
              <span className="text-slate-200">{cursorGeoPos.lat}°, {cursorGeoPos.lng}°</span>
            </div>
          )}

          {activeTool !== 'mark_point' && (
            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={finishActiveDrawing}
                disabled={activePoints.length < (activeTool.includes('area') || activeTool.includes('polygon') ? 3 : 2)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-[11px] transition-all shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Finish & Save</span>
              </button>

              <button
                onClick={undoLastPoint}
                disabled={activePoints.length === 0}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-[11px] font-bold border border-slate-700"
                title="Undo last point"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={cancelActiveDrawing}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-[11px] font-bold border border-slate-700"
                title="Cancel measurement"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Top Right: Route Switcher & Comparison Modal Launcher */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <div className="bg-slate-900/95 backdrop-blur-xl px-3 py-1.5 rounded-2xl border border-slate-700 shadow-2xl flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Route:</span>
          <select
            value={activeRouteId}
            onChange={(e) => selectAndHighlightRoute(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} {r.calculation ? `(${r.calculation.totalLengthFormatted})` : '(Not Drawn)'}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowRoutePanel(!showRoutePanel)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl font-bold text-xs shadow-2xl backdrop-blur-xl border transition-all ${
            showRoutePanel
              ? 'bg-sky-600 text-white border-sky-400'
              : 'bg-slate-900/95 text-sky-400 border-slate-700 hover:bg-slate-800'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Alignments Hub</span>
        </button>

        <button
          onClick={() => setShowComparisonModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white shadow-2xl backdrop-blur-xl border border-amber-400 transition-all"
          title="Open Side-by-Side Comparison Matrix"
        >
          <Scale className="w-4 h-4" />
          <span>Comparison Matrix</span>
        </button>
      </div>

      {/* 3D PROJECT ALIGNMENTS CONTROL & WHAT-IF DRAWER */}
      {showRoutePanel && (
        <div className="absolute top-16 left-4 z-30 w-96 bg-slate-900/95 backdrop-blur-xl border border-sky-500/70 p-4 rounded-3xl shadow-2xl text-white text-xs animate-fadeIn space-y-3.5 max-h-[calc(100%-5rem)] overflow-y-auto">
          <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-sky-400">
                  Project Alignments Hub
                </span>
                {isWhatIfMode && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    What-If Mode
                  </span>
                )}
              </div>
              <h3 className="text-base font-extrabold text-white mt-0.5">
                Route Simulation & Comparison
              </h3>
            </div>
            <button
              onClick={() => setShowRoutePanel(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Navigation Tabs */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            {[
              { id: 'routes_list', label: 'Alignments' },
              { id: 'route_comparison', label: 'Comparison' },
              { id: 'whatif_sandbox', label: 'What-If' },
              { id: 'active_route', label: 'Editor & Details' },
              { id: 'ai_predict', label: 'ML Risk' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRouteActiveTab(tab.id)}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  routeActiveTab === tab.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: ALL ALIGNMENTS LIST */}
          {routeActiveTab === 'routes_list' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="space-y-2">
                {routes.map((route) => (
                  <div
                    key={route.id}
                    className={`p-3 rounded-2xl border transition-all space-y-2 ${
                      route.id === activeRouteId
                        ? 'bg-slate-800/90 border-sky-500/80 shadow-md ring-1 ring-sky-500/40'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${route.cssBg} shadow-sm`}></span>
                        <span className="font-extrabold text-white text-xs">{route.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleRouteVisibility(route.id)}
                          className={`p-1 rounded-lg hover:bg-slate-700 ${
                            route.visible ? 'text-sky-400' : 'text-slate-500'
                          }`}
                          title={route.visible ? 'Hide Alignment in 3D' : 'Show Alignment in 3D'}
                        >
                          {route.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        {route.id !== 'route-original' && (
                          <button
                            onClick={() => deleteAlternativeRoute(route.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-700"
                            title="Delete Alternative Alignment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {route.calculation ? (
                      <div className="grid grid-cols-3 gap-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 text-[10px]">
                        <div>
                          <span className="text-slate-400 block text-[9px]">Length</span>
                          <span className="font-bold text-white">{route.calculation.totalLengthFormatted}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">Affected</span>
                          <span className="font-bold text-purple-300">{route.calculation.affectedParcels.length} Plots</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">Conflicts</span>
                          <span className={`font-bold ${route.calculation.countConflict > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {route.calculation.countConflict} Plots
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 italic">
                        {(!route.points || route.points.length === 0)
                          ? 'No points drawn yet. Click Select to draw in 3D.'
                          : '1 point placed. Add endpoint to calculate.'}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => {
                          selectAndHighlightRoute(route.id);
                          setRouteActiveTab('active_route');
                        }}
                        className={`text-[10.5px] px-2.5 py-1 rounded-xl font-bold transition-all ${
                          route.id === activeRouteId
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {route.id === activeRouteId ? 'Highlighting in 3D' : 'Highlight & Edit'}
                      </button>

                      {route.mlPrediction && (
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          route.mlPrediction.risk_level === 'High'
                            ? 'bg-rose-950 border border-rose-800 text-rose-300'
                            : route.mlPrediction.risk_level === 'Medium'
                            ? 'bg-amber-950 border border-amber-800 text-amber-300'
                            : 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                        }`}>
                          {route.mlPrediction.risk_level} (+{route.mlPrediction.predicted_delay_days}d)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={addNewAlternativeRoute}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] border border-slate-700 shadow-md transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-sky-400" />
                  <span>Add Alternative Route</span>
                </button>

                <button
                  onClick={() => setShowComparisonModal(true)}
                  className="flex items-center justify-center gap-1 py-2 px-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] shadow-md transition-all"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Matrix</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ROUTE COMPARISON INTERFACE */}
          {routeActiveTab === 'route_comparison' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Factual Alignment Comparison
                </span>
                <button
                  onClick={() => setShowComparisonModal(true)}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Full Matrix</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {routes.map((route) => {
                  const calc = route.calculation;
                  const ml = route.mlPrediction;
                  const isSelectedIn3D = route.id === activeRouteId;

                  return (
                    <div
                      key={route.id}
                      className={`p-3 rounded-2xl border transition-all space-y-2.5 ${
                        isSelectedIn3D
                          ? 'bg-slate-800/90 border-sky-400 shadow-lg ring-1 ring-sky-400/50'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${route.cssBg} shadow-sm`}></span>
                          <span className="font-extrabold text-white text-xs">{route.name}</span>
                        </div>
                        {isSelectedIn3D && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40">
                            Active in 3D
                          </span>
                        )}
                      </div>

                      {calc ? (
                        <div className="space-y-2 text-[10.5px]">
                          <div className="grid grid-cols-2 gap-1.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                            <div>
                              <span className="text-slate-400 block text-[9.5px]">Route Length</span>
                              <span className="font-extrabold text-white">{calc.totalLengthFormatted}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9.5px]">Affected Parcels</span>
                              <span className="font-extrabold text-purple-300">
                                {calc.affectedParcels.length} Plots ({calc.totalAffectedAreaAcres} Ac)
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9.5px]">Acquisition Required</span>
                              <span className="font-extrabold text-indigo-300">{calc.countRequired} Plots</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9.5px]">Conflict Parcels</span>
                              <span className={`font-extrabold ${calc.countConflict > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {calc.countConflict} Plots
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9.5px]">Pending Acquisition</span>
                              <span className="font-extrabold text-amber-300">{calc.countPending} Plots</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9.5px]">Compensation Pending</span>
                              <span className="font-extrabold text-slate-200">{calc.countCompPending} Plots</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                            <div>
                              <span className="text-slate-400 block text-[9.5px]">Predicted Delay</span>
                              <span className="font-extrabold text-amber-300 text-xs">
                                {ml ? `+${ml.predicted_delay_days} Days` : 'Calculating...'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-400 block text-[9.5px]">Delay Risk</span>
                              {ml ? (
                                <span className={`font-extrabold text-[10px] uppercase ${
                                  ml.risk_level === 'High' ? 'text-rose-400' : ml.risk_level === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                                }`}>
                                  {ml.risk_level} Risk ({(ml.delay_probability * 100).toFixed(0)}%)
                                </span>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-950/60 rounded-xl text-slate-400 text-[10px] italic">
                          Alignment not yet drawn.
                        </div>
                      )}

                      <button
                        onClick={() => selectAndHighlightRoute(route.id)}
                        className={`w-full py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                          isSelectedIn3D
                            ? 'bg-sky-600 text-white shadow-md'
                            : 'bg-slate-800 text-sky-300 hover:bg-slate-700 border border-slate-700'
                        }`}
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>{isSelectedIn3D ? 'Highlighting in 3D Scene' : 'Select & Highlight in 3D'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: WHAT-IF SIMULATION SANDBOX CONTROLS */}
          {routeActiveTab === 'whatif_sandbox' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="bg-gradient-to-r from-amber-950/60 to-purple-950/60 p-3 rounded-2xl border border-amber-500/50 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs">
                  <FlaskConical className="w-4 h-4 text-amber-400" />
                  <span>What-If Sandbox Levers</span>
                </div>
                <p className="text-[10.5px] text-slate-300 leading-relaxed">
                  Experiment with hypothetical statutory conditions on the active alignment without altering government databases.
                </p>

                <div className="pt-2 border-t border-slate-800 grid grid-cols-1 gap-1.5">
                  <button
                    onClick={handleBulkResolveConflicts}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10.5px] shadow transition-all"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Simulate All Conflicts Resolved</span>
                  </button>

                  <button
                    onClick={handleBulkInjectObjections}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold text-[10.5px] border border-rose-800 transition-all"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Simulate Objections Escalation</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-2 text-[11px]">
                <span className="font-bold text-slate-300 block text-[10px] uppercase tracking-wider">
                  How to test specific parcel changes:
                </span>
                <p className="text-slate-400 text-[10px]">
                  Click on any parcel in the 3D scene (or from the list below). The Parcel Inspector on the right will unlock interactive simulation toggles for Consent, Compensation, Survey, and Document status.
                </p>

                {activeRoute.calculation?.affectedParcels && (
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1 pt-1">
                    {activeRoute.calculation.affectedParcels.map((p) => {
                      const isOverridden = Boolean(simulatedOverrides[p.id]);
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedFeature(p.feature);
                            focusOnSelected(p.feature);
                          }}
                          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-[10px] ${
                            isOverridden
                              ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                              : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div>
                            <span className="font-bold block text-white">{p.survey_number}</span>
                            <span className="text-[9px] text-slate-400">{p.landowner_name}</span>
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            isOverridden ? 'bg-amber-900 text-amber-200' : p.isConflict ? 'bg-rose-900 text-rose-200' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isOverridden ? 'Simulated' : p.situationCondition}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ACTIVE ROUTE EDITOR & BREAKDOWN */}
          {routeActiveTab === 'active_route' && (
            <div className="space-y-3 animate-fadeIn">
              {/* Route Alignment Interactive Editing Controls */}
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded-full ${activeRoute.cssBg}`}></span>
                    <span className="font-extrabold text-white text-xs">{activeRoute.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{activeRoute.points.length} Waypoints</span>
                </div>

                {/* Corridor Buffer Slider */}
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-slate-400">Right-of-Way Corridor Width:</span>
                    <span className="font-bold text-sky-300">{activeRoute.corridorWidth} meters</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={activeRoute.corridorWidth}
                    onChange={(e) => handleCorridorWidthChange(e.target.value)}
                    className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                  />
                </div>

                {/* Alignment Tools Action Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    onClick={toggleCurveType}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 transition-all"
                    title="Toggle between Catmull-Rom Smooth Spline and Straight Polyline"
                  >
                    <Spline className="w-3 h-3 text-sky-400" />
                    <span>{activeRoute.curveType === 'spline' ? 'Spline' : 'Polyline'}</span>
                  </button>

                  <button
                    onClick={undoLastWaypoint}
                    disabled={!activeRoute.points || activeRoute.points.length === 0}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-slate-200 disabled:opacity-40 text-[10px] font-bold border border-slate-700 transition-all"
                    title="Remove last placed waypoint"
                  >
                    <Undo2 className="w-3 h-3 text-amber-400" />
                    <span>Undo Point</span>
                  </button>

                  <button
                    onClick={clearActiveRouteWaypoints}
                    disabled={!activeRoute.points || activeRoute.points.length === 0}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-200 hover:text-rose-300 disabled:opacity-40 text-[10px] font-bold border border-slate-700 hover:border-rose-800 transition-all"
                    title="Clear all waypoints on this route"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Statutory Metric Breakdown */}
              {activeRoute.calculation ? (
                <>
                  <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 space-y-2">
                    <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center justify-between border-b border-slate-700/50 pb-1.5">
                      <span>{activeRoute.name} Impact Summary</span>
                      <span className="font-mono text-sky-400">{activeRoute.calculation.affectedParcels.length} Plots</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[9.5px]">Total Length</span>
                        <span className="font-extrabold text-white text-sm">{activeRoute.calculation.totalLengthFormatted}</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[9.5px]">Total Acreage</span>
                        <span className="font-extrabold text-emerald-400 text-sm">{activeRoute.calculation.totalAffectedAreaAcres} Ac</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[9.5px]">Pending Acquisition</span>
                        <span className="font-extrabold text-indigo-400 text-sm">{activeRoute.calculation.countPending} Plots</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-rose-950">
                        <span className="text-slate-400 block text-[9.5px]">Conflict Parcels</span>
                        <span className="font-extrabold text-rose-400 text-sm">{activeRoute.calculation.countConflict} Plots</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {activeRoute.calculation.affectedParcels.map((parcel) => (
                      <div
                        key={parcel.id}
                        onClick={() => {
                          setSelectedFeature(parcel.feature);
                          focusOnSelected(parcel.feature);
                        }}
                        className={`p-2 rounded-2xl border transition-all cursor-pointer ${
                          parcel.isConflict
                            ? 'bg-rose-950/50 border-rose-800 hover:bg-rose-900/60'
                            : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{parcel.survey_number}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                            parcel.isConflict ? 'bg-rose-900 text-rose-200' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {parcel.situationCondition}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-300 mt-1 flex justify-between">
                          <span>{parcel.landowner_name} • {parcel.area_acres} Ac</span>
                          <span className="text-sky-400 font-mono text-[9px]">Focus</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-4 bg-slate-800/50 rounded-2xl text-center text-slate-400 text-xs">
                  Click on 3D canvas to place alignment waypoints for {activeRoute.name}.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ML DELAY PREDICTION FOR ACTIVE ROUTE */}
          {routeActiveTab === 'ai_predict' && (
            <div className="space-y-3 animate-fadeIn">
              {activeRoute.mlPrediction ? (
                <>
                  <div className={`p-3.5 rounded-2xl border space-y-2.5 shadow-xl ${
                    activeRoute.mlPrediction.risk_level === 'High'
                      ? 'bg-rose-950/70 border-rose-800'
                      : activeRoute.mlPrediction.risk_level === 'Medium'
                      ? 'bg-amber-950/70 border-amber-800'
                      : 'bg-emerald-950/70 border-emerald-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-slate-300">
                        <BrainCircuit className="w-4 h-4 text-sky-400" />
                        <span>ML Prediction: {activeRoute.name}</span>
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase ${
                        activeRoute.mlPrediction.risk_level === 'High'
                          ? 'bg-rose-900 border border-rose-700 text-rose-200'
                          : activeRoute.mlPrediction.risk_level === 'Medium'
                          ? 'bg-amber-900 border border-amber-700 text-amber-200'
                          : 'bg-emerald-900 border border-emerald-700 text-emerald-200'
                      }`}>
                        {activeRoute.mlPrediction.risk_level} Risk
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Delay Probability</span>
                        <span className="text-xl font-extrabold text-white">
                          {(activeRoute.mlPrediction.delay_probability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Predicted Slippage</span>
                        <span className="text-xl font-extrabold text-amber-300">
                          +{activeRoute.mlPrediction.predicted_delay_days} Days
                        </span>
                      </div>
                    </div>
                  </div>

                  {activeRoute.mlPrediction.contributing_factors && (
                    <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 space-y-2">
                      <span className="font-extrabold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                        <span>Key Delay Drivers</span>
                      </span>

                      <div className="space-y-1.5">
                        {activeRoute.mlPrediction.contributing_factors.map((cf, idx) => (
                          <div key={idx} className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-[10.5px]">
                            <div className="flex justify-between font-bold">
                              <span>{cf.factor}</span>
                              <span className={cf.direction === 'increases_risk' ? 'text-rose-400' : 'text-emerald-400'}>
                                {cf.impact > 0 ? `+${cf.impact}` : cf.impact}
                              </span>
                            </div>
                            <p className="text-[9.5px] text-slate-400">{cf.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 bg-slate-800/50 rounded-2xl text-center text-slate-400 text-xs">
                  Place waypoints to run real-time ML delay predictions for {activeRoute.name}.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* OBJECTIVE SIDE-BY-SIDE ROUTE COMPARISON MATRIX MODAL */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-sky-500/70 rounded-3xl shadow-2xl w-full max-w-5xl p-6 text-white text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-extrabold text-white">
                    Objective Alignment Comparison Interface
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Factual statutory and ML predictive evaluation across project route alternatives.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <button
                    onClick={() => setComparisonViewMode('cards')}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all ${
                      comparisonViewMode === 'cards' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Card Comparison
                  </button>
                  <button
                    onClick={() => setComparisonViewMode('table')}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all ${
                      comparisonViewMode === 'table' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Table Matrix
                  </button>
                </div>

                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {comparisonViewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {routes.map((route) => {
                  const calc = route.calculation;
                  const ml = route.mlPrediction;
                  const isSelectedIn3D = route.id === activeRouteId;

                  return (
                    <div
                      key={route.id}
                      className={`p-4 rounded-3xl border transition-all space-y-3.5 ${
                        isSelectedIn3D
                          ? 'bg-slate-800/90 border-sky-400 shadow-xl ring-2 ring-sky-400/40'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-3.5 h-3.5 rounded-full ${route.cssBg} shadow-sm`}></span>
                          <span className="font-extrabold text-white text-sm">{route.name}</span>
                        </div>
                        {isSelectedIn3D && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40">
                            Active in 3D
                          </span>
                        )}
                      </div>

                      {calc ? (
                        <div className="space-y-2 text-[11px]">
                          <div className="space-y-1.5 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
                            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                              <span className="text-slate-400">Route Length:</span>
                              <span className="font-mono font-extrabold text-white">{calc.totalLengthFormatted}</span>
                            </div>

                            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                              <span className="text-slate-400">Affected Parcels:</span>
                              <span className="font-extrabold text-purple-300">
                                {calc.affectedParcels.length} Plots ({calc.totalAffectedAreaAcres} Ac)
                              </span>
                            </div>

                            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                              <span className="text-slate-400">Acquisition Required:</span>
                              <span className="font-extrabold text-indigo-300">{calc.countRequired} Plots</span>
                            </div>

                            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                              <span className="text-slate-400">Conflict Parcels:</span>
                              <span className={`font-extrabold ${calc.countConflict > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {calc.countConflict} Plots
                              </span>
                            </div>

                            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                              <span className="text-slate-400">Pending Acquisition:</span>
                              <span className="font-extrabold text-amber-300">{calc.countPending} Plots</span>
                            </div>

                            <div className="flex justify-between py-0.5">
                              <span className="text-slate-400">Compensation Pending:</span>
                              <span className="font-extrabold text-slate-200">{calc.countCompPending} Plots</span>
                            </div>
                          </div>

                          <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                            ml?.risk_level === 'High' ? 'bg-rose-950/50 border-rose-800' : ml?.risk_level === 'Medium' ? 'bg-amber-950/50 border-amber-800' : 'bg-emerald-950/50 border-emerald-800'
                          }`}>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Predicted Delay:</span>
                              <span className="font-extrabold text-amber-300 text-sm">
                                {ml ? `+${ml.predicted_delay_days} Days` : '—'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block">Delay Risk:</span>
                              <span className={`font-extrabold text-xs uppercase ${
                                ml?.risk_level === 'High' ? 'text-rose-300' : ml?.risk_level === 'Medium' ? 'text-amber-300' : 'text-emerald-300'
                              }`}>
                                {ml?.risk_level || 'Low'} ({ml ? (ml.delay_probability * 100).toFixed(0) : 0}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-900/60 rounded-2xl text-slate-400 text-center italic">
                          Alignment not yet drawn.
                        </div>
                      )}

                      <button
                        onClick={() => {
                          selectAndHighlightRoute(route.id);
                          setShowComparisonModal(false);
                        }}
                        className={`w-full py-2 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                          isSelectedIn3D
                            ? 'bg-sky-600 text-white shadow-md'
                            : 'bg-slate-800 text-sky-300 hover:bg-slate-700 border border-slate-700'
                        }`}
                      >
                        <Target className="w-4 h-4" />
                        <span>{isSelectedIn3D ? 'Selected in 3D Scene' : 'Select & Highlight in 3D'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {comparisonViewMode === 'table' && (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="p-3">Evaluation Parameter</th>
                      {routes.map((route) => (
                        <th key={route.id} className="p-3 border-l border-slate-800 font-extrabold">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${route.cssBg}`}></span>
                              <span className="text-white">{route.name}</span>
                            </div>
                            <button
                              onClick={() => {
                                selectAndHighlightRoute(route.id);
                                setShowComparisonModal(false);
                              }}
                              className={`text-[9px] px-2 py-0.5 rounded-lg font-bold transition-all ${
                                route.id === activeRouteId ? 'bg-sky-600 text-white' : 'bg-slate-800 text-sky-300 hover:bg-slate-700'
                              }`}
                            >
                              {route.id === activeRouteId ? 'Active' : 'Highlight'}
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr>
                      <td className="p-3 text-slate-300 font-semibold">Route Length</td>
                      {routes.map((r) => (
                        <td key={r.id} className="p-3 border-l border-slate-800 font-mono font-bold text-white">
                          {r.calculation?.totalLengthFormatted || 'Not Drawn'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-300 font-semibold">Affected Parcels</td>
                      {routes.map((r) => (
                        <td key={r.id} className="p-3 border-l border-slate-800 font-bold text-purple-300">
                          {r.calculation ? `${r.calculation.affectedParcels.length} Plots (${r.calculation.totalAffectedAreaAcres} Ac)` : '—'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-300 font-semibold">Acquisition Required</td>
                      {routes.map((r) => (
                        <td key={r.id} className="p-3 border-l border-slate-800 text-indigo-300 font-bold">
                          {r.calculation ? `${r.calculation.countRequired} Plots` : '—'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-300 font-semibold">Conflict Parcels</td>
                      {routes.map((r) => (
                        <td key={r.id} className="p-3 border-l border-slate-800">
                          {r.calculation ? (
                            <span className={`font-bold px-2 py-0.5 rounded ${
                              r.calculation.countConflict > 0 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}>
                              {r.calculation.countConflict} Conflicts
                            </span>
                          ) : '—'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-300 font-semibold">Pending Acquisition</td>
                      {routes.map((r) => (
                        <td key={r.id} className="p-3 border-l border-slate-800 text-amber-300 font-bold">
                          {r.calculation ? `${r.calculation.countPending} Plots` : '—'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-300 font-semibold">Compensation Pending</td>
                      {routes.map((r) => (
                        <td key={r.id} className="p-3 border-l border-slate-800 text-slate-200">
                          {r.calculation ? `${r.calculation.countCompPending} Plots` : '—'}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-slate-900/60 font-bold">
                      <td className="p-3 text-amber-400 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>Predicted Delay</span>
                      </td>
                      {routes.map((r) => (
                        <td key={r.id} className="p-3 border-l border-slate-800 font-bold text-amber-300">
                          {r.mlPrediction ? `+${r.mlPrediction.predicted_delay_days} Days` : '—'}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-slate-900/60 font-bold">
                      <td className="p-3 text-sky-400 flex items-center gap-1.5">
                        <BrainCircuit className="w-4 h-4 text-sky-400" />
                        <span>Delay Risk</span>
                      </td>
                      {routes.map((r) => (
                        <td key={r.id} className="p-3 border-l border-slate-800">
                          {r.mlPrediction ? (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold ${
                              r.mlPrediction.risk_level === 'High' ? 'bg-rose-900 text-rose-200' : r.mlPrediction.risk_level === 'Medium' ? 'bg-amber-900 text-amber-200' : 'bg-emerald-900 text-emerald-200'
                            }`}>
                              {r.mlPrediction.risk_level} ({(r.mlPrediction.delay_probability * 100).toFixed(0)}%)
                            </span>
                          ) : '—'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 text-[10.5px] text-slate-400">
              <span>* Factual comparative data generated objectively via 2D/3D Cadastral Engine & Random Forest ML delay models.</span>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED STATUTORY & WHAT-IF PARCEL INSPECTOR DRAWER */}
      {selectedFeature && (
        <div className="absolute top-28 right-4 z-20 w-96 bg-slate-900/95 backdrop-blur-xl border border-sky-500/70 p-4 rounded-3xl shadow-2xl text-white text-xs animate-fadeIn space-y-3.5 max-h-[calc(100%-8rem)] overflow-y-auto">
          <div className="flex items-start justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-sky-400">
                  Cadastral Parcel Inspector
                </span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${activeStateInfo?.cssBg} text-white`}>
                  {activeStateInfo?.label}
                </span>
                {isWhatIfMode && simulatedOverrides[selectedFeature.id] && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Simulated
                  </span>
                )}
              </div>
              <h3 className="text-lg font-extrabold text-white mt-0.5">
                Plot #{selectedFeature.properties?.plot_number}
              </h3>
              <p className="text-[10.5px] text-slate-400 font-mono">
                {selectedFeature.properties?.parcel_id || `PARCEL-OD-KH-${selectedFeature.id.toString().padStart(3, '0')}`} • Khata #{selectedFeature.properties?.khata_number}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedFeature(null);
                setSelectedAffectedParcel(null);
              }}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* INTERACTIVE WHAT-IF SIMULATION CONTROLS FOR THIS PARCEL */}
          {isWhatIfMode && (
            <div className="bg-gradient-to-r from-purple-950/60 to-amber-950/60 p-3.5 rounded-2xl border border-amber-500/60 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                <div className="flex items-center gap-1.5 font-extrabold text-amber-300 text-xs">
                  <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                  <span>What-If Sandbox Toggles</span>
                </div>
                {simulatedOverrides[selectedFeature.id] && (
                  <button
                    onClick={() => {
                      const copy = { ...simulatedOverrides };
                      delete copy[selectedFeature.id];
                      setSimulatedOverrides(copy);
                      showToast('Reverted parcel to baseline records.');
                    }}
                    className="text-[9.5px] text-slate-400 hover:text-rose-300 underline"
                  >
                    Revert to Baseline
                  </button>
                )}
              </div>

              <div className="space-y-2 text-[10.5px]">
                <div>
                  <label className="text-slate-400 block text-[9.5px] mb-0.5 font-semibold">
                    Simulate Owner Consent:
                  </label>
                  <select
                    value={selectedFeature.properties?.owner_consent_status || selectedFeature.properties?.consent_status || 'Consent Granted'}
                    onChange={(e) => handleWhatIfParcelChange(selectedFeature.id, 'owner_consent_status', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-white font-medium text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Consent Granted">Consent Granted (100% Pattadar)</option>
                    <option value="Owner Objection Lodged">Owner Objection Lodged (Dispute)</option>
                    <option value="Consent Pending">Consent Pending Consultation</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block text-[9.5px] mb-0.5 font-semibold">
                    Simulate Compensation Status:
                  </label>
                  <select
                    value={selectedFeature.properties?.compensation_status || 'Estimate Prepared'}
                    onChange={(e) => handleWhatIfParcelChange(selectedFeature.id, 'compensation_status', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-white font-medium text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Award Disbursed (Direct Benefit Transfer)">Award Disbursed (DBT / Bank)</option>
                    <option value="Estimate Prepared">Estimate Prepared (Pending Award)</option>
                    <option value="Disputed / Pending Disbursement">Disputed / Escrow Pending</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block text-[9.5px] mb-0.5 font-semibold">
                    Simulate Document Verification:
                  </label>
                  <select
                    value={selectedFeature.properties?.document_status || 'RoR Verified'}
                    onChange={(e) => handleWhatIfParcelChange(selectedFeature.id, 'document_status', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-white font-medium text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="RoR Verified">RoR Verified (No Discrepancy)</option>
                    <option value="Discrepancy in Name / Boundary">Discrepancy in Boundary Records</option>
                    <option value="Missing Mutation Records">Missing Mutation Documents</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block text-[9.5px] mb-0.5 font-semibold">
                    Simulate Cadastral Survey:
                  </label>
                  <select
                    value={selectedFeature.properties?.survey_status || 'Completed'}
                    onChange={(e) => handleWhatIfParcelChange(selectedFeature.id, 'survey_status', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-white font-medium text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Completed (Field Verified)">Completed (Field Verified)</option>
                    <option value="In Progress (Field Team Active)">In Progress (Field Active)</option>
                    <option value="Disputed Boundary (Re-survey Demanded)">Disputed Boundary</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block text-[9.5px] mb-0.5 font-semibold">
                    Simulate Acquisition Stage:
                  </label>
                  <select
                    value={selectedFeature.properties?.acquisition_status || 'Section 4(1)'}
                    onChange={(e) => handleWhatIfParcelChange(selectedFeature.id, 'acquisition_status', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-white font-medium text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Section 4(1) Notification">Section 4(1) Notification</option>
                    <option value="Section 6 Declaration">Section 6 Declaration</option>
                    <option value="Section 11 Preliminary Notification">Section 11 Preliminary Notification</option>
                    <option value="Section 19 Declaration">Section 19 Declaration</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* REVERSE PARCEL-TO-ROUTE TRAVERSAL & IMPACT BADGE */}
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-[10px] text-sky-400 uppercase tracking-wider">
                <GitBranch className="w-3.5 h-3.5 text-sky-400" />
                <span>Project Alignments Traversal</span>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                routesAffectingSelected.length > 0 ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-slate-900 text-slate-400 border border-slate-700'
              }`}>
                {routesAffectingSelected.length > 0 ? `${routesAffectingSelected.length} Route(s) Affecting` : 'No Route Traversal'}
              </span>
            </div>

            {routesAffectingSelected.length > 0 ? (
              <div className="space-y-1.5">
                {routesAffectingSelected.map(({ route, impact }) => (
                  <div
                    key={route.id}
                    className={`p-2 rounded-xl border transition-all flex items-center justify-between ${
                      route.id === activeRouteId ? 'bg-sky-950/70 border-sky-500 shadow-sm' : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${route.cssBg}`}></span>
                        <span className="font-bold text-white text-[11px]">{route.name}</span>
                      </div>
                      <div className="text-[9.5px] text-slate-400 flex items-center gap-2">
                        <span className={impact.isConflict ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                          {impact.situationCondition}
                        </span>
                        <span>•</span>
                        <span>ROW: {route.corridorWidth}m</span>
                      </div>
                    </div>
                    <button
                      onClick={() => selectAndHighlightRoute(route.id)}
                      className={`text-[9.5px] px-2 py-1 rounded-lg font-bold transition-all ${
                        route.id === activeRouteId
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-800 text-sky-300 hover:bg-slate-700'
                      }`}
                      title="Highlight and activate this alignment in 3D"
                    >
                      {route.id === activeRouteId ? 'Active in 3D' : 'Highlight'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic">
                This parcel is outside the Right-of-Way buffer of all currently drawn project routes.
              </p>
            )}
          </div>

          {/* Conflict Details Banner if applicable */}
          {(selectedFeature.properties?.conflict_reason || selectedAffectedParcel?.isConflict) && (
            <div className="bg-rose-950/80 border border-rose-700 p-3 rounded-2xl text-rose-200 text-[11px] space-y-2 shadow-xl">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
                <span>Acquisition Conflict Details</span>
              </div>

              <div className="space-y-1 text-[10px]">
                <div>
                  <strong className="text-rose-300 block">Conflict Type:</strong>
                  <span>{selectedFeature.properties?.conflict_type || selectedAffectedParcel?.conflict_type || 'Title Contestation & Dispute'}</span>
                </div>
                <div className="pt-1">
                  <strong className="text-rose-300 block">Factual Reason:</strong>
                  <span className="text-rose-200/90 leading-relaxed">{selectedFeature.properties?.conflict_reason || selectedAffectedParcel?.conflict_reason}</span>
                </div>
              </div>
            </div>
          )}

          {/* Parcel Tabs */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'ownership', label: 'Ownership & Consent' },
              { id: 'statutory', label: 'Statutory Pipeline' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="grid grid-cols-2 gap-2 bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
                <div>
                  <span className="text-[10px] text-slate-400 block">Affected Land Area</span>
                  <span className="font-extrabold text-white text-sm">
                    {selectedFeature.properties?.area_acres} Acres
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    ({(Number(selectedFeature.properties?.area_acres || 0) * 0.404686).toFixed(2)} Ha)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Land Classification</span>
                  <span className="font-bold text-slate-200 text-xs mt-0.5 block">
                    {selectedFeature.properties?.land_type || 'Agricultural / Sarada'}
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-700/40 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Estimated Valuation</span>
                    <span className="font-extrabold text-emerald-400 text-sm">
                      ₹{((selectedFeature.properties?.total_valuation_inr || (Number(selectedFeature.properties?.area_acres || 1) * 1200000)) / 100000).toFixed(2)} Lakhs
                    </span>
                  </div>
                  <RiskBadge risk={selectedFeature.properties?.risk_level} />
                </div>
              </div>

              <div className="bg-slate-800/50 p-2.5 rounded-2xl border border-slate-700/50 text-[10.5px] space-y-1">
                <span className="text-slate-400 text-[10px] block font-medium">Current Statutory Process Stage:</span>
                <span className="font-bold text-sky-300 block">
                  {selectedFeature.properties?.current_process_stage || selectedFeature.properties?.acquisition_status || 'Section 4(1) Notification'}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'ownership' && (
            <div className="space-y-2.5 animate-fadeIn">
              <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-sky-400" />
                    <div>
                      <strong className="text-white text-xs block">
                        {selectedFeature.properties?.landowner_name || selectedFeature.properties?.owners?.[0]?.name || 'Shri Bikram Keshari Das'}
                      </strong>
                      <span className="text-[10px] text-slate-400">Primary Recorded Pattadar (100% Share)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700/40 grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-400 block">Owner Consent Status:</span>
                    <span className={`font-bold mt-0.5 inline-block px-2 py-0.5 rounded text-[10px] ${
                      (selectedFeature.properties?.owner_consent_status || selectedFeature.properties?.consent_status) === 'Owner Objection Lodged' ||
                      (selectedFeature.properties?.owner_consent_status || selectedFeature.properties?.consent_status) === 'Objection Filed'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : (selectedFeature.properties?.owner_consent_status || selectedFeature.properties?.consent_status) === 'Consent Pending' ||
                          (selectedFeature.properties?.owner_consent_status || selectedFeature.properties?.consent_status) === 'Pending Consultation'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      {selectedFeature.properties?.owner_consent_status || selectedFeature.properties?.consent_status || 'Consent Received'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Aadhaar Status:</span>
                    <span className="font-bold text-slate-200 mt-0.5 block">Verified (XXXX-8821)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'statutory' && (
            <div className="space-y-2 bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 text-[11px] animate-fadeIn">
              <div className="flex items-center justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Cadastral Survey:</span>
                <span className={`font-bold ${
                  selectedFeature.properties?.survey_status?.includes('Completed') ? 'text-emerald-400' : selectedFeature.properties?.survey_status?.includes('Disputed') ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {selectedFeature.properties?.survey_status || 'Completed'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Acquisition Stage:</span>
                <span className="font-bold text-slate-200">
                  {selectedFeature.properties?.acquisition_status || 'Section 4(1)'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">Compensation Status:</span>
                <span className="font-bold text-slate-200">
                  {selectedFeature.properties?.compensation_status || 'Estimate Prepared'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Document Status:</span>
                <span className={`font-bold ${
                  selectedFeature.properties?.document_status?.includes('Discrepancy') || selectedFeature.properties?.document_status?.includes('Issue') ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {selectedFeature.properties?.document_status || 'RoR Verified'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Left: 3D Camera Gizmo & Active Coordinates */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-slate-700/80 shadow-2xl text-xs space-y-1.5 text-slate-300 max-w-xs">
        <div className="font-bold text-white flex items-center justify-between text-[11px] uppercase tracking-wider text-sky-400">
          <div className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-sky-400" />
            <span>3D Cadastral Surveyor</span>
          </div>
          {isWhatIfMode && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              SANDBOX
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-300">
          <div><strong className="text-white">Active Route:</strong> <span className={activeRoute.cssText}>{activeRoute.name.slice(0, 14)}...</span></div>
          <div><strong className="text-white">Active Tool:</strong> <span className="text-sky-300 capitalize">{activeTool.replace('_', ' ')}</span></div>
          <div><strong className="text-white">Left Drag:</strong> Orbit & Tilt</div>
          <div><strong className="text-white">Right Drag:</strong> Pan Map</div>
        </div>
        <div className="pt-1.5 border-t border-slate-800 text-[10px] text-amber-400 flex items-center gap-1">
          <Info className="w-3 h-3 shrink-0" />
          <span>Cadastral Mesh: 84 Odisha Land Parcels</span>
        </div>
      </div>

      {/* Bottom Right: 3D Visual States Legend */}
      <div className="absolute bottom-4 right-4 z-10 bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-slate-700/80 shadow-2xl text-xs">
        <div className="font-bold text-white mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-300">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          Parcel Visual States
        </div>
        <div className="space-y-1.5 font-medium text-[10.5px]">
          <div className="flex items-center gap-2 text-rose-300">
            <span className="w-3 h-3 rounded-md bg-[#EF4444] shadow-sm shadow-rose-500/60 animate-pulse"></span>
            <span>Acquisition Conflict (Active Dispute / Objection)</span>
          </div>
          <div className="flex items-center gap-2 text-amber-300">
            <span className="w-3 h-3 rounded-md bg-[#F59E0B] shadow-sm shadow-amber-500/60"></span>
            <span>Acquisition In Progress (Sec 6 / Survey Ongoing)</span>
          </div>
          <div className="flex items-center gap-2 text-indigo-300">
            <span className="w-3 h-3 rounded-md bg-[#6366F1] shadow-sm shadow-indigo-500/60"></span>
            <span>Acquisition Required (Sec 4(1) Notification)</span>
          </div>
          <div className="flex items-center gap-2 text-blue-300">
            <span className="w-3 h-3 rounded-md bg-[#3B82F6] shadow-sm shadow-blue-500/60"></span>
            <span>Acquisition Completed (Award Disbursed)</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-300">
            <span className="w-3 h-3 rounded-md bg-[#10B981] shadow-sm shadow-emerald-500/60"></span>
            <span>Normal / Low Risk / Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
