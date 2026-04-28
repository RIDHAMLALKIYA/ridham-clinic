'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'gu';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navbar
    'nav.reservations': 'Reservations',
    'nav.checkin': 'Check-in',
    'nav.lobby': 'Lobby',
    'nav.console': 'Clinical Console',
    'nav.admissions': 'Admissions',
    'nav.staff_login': 'Staff Login',
    'nav.branding': 'Elite Medical Node',
    
    // Booking Page (Home)
    'home.title_prefix': 'Elite',
    'home.title_suffix': 'Admit',
    'home.subtitle': 'Secure your priority access to elite medical professionals. We redefine clinical excellence.',
    'home.vip_scheduling': 'VIP Scheduling',
    'home.authority_access': 'Authority Access Only',
    'home.instant_sync': 'Instant Sync',
    'home.realtime_queue': 'Real-time Queue Integration',
    'home.form.name': 'Full Name',
    'home.form.name_placeholder': 'Your complete name',
    'home.form.phone': 'Phone Number',
    'home.form.phone_placeholder': '10-digit number',
    'home.form.email': 'Email Address',
    'home.form.email_placeholder': 'your-email@example.com',
    'home.form.reason': 'Reason for Visit',
    'home.form.reason_sub': 'Mention if you are already in the clinic or any urgent symptoms.',
    'home.form.reason_placeholder': 'Briefly describe your health concern...',
    'home.form.submit': 'Proceed to Registration',
    'home.success.title': 'Session Reserved.',
    'home.success.subtitle': 'Your elite medical consultation is pending. Check your encrypted email for confirmation.',
    'home.success.return': 'Return to Dashboard',
    
    // Queue / Lobby
    'queue.now_serving': 'Now Consulting',
    'queue.wait': 'Wait',
    'queue.doctor_break': 'DOCTOR ON BREAK',
    'queue.please_wait': 'PLEASE WAIT',
    'queue.active_count': 'Active',
    'queue.min_wait': 'MIN WAIT',
    'queue.footer': 'Kindly be seated until your name is called',
    'queue.welcome': 'Welcome to HealthCore Clinic',
    'queue.care_sub': 'Your health is our priority',
    'queue.namaste': 'Namaste!',
    'home.welcome_back': 'Welcome Back!',
    
    // Doctor Dashboard
    'dash.title': 'Doctor Dashboard',
    'dash.working': 'I am Working',
    'dash.resting': 'Taking a Break',
    'dash.admin_audits': 'Administration & Audits',
    'dash.secure_control': 'Secure Data Control Center',
    'dash.lobby_title': 'Priority Lobby',
    'dash.lobby_sub': 'Patients Arrived & Ready for Clinical Audit',
    'dash.rank': 'Rank',
    'dash.consult_next': 'Consult Next',
    'dash.urgent': 'Urgent',
    
    // Check-in Page
    'checkin.portal': 'Portal',
    'checkin.authorized_node': 'Authorized Access Node',
    'checkin.sync_subtitle': 'Synchronize your arrival with our smart clinic network. Precision timing for elite care.',
    'checkin.instant_sync': 'Instant Sync',
    'checkin.verified_creds': 'Verified Credentials Only',
    'checkin.node_registered': 'Node Registered',
    'checkin.identity_verified': 'Identity verified. Awaiting clinic activation beacon.',
    'checkin.sync_error': 'Sync Error',
    'checkin.error_not_found': 'Identity mismatch. Registration required.',
    'checkin.error_no_appointment': 'No active session scheduled for current time node.',
    'checkin.error_unknown': 'Network timeout. Consult administration panel.',
    'checkin.full_name': 'Full Name',
    'checkin.name_placeholder': 'Enter your full name',
    'checkin.mobile_number': 'Mobile Number',
    'checkin.phone_placeholder': 'Your 10-digit number',
    'checkin.emergency_priority': 'Emergency Priority',
    'checkin.emergency_sub': 'Mark this if you need immediate attention.',
    'checkin.scan_qr': 'Scan QR Code',
    'checkin.need_register': 'Need to Register?',
    'checkin.first_visit': 'First regular visit?',
    'checkin.book_now': 'Book an Appointment',
    'checkin.success_verified': 'Verified.',
    'checkin.success_subtitle': 'You have been integrated into the live clinical stream. Proceed to the main lobby area.',
    'checkin.another': 'Check-In Another Patient',
    
    // QR Page
    'qr.fast_track': 'SECURE CLINICAL CHECK-IN',
    'qr.instant': 'Instant',
    'qr.checkin': 'Check-In',
    'qr.subtitle': 'Scan your appointment QR code to instantly notify the clinical staff of your arrival.',
    'qr.unique': 'Unique QR Code per Appointment',
    'qr.encrypted': 'End-to-End Encrypted Identity',
  },
  gu: {
    // Navbar
    'nav.reservations': 'રિઝર્વેશન',
    'nav.checkin': 'ચેક-ઇન',
    'nav.lobby': 'લોબી',
    'nav.console': 'ક્લિનિકલ કોન્સોલ',
    'nav.admissions': 'એડમિશન',
    'nav.staff_login': 'સ્ટાફ લોગિન',
    'nav.branding': 'શ્રેષ્ઠ મેડિકલ નોડ',
    
    // Booking Page (Home)
    'home.title_prefix': 'શ્રેષ્ઠ',
    'home.title_suffix': 'પ્રવેશ',
    'home.subtitle': 'શ્રેષ્ઠ મેડિકલ પ્રોફેશનલ્સ માટે તમારી પ્રાધાન્યતા સુરક્ષિત કરો. અમે ક્લિનિકલ શ્રેષ્ઠતાને ફરીથી વ્યાખ્યાયિત કરીએ છીએ.',
    'home.vip_scheduling': 'VIP શિડ્યુલિંગ',
    'home.authority_access': 'ફક્ત અધિકૃત પ્રવેશ',
    'home.instant_sync': 'ઇન્સ્ટન્ટ સિંક',
    'home.realtime_queue': 'રીઅલ-ટાઇમ કતાર એકીકરણ',
    'home.form.name': 'આખું નામ',
    'home.form.name_placeholder': 'તમારું આખું નામ',
    'home.form.phone': 'ફોન નંબર',
    'home.form.phone_placeholder': '૧૦ અંકનો નંબર',
    'home.form.email': 'ઈમેઈલ સરનામું',
    'home.form.email_placeholder': 'તમારો-ઈમેઈલ@ઉદાહરણ.કોમ',
    'home.form.reason': 'મુલાકાતનું કારણ',
    'home.form.reason_sub': 'જો તમે પહેલાથી જ ક્લિનિકમાં હોવ અથવા કોઈ તાકીદના લક્ષણો હોય તો જણાવો.',
    'home.form.reason_placeholder': 'તમારી સ્વાસ્થ્ય ચિંતાનું ટૂંકમાં વર્ણન કરો...',
    'home.form.submit': 'નોંધણી માટે આગળ વધો',
    'home.success.title': 'સત્ર રિઝર્વ થઈ ગયું.',
    'home.success.subtitle': 'તમારું શ્રેષ્ઠ મેડિકલ કન્સલ્ટેશન બાકી છે. પુષ્ટિ માટે તમારો એન્ક્રિપ્ટેડ ઈમેઈલ તપાસો.',
    'home.success.return': 'ડેશબોર્ડ પર પાછા ફરો',
    
    // Queue / Lobby
    'queue.now_serving': 'હાલમાં તપાસ ચાલુ છે',
    'queue.wait': 'પ્રતીક્ષા કરો',
    'queue.doctor_break': 'ડોક્ટર વિરામ પર છે',
    'queue.please_wait': 'કૃપા કરીને રાહ જુઓ',
    'queue.active_count': 'સક્રિય',
    'queue.min_wait': 'મિનિટ પ્રતીક્ષા',
    'queue.footer': 'તમારું નામ ન બોલાય ત્યાં સુધી કૃપા કરીને બેસો',
    'queue.welcome': 'હેલ્થકોર ક્લિનિકમાં તમારું સ્વાગત છે',
    'queue.care_sub': 'તમારી સ્વાસ્થ્ય અમારી પ્રાથમિકતા છે',
    'queue.namaste': 'નમસ્તે!',
    'home.welcome_back': 'ફરીથી સ્વાગત છે!',
    
    // Doctor Dashboard
    'dash.title': 'ડોક્ટર ડેશબોર્ડ',
    'dash.working': 'હું કામ કરી રહ્યો છું',
    'dash.resting': 'વિરામ લઈ રહ્યો છું',
    'dash.admin_audits': 'વહીવટ અને ઓડિટ',
    'dash.secure_control': 'સુરક્ષિત ડેટા કંટ્રોલ સેન્ટર',
    'dash.lobby_title': 'પ્રાધાન્યતા લોબી',
    'dash.lobby_sub': 'દર્દીઓ આવ્યા છે અને ક્લિનિકલ ઓડિટ માટે તૈયાર છે',
    'dash.rank': 'ક્રમ',
    'dash.consult_next': 'આગળની તપાસ',
    'dash.urgent': 'તાકીદનું',

    // Check-in Page
    'checkin.portal': 'પોર્ટલ',
    'checkin.authorized_node': 'અધિકૃત એક્સેસ નોડ',
    'checkin.sync_subtitle': 'અમારા સ્માર્ટ ક્લિનિક નેટવર્ક સાથે તમારા આગમનને સિંક્રનાઇઝ કરો. ભદ્ર સંભાળ માટે ચોક્કસ સમય.',
    'checkin.instant_sync': 'ઇન્સ્ટન્ટ સિંક',
    'checkin.verified_creds': 'ફક્ત ચકાસાયેલ ઓળખપત્ર',
    'checkin.node_registered': 'નોંધણી સફળ',
    'checkin.identity_verified': 'ઓળખ ચકાસાઈ ગઈ છે. ક્લિનિક સક્રિયકરણની રાહ જોઈ રહ્યા છીએ.',
    'checkin.sync_error': 'સિંક ભૂલ',
    'checkin.error_not_found': 'ઓળખ મેચ થતી નથી. નોંધણી જરૂરી છે.',
    'checkin.error_no_appointment': 'હાલના સમય માટે કોઈ એપોઈન્ટમેન્ટ નથી.',
    'checkin.error_unknown': 'નેટવર્ક સમસ્યા. વહીવટી વિભાગનો સંપર્ક કરો.',
    'checkin.full_name': 'આખું નામ',
    'checkin.name_placeholder': 'તમારું આખું નામ લખો',
    'checkin.mobile_number': 'મોબાઈલ નંબર',
    'checkin.phone_placeholder': 'તમારો ૧૦ અંકનો નંબર',
    'checkin.emergency_priority': 'ઇમરજન્સી પ્રાધાન્યતા',
    'checkin.emergency_sub': 'જો તમારે તાત્કાલિક સારવારની જરૂર હોય તો અહીં નિશાની કરો.',
    'checkin.scan_qr': 'QR કોડ સ્કેન કરો',
    'checkin.need_register': 'નોંધણીની જરૂર છે?',
    'checkin.first_visit': 'પહેલી વાર મુલાકાત લો છો?',
    'checkin.book_now': 'એપોઈન્ટમેન્ટ બુક કરો',
    'checkin.success_verified': 'ચકાસણી સફળ.',
    'checkin.success_subtitle': 'તમારું આગમન નોંધાઈ ગયું છે. હવે તમે લોબીમાં જઈ શકો છો.',
    'checkin.another': 'બીજા દર્દીનું ચેક-ઇન કરો',
    
    // QR Page
    'qr.fast_track': 'સુરક્ષિત ક્લિનિકલ ચેક-ઇન',
    'qr.instant': 'ઝડપી',
    'qr.checkin': 'ચેક-ઇન',
    'qr.subtitle': 'લોબીમાં તમારા આગમનની તરત જ જાણ કરવા માટે તમારી એપોઈન્ટમેન્ટનો QR કોડ સ્કેન કરો.',
    'qr.unique': 'દરેક એપોઈન્ટમેન્ટ માટે અલગ QR કોડ',
    'qr.encrypted': 'સંપૂર્ણ એન્ક્રિપ્ટેડ ઓળખ',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'en' || saved === 'gu')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
