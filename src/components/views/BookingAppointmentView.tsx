import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigation } from '../../context/NavigationContext';
import { Appointment } from '../../types';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  Database, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  ShieldCheck, 
  Scissors,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export const BookingAppointmentView: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { navigateTo } = useNavigation();

  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.addresses?.[0]?.phone || '');
  const [appointmentType, setAppointmentType] = useState<Appointment['appointmentType']>('VIP Atelier Styling');
  const [location, setLocation] = useState<Appointment['location']>('New York Flagship Atelier');
  
  // Set default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];
  
  const [preferredDate, setPreferredDate] = useState(defaultDateStr);
  const [preferredTime, setPreferredTime] = useState('02:00 PM');
  const [notes, setNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState(true);
  const [bookedSuccessAppt, setBookedSuccessAppt] = useState<Appointment | null>(null);

  // Fetch appointments
  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const queryParam = user?.id ? `?userId=${user.id}` : (email ? `?userId=${email}` : '');
      const res = await fetch(`/api/appointments${queryParam}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user, email]);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !preferredDate || !preferredTime) {
      addToast({ title: 'Missing Information', message: 'Please complete all required fields.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          appointmentType,
          preferredDate,
          preferredTime,
          location,
          notes,
          userId: user?.id || email
        })
      });

      const data = await res.json();

      if (res.ok) {
        addToast({
          title: 'Appointment Scheduled & Saved to Supabase!',
          message: `Booking #${data.id} saved in your Supabase account (Project jjkmtvtdobhiehfzeljr).`,
          type: 'success'
        });
        setBookedSuccessAppt(data);
        fetchAppointments();
        setNotes('');
      } else {
        addToast({ title: 'Booking Failed', message: data.error || 'Server error', type: 'error' });
      }
    } catch (err) {
      addToast({ title: 'Connection Error', message: 'Failed to schedule appointment', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeSlots = [
    '10:00 AM',
    '11:30 AM',
    '01:00 PM',
    '02:30 PM',
    '04:00 PM',
    '05:30 PM',
    '07:00 PM'
  ];

  const locations = [
    {
      id: 'New York Flagship Atelier',
      title: 'New York Flagship Atelier',
      address: '742 Mercer Street, Soho, NYC',
      badge: 'Private Fitting Lounge'
    },
    {
      id: 'Los Angeles Showroom',
      title: 'Los Angeles Showroom',
      address: '8830 Melrose Ave, West Hollywood, CA',
      badge: 'VIP VIP Stylists'
    },
    {
      id: 'Tokyo Pop-up Studio',
      title: 'Tokyo Pop-up Studio',
      address: '5-7-22 Minamiaoyama, Minato-ku, Tokyo',
      badge: 'Limited Drop Archive'
    },
    {
      id: 'Virtual 1-on-1 Session',
      title: 'Virtual 1-on-1 Session',
      address: 'HD Video Session with Lead VEYRO Designer',
      badge: 'Global Online'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Supabase Connection Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-neutral-900 to-black text-white p-5 sm:p-6 rounded-3xl border border-emerald-500/30 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400">
            <Database className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                SUPABASE DATABASE INTEGRATED
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
              Project ID: <span className="font-mono text-emerald-300">jjkmtvtdobhiehfzeljr</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              All appointment bookings and customer details are automatically stored and synced in your Supabase account.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-mono text-emerald-300 flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Real-time Sync Active</span>
        </div>
      </div>

      {/* Main Title Section */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-amber-500 flex items-center justify-center gap-1.5">
          <Scissors className="w-4 h-4" />
          <span>BESPOKE & PRIVATE FIT STUDIO</span>
        </span>
        <h1 className="font-hero text-3xl sm:text-5xl font-black text-neutral-900 dark:text-white uppercase tracking-tight">
          Book Atelier Appointment
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Schedule an exclusive 1-on-1 private styling session, custom sizing measurement, or bespoke drop consultation with VEYRO lead designers.
        </p>
      </div>

      {/* Booking Form + Live Supabase Appointments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Booking Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900/70 p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <h2 className="font-heading text-lg font-black uppercase text-neutral-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Schedule Session</span>
            </h2>
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full">
              Instant Supabase Sync
            </span>
          </div>

          {bookedSuccessAppt && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-500 font-bold uppercase">
                <CheckCircle2 className="w-4 h-4" />
                <span>Appointment Saved to Supabase Database!</span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-300">
                Booking Reference: <strong className="font-mono text-emerald-400">{bookedSuccessAppt.id}</strong> on {bookedSuccessAppt.preferredDate} at {bookedSuccessAppt.preferredTime}.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmitBooking} className="space-y-5">
            {/* Appointment Type Selection */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
                Appointment Experience
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  'Personal Fitting',
                  'VIP Atelier Styling',
                  'Bespoke Customization',
                  'Boutique Consultation'
                ].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAppointmentType(type as any)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-left border transition-all cursor-pointer ${
                      appointmentType === type
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-md'
                        : 'bg-neutral-50 dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Cards */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
                Atelier Location
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {locations.map((loc) => (
                  <div
                    key={loc.id}
                    onClick={() => setLocation(loc.id as any)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      location === loc.id
                        ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/30'
                        : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                        {loc.title}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-1">{loc.address}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Date & Time Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  Preferred Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white font-mono focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Time Slot
                </label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white font-mono focus:outline-none focus:border-neutral-400"
                >
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Kaelen Vance"
                  className="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-neutral-400" />
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@veyro.com"
                  className="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-neutral-400" />
                Style Notes / Size Measurements (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mention specific silhouettes, sizing requirements, or drops you wish to sample during your session."
                className="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="font-button w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold uppercase tracking-[0.18em] rounded-2xl hover:bg-black dark:hover:bg-neutral-100 transition shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving to Supabase Database...</span>
                </>
              ) : (
                <>
                  <span>Confirm & Save Appointment to Supabase</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Supabase Saved Appointments List (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-neutral-900/70 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
              <div>
                <h3 className="font-heading text-sm font-black uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-500" />
                  <span>Your Bookings in Supabase</span>
                </h3>
                <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">
                  Table: appointments • Project ID: jjkmtvtdobhiehfzeljr
                </p>
              </div>
              <button
                onClick={fetchAppointments}
                className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
                title="Refresh from Supabase"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {isLoading ? (
              <div className="py-10 text-center text-xs font-mono text-neutral-400">
                Fetching Supabase records...
              </div>
            ) : appointments.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <Calendar className="w-8 h-8 text-neutral-400 mx-auto" />
                <p className="text-xs font-bold uppercase text-neutral-800 dark:text-neutral-200">
                  No Appointments Booked Yet
                </p>
                <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                  Complete the form to schedule your private fitting. Your booking will be saved instantly to your Supabase project.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                {appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-4 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3 shadow-sm hover:border-neutral-400 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-amber-500 uppercase">
                        {appt.id}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-full uppercase font-bold">
                        {appt.status || 'Confirmed'} • Supabase Synced
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase">
                        {appt.appointmentType}
                      </h4>
                      <p className="text-[11px] text-neutral-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                        <span>{appt.location}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
                      <div>
                        <span className="text-neutral-400 block uppercase text-[9px]">Date</span>
                        <span className="font-bold">{appt.preferredDate}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block uppercase text-[9px]">Time</span>
                        <span className="font-bold">{appt.preferredTime}</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-neutral-500 flex items-center justify-between pt-1 border-t border-neutral-200 dark:border-neutral-800">
                      <span>Customer: {appt.fullName}</span>
                      <span className="font-mono text-[9px] text-neutral-400">
                        {new Date(appt.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
