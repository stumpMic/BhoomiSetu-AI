import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { verificationService } from '../../services/verificationService';
import { useNotifications } from '../../context/NotificationContext';
import { 
  ShieldCheck, 
  User, 
  Building2, 
  MapPin, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  KeyRound, 
  Lock, 
  Mail, 
  Phone, 
  Sparkles, 
  Clock, 
  XCircle,
  Info
} from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  // Wizard Step (1: Role, 2: Personal, 3: Verification Details, 4: OTP, 5: Result)
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState('landowner'); // 'landowner' | 'officer'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 2: Personal Information Form
  const [personalData, setPersonalData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    district: 'Khurda',
    state: 'Odisha'
  });

  // Step 3: Role-Specific Verification Form
  // Landowner fields
  const [landData, setLandData] = useState({
    landRecordId: '',
    tahasil: 'Pipili',
    village: 'Pipili',
    plotNumber: '',
    khataNumber: '',
    docRefNumber: '',
  });

  // Officer fields
  const [officerData, setOfficerData] = useState({
    officerId: '',
    department: 'Revenue & Land Reforms Department',
    designation: 'Sub-Collector & LAO',
    district: 'Khurda',
    officeName: 'Sub-Collector Office, Bhubaneswar',
    officeCode: 'REV-BBSR-01'
  });

  // Uploaded Document File
  const [docFile, setDocFile] = useState(null);

  // Step 4: OTP State
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtpCode, setDemoOtpCode] = useState('123456');

  // Step 5: Final Result State
  const [registrationResult, setRegistrationResult] = useState(null);

  const odishaDistricts = [
    'Khurda', 'Puri', 'Cuttack', 'Jagatsinghpur', 'Kendrapara',
    'Jajpur', 'Balasore', 'Bhadrak', 'Mayurbhanj', 'Ganjam',
    'Sambalpur', 'Sundargarh', 'Angul', 'Dhenkanal', 'Bolangir'
  ];

  const departmentsList = [
    'Revenue & Land Reforms Department',
    'Survey & Cadastral Directorate',
    'Compensation & Accounts Cell',
    'Forest & Environment Clearance Cell',
    'Legal & Dispute Resolution Cell'
  ];

  // Quick Autofill Helpers for Demo Testing
  const handleAutofillLandowner = () => {
    setPersonalData({
      fullName: 'Bikram Keshari Das',
      email: `farmer.bikram.${Math.floor(Math.random()*1000)}@gmail.com`,
      phone: '+91 98610 ' + Math.floor(10000 + Math.random() * 90000),
      password: 'DemoPass123!',
      confirmPassword: 'DemoPass123!',
      address: 'Hatapatana, Pipili, Dist: Khurda',
      district: 'Khurda',
      state: 'Odisha'
    });
    setLandData({
      landRecordId: 'LAND-DEMO-001',
      tahasil: 'Pipili',
      village: 'Pipili',
      plotNumber: '142/A',
      khataNumber: '312',
      docRefNumber: 'ROR-OD-2026-0142'
    });
    showToast('Autofilled sample verified Landowner record (Plot 142/A, Pipili)', 'info');
  };

  const handleAutofillOfficer = () => {
    setPersonalData({
      fullName: 'Shri Suresh Mohanty',
      email: `officer.suresh.${Math.floor(Math.random()*1000)}@bhoomisetu.gov.in`,
      phone: '+91 94370 ' + Math.floor(10000 + Math.random() * 90000),
      password: 'DemoPass123!',
      confirmPassword: 'DemoPass123!',
      address: 'Sub-Collectorate, Khurda Division',
      district: 'Khurda',
      state: 'Odisha'
    });
    setOfficerData({
      officerId: 'OFF-DEMO-001',
      department: 'Revenue & Land Reforms Department',
      designation: 'Sub-Collector & LAO',
      district: 'Khurda',
      officeName: 'Sub-Collector Office, Bhubaneswar',
      officeCode: 'REV-BBSR-01'
    });
    showToast('Autofilled authorized Government Officer record (OFF-DEMO-001 / REV-BBSR-01)', 'info');
  };

  // Step 2 Validation -> Step 3
  const handleNextToVerificationDetails = (e) => {
    e.preventDefault();
    setError('');

    if (personalData.password !== personalData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (personalData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setStep(3);
  };

  // Step 3 Validation -> Trigger OTP (Step 4)
  const handleProceedToOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const identifier = personalData.phone || personalData.email;
      const res = await verificationService.sendOtp(identifier, accountType);
      setOtpSent(true);
      setDemoOtpCode(res.demo_otp || '123456');
      setStep(4);
      showToast('Simulated OTP code generated for instant evaluation', 'success');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to dispatch verification OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Verify OTP & Submit Registration
  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Verify OTP
      const identifier = personalData.phone || personalData.email;
      await verificationService.verifyOtp(identifier, otpCode);

      // 2. Submit Multipart Registration Form
      const formData = new FormData();

      if (accountType === 'landowner') {
        formData.append('full_name', personalData.fullName);
        formData.append('email', personalData.email);
        formData.append('phone', personalData.phone);
        formData.append('password', personalData.password);
        formData.append('confirm_password', personalData.confirmPassword);
        formData.append('address', personalData.address);
        formData.append('district', personalData.district);
        formData.append('state', personalData.state);
        formData.append('land_record_id', landData.landRecordId || '');
        formData.append('tahasil', landData.tahasil);
        formData.append('village', landData.village);
        formData.append('plot_number', landData.plotNumber);
        formData.append('khata_number', landData.khataNumber);
        formData.append('doc_ref_number', landData.docRefNumber || '');
        if (docFile) {
          formData.append('document_file', docFile);
        }

        const res = await verificationService.registerLandowner(formData);
        setRegistrationResult(res);
      } else {
        formData.append('full_name', personalData.fullName);
        formData.append('official_email', personalData.email);
        formData.append('phone', personalData.phone);
        formData.append('password', personalData.password);
        formData.append('confirm_password', personalData.confirmPassword);
        formData.append('department', officerData.department);
        formData.append('designation', officerData.designation);
        formData.append('district', officerData.district);
        formData.append('office_name', officerData.officeName);
        formData.append('officer_id', officerData.officerId);
        formData.append('office_code', officerData.officeCode);
        if (docFile) {
          formData.append('authorization_document', docFile);
        }

        const res = await verificationService.registerOfficer(formData);
        setRegistrationResult(res);
      }

      setStep(5);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please review your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-govblue-900 to-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-govblue-500 mx-auto flex items-center justify-center text-white font-black text-2xl shadow-xl">
          BS
        </div>
        <h2 className="mt-4 text-3xl font-black text-white tracking-tight">
          Create Your Account
        </h2>
        <p className="mt-1 text-sm text-slate-300 font-medium">
          Official Role-Based Registration & Verification Portal • Odisha Land Acquisition
        </p>

        {/* Prototype Demo Badge */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
          <Info className="w-3.5 h-3.5" />
          <span>DEMO DATA — NOT REAL GOVERNMENT RECORDS</span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          
          {/* Stepper Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[
                { num: 1, label: 'Role' },
                { num: 2, label: 'Personal' },
                { num: 3, label: 'Verification' },
                { num: 4, label: 'OTP' },
                { num: 5, label: 'Status' }
              ].map((s) => (
                <div key={s.num} className="flex flex-col items-center flex-1">
                  <div className="flex items-center w-full">
                    {s.num > 1 && (
                      <div className={`h-1 flex-1 transition-all ${step >= s.num ? 'bg-govblue-600' : 'bg-slate-200'}`} />
                    )}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        step === s.num
                          ? 'bg-govblue-600 text-white ring-4 ring-govblue-100'
                          : step > s.num
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {step > s.num ? '✓' : s.num}
                    </div>
                    {s.num < 5 && (
                      <div className={`h-1 flex-1 transition-all ${step > s.num ? 'bg-govblue-600' : 'bg-slate-200'}`} />
                    )}
                  </div>
                  <span className="text-[11px] font-bold mt-1 text-slate-500">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: SELECT ACCOUNT TYPE */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900">Select Account Type</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Choose the role applicable to your identity. Restricted access will be vetted against official datasets.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Landowner Card */}
                <div
                  onClick={() => setAccountType('landowner')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    accountType === 'landowner'
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-100'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                    <User className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Landowner / Beneficiary</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    For affected citizens, plot owners, and legal heirs tracking awards, surveys, and compensation stages.
                  </p>
                  <div className="mt-3 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <span>Requires Cadastral Plot & RoR Verification</span>
                  </div>
                </div>

                {/* Government Officer Card */}
                <div
                  onClick={() => setAccountType('officer')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    accountType === 'officer'
                      ? 'border-govblue-600 bg-govblue-50/50 shadow-md ring-2 ring-govblue-100'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-govblue-100 text-govblue-700 flex items-center justify-center mb-3">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Government Officer</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    For LAO, Survey, Tahsil, and Compensation personnel managing acquisition projects and approvals.
                  </p>
                  <div className="mt-3 text-[11px] font-semibold text-govblue-700 flex items-center gap-1">
                    <span>Requires Officer ID & Department Authorization</span>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-govblue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Security Guard:</strong> Unrestricted administrative roles cannot be self-registered. Officer and Landowner credentials are cross-referenced with authorized databases.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-govblue-700 hover:bg-govblue-800 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Continue to Personal Information</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: PERSONAL INFORMATION */}
          {/* ========================================================================= */}
          {step === 2 && (
            <form onSubmit={handleNextToVerificationDetails} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
                  <p className="text-xs text-slate-500">
                    Registering as: <strong className="text-govblue-700 uppercase">{accountType}</strong>
                  </p>
                </div>
                
                {/* Demo Autofill Shortcut */}
                <button
                  type="button"
                  onClick={accountType === 'landowner' ? handleAutofillLandowner : handleAutofillOfficer}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Autofill Sample {accountType === 'landowner' ? 'Landowner' : 'Officer'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name (As per Official Records) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={personalData.fullName}
                    onChange={(e) => setPersonalData({ ...personalData, fullName: e.target.value })}
                    placeholder="e.g. Bikram Keshari Das or Shri Suresh Mohanty"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-govblue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {accountType === 'officer' ? 'Official Government Email *' : 'Email Address *'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={personalData.email}
                      onChange={(e) => setPersonalData({ ...personalData, email: e.target.value })}
                      placeholder={accountType === 'officer' ? 'officer.demo@bhoomisetu.gov.in' : 'farmer@gmail.com'}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-govblue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={personalData.phone}
                      onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                      placeholder="+91 94370 12345"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-govblue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    District *
                  </label>
                  <select
                    value={personalData.district}
                    onChange={(e) => setPersonalData({ ...personalData, district: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white font-medium"
                  >
                    {odishaDistricts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    disabled
                    value={personalData.state}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Residential / Office Address *
                </label>
                <input
                  type="text"
                  required
                  value={personalData.address}
                  onChange={(e) => setPersonalData({ ...personalData, address: e.target.value })}
                  placeholder="At/PO, Street, Tehsil"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-govblue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Create Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      value={personalData.password}
                      onChange={(e) => setPersonalData({ ...personalData, password: e.target.value })}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-govblue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      value={personalData.confirmPassword}
                      onChange={(e) => setPersonalData({ ...personalData, confirmPassword: e.target.value })}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-govblue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-govblue-700 hover:bg-govblue-800 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>Next: Verification Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: ROLE-SPECIFIC VERIFICATION DETAILS & DOCUMENT UPLOAD */}
          {/* ========================================================================= */}
          {step === 3 && (
            <form onSubmit={handleProceedToOtp} className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {accountType === 'landowner' ? 'Land Verification Information' : 'Official Credentials Verification'}
                </h3>
                <p className="text-xs text-slate-500">
                  {accountType === 'landowner'
                    ? 'Enter cadastral revenue information to establish land ownership eligibility.'
                    : 'Enter authorized government department credentials for verification against the officer registry.'}
                </p>
              </div>

              {/* LANDOWNER FORM FIELDS */}
              {accountType === 'landowner' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Land / Property ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={landData.landRecordId}
                        onChange={(e) => setLandData({ ...landData, landRecordId: e.target.value })}
                        placeholder="e.g. LAND-DEMO-001"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-govblue-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Tahasil / Tehsil *
                      </label>
                      <input
                        type="text"
                        required
                        value={landData.tahasil}
                        onChange={(e) => setLandData({ ...landData, tahasil: e.target.value })}
                        placeholder="e.g. Pipili"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-govblue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Village *
                      </label>
                      <input
                        type="text"
                        required
                        value={landData.village}
                        onChange={(e) => setLandData({ ...landData, village: e.target.value })}
                        placeholder="e.g. Pipili"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-govblue-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Plot / Khasra No *
                      </label>
                      <input
                        type="text"
                        required
                        value={landData.plotNumber}
                        onChange={(e) => setLandData({ ...landData, plotNumber: e.target.value })}
                        placeholder="e.g. 142/A or 101"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-govblue-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Khata / Record No *
                      </label>
                      <input
                        type="text"
                        required
                        value={landData.khataNumber}
                        onChange={(e) => setLandData({ ...landData, khataNumber: e.target.value })}
                        placeholder="e.g. 312 or 201"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-govblue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Land Document / Patta Reference Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={landData.docRefNumber}
                      onChange={(e) => setLandData({ ...landData, docRefNumber: e.target.value })}
                      placeholder="e.g. ROR-OD-2026-0142"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-govblue-500 font-medium"
                    />
                  </div>

                  {/* Document Upload */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Upload Ownership Document (RoR / Patta Deed / Sale Deed)
                    </label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-govblue-500 transition-all bg-slate-50/50">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.txt"
                        onChange={(e) => setDocFile(e.target.files[0])}
                        className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-govblue-50 file:text-govblue-700 hover:file:bg-govblue-100"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Accepted formats: PDF, PNG, JPG, TXT (Max 15MB)
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* OFFICER FORM FIELDS */}
              {accountType === 'officer' && (
                <>
                  {/* Whitelist Helper Box */}
                  <div className="p-3.5 bg-govblue-50 border border-govblue-200 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-govblue-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-govblue-700" />
                        <span>Authorized Demo Officer Credentials (Whitelist)</span>
                      </span>
                      <span className="text-[10px] text-govblue-600 font-semibold">Click to select:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setOfficerData({
                            officerId: 'OFF-DEMO-001',
                            department: 'Revenue & Land Reforms Department',
                            designation: 'Sub-Collector & LAO',
                            district: 'Khurda',
                            officeName: 'Sub-Collector Office, Bhubaneswar',
                            officeCode: 'REV-BBSR-01'
                          });
                        }}
                        className="p-2 rounded-lg bg-white border border-govblue-200 hover:border-govblue-500 text-left transition-all"
                      >
                        <div className="font-bold text-govblue-900">OFF-DEMO-001</div>
                        <div className="text-[10px] text-slate-500">REV-BBSR-01 (Revenue)</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOfficerData({
                            officerId: 'OFF-DEMO-002',
                            department: 'Survey & Cadastral Directorate',
                            designation: 'Assistant Director of Survey',
                            district: 'Puri',
                            officeName: 'Survey Directorate, Puri',
                            officeCode: 'SURV-PURI-02'
                          });
                        }}
                        className="p-2 rounded-lg bg-white border border-govblue-200 hover:border-govblue-500 text-left transition-all"
                      >
                        <div className="font-bold text-govblue-900">OFF-DEMO-002</div>
                        <div className="text-[10px] text-slate-500">SURV-PURI-02 (Survey)</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOfficerData({
                            officerId: 'OFF-DEMO-003',
                            department: 'Compensation & Accounts Cell',
                            designation: 'Special Land Acquisition Officer',
                            district: 'Cuttack',
                            officeName: 'Collectorate, Cuttack',
                            officeCode: 'COMP-CTC-01'
                          });
                        }}
                        className="p-2 rounded-lg bg-white border border-govblue-200 hover:border-govblue-500 text-left transition-all"
                      >
                        <div className="font-bold text-govblue-900">OFF-DEMO-003</div>
                        <div className="text-[10px] text-slate-500">COMP-CTC-01 (Compensation)</div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Employee / Officer ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={officerData.officerId}
                        onChange={(e) => setOfficerData({ ...officerData, officerId: e.target.value })}
                        placeholder="e.g. OFF-DEMO-001"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-govblue-500 font-medium uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Department / Office Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={officerData.officeCode}
                        onChange={(e) => setOfficerData({ ...officerData, officeCode: e.target.value })}
                        placeholder="e.g. REV-BBSR-01"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-govblue-500 font-medium uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Department *
                      </label>
                      <select
                        value={officerData.department}
                        onChange={(e) => setOfficerData({ ...officerData, department: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white font-medium"
                      >
                        {departmentsList.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Designation *
                      </label>
                      <input
                        type="text"
                        required
                        value={officerData.designation}
                        onChange={(e) => setOfficerData({ ...officerData, designation: e.target.value })}
                        placeholder="e.g. Sub-Collector & LAO"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-govblue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Office / Division Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={officerData.officeName}
                      onChange={(e) => setOfficerData({ ...officerData, officeName: e.target.value })}
                      placeholder="e.g. Sub-Collector Office, Bhubaneswar"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-govblue-500 font-medium"
                    />
                  </div>

                  {/* Officer ID Document Upload */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Upload Official Identification / Authorization Document
                    </label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-govblue-500 transition-all bg-slate-50/50">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => setDocFile(e.target.files[0])}
                        className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-govblue-50 file:text-govblue-700 hover:file:bg-govblue-100"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Accepted formats: PDF, PNG, JPG (Departmental ID Card or Deputation Order)
                      </p>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 bg-govblue-700 hover:bg-govblue-800 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Validating...' : 'Proceed to OTP Verification'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: OTP VERIFICATION */}
          {/* ========================================================================= */}
          {step === 4 && (
            <form onSubmit={handleVerifyOtpAndRegister} className="space-y-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Enter Verification OTP</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  A 6-digit verification code has been dispatched to <strong>{personalData.phone || personalData.email}</strong>.
                </p>
              </div>

              {/* Simulated Demo OTP Box */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 max-w-sm mx-auto text-left">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Simulated OTP (For Prototype Testing):</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-mono font-black text-lg text-amber-900 tracking-widest">{demoOtpCode}</span>
                  <button
                    type="button"
                    onClick={() => setOtpCode(demoOtpCode)}
                    className="px-2.5 py-1 rounded bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-bold transition-all"
                  >
                    Auto-Fill OTP
                  </button>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="w-48 text-center tracking-widest font-mono text-xl py-3 px-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-govblue-500 font-bold mx-auto block"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-sm transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Submitting Registration...' : 'Verify OTP & Complete Registration'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: REGISTRATION STATUS & RESULT */}
          {/* ========================================================================= */}
          {step === 5 && registrationResult && (
            <div className="text-center space-y-6 py-2">
              {registrationResult.verification_status === 'VERIFIED' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Account Created & Verified!
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 max-w-md mx-auto">
                      {registrationResult.message}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-left space-y-1">
                    <div><strong>Account Role:</strong> {registrationResult.account_type}</div>
                    <div><strong>Status:</strong> <span className="text-emerald-700 font-bold">ACTIVE / VERIFIED</span></div>
                    <div><strong>Access Scope:</strong> Full citizen parcel tracking & compensation pipeline</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                    <Clock className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Registration Submitted
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 max-w-md mx-auto">
                      {registrationResult.message}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-left space-y-1.5">
                    <div><strong>Account Type:</strong> {registrationResult.account_type}</div>
                    <div><strong>Verification Status:</strong> <span className="text-amber-700 font-bold">PENDING_VERIFICATION</span></div>
                    <div><strong>Next Steps:</strong> An administrator or Tahsil authority will inspect your submitted documents and approve your account.</div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-sm transition-all"
                    >
                      Return to Home
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="w-1/2 bg-govblue-700 hover:bg-govblue-800 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md"
                    >
                      Go to Sign In
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Bottom link to Login */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-govblue-700 hover:text-govblue-800 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
