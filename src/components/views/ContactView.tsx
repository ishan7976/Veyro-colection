import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Mail, MapPin, Phone, MessageSquare, Send, ChevronDown, CheckCircle2, Instagram } from 'lucide-react';

export const ContactView: React.FC = () => {
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Order Enquiry');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message })
      });
      const data = await res.json();
      if (res.ok) {
        addToast({ title: 'Message Sent', message: 'VEYRO Support will respond within 12 hours.', type: 'success' });
        setTicketId(data.message);
        setName('');
        setEmail('');
        setMessage('');
      } else {
        addToast({ title: 'Submission Error', message: data.error, type: 'error' });
      }
    } catch {
      addToast({ title: 'Server Error', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      q: 'How long does express shipping take?',
      a: 'VEYRO Priority Express takes 2-3 business days worldwide. Standard delivery takes 5-7 business days. All orders ship with real-time tracking.'
    },
    {
      q: 'What size should I order for the oversized boxy fit?',
      a: 'Our oversized tees and hoodies are cut with intentional drop shoulders. Take your true standard size for the boxy drape, or size down 1 size for a standard tailored fit.'
    },
    {
      q: 'How do I return or exchange a size?',
      a: 'We offer a 30-day hassle-free return and exchange policy. Simply message support@veyro.com with your Order ID and we will issue a prepaid return label.'
    },
    {
      q: 'How do I get notified when new Limited Drops launch?',
      a: 'Join the VEYRO Identity Club newsletter or turn on post notifications for @veyro.identity on Instagram. Subscribers receive secret drop passwords 1 hour early.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500">24/7 SUPPORT STUDIO</span>
        <h1 className="text-3xl sm:text-5xl font-black text-neutral-900 dark:text-white tracking-tight uppercase">
          CONNECT WITH VEYRO
        </h1>
        <p className="text-xs text-neutral-500">
          Have a question about sizes, drop schedules, or an existing order? Our team responds within 12 hours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Contact Form (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900/60 p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-6">
          <h2 className="font-mono text-sm font-black uppercase text-neutral-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-500" />
            <span>Send Us a Direct Message</span>
          </h2>

          {ticketId && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-500 font-mono">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{ticketId}</span>
            </div>
          )}

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-neutral-500 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Kaelen Vance"
                  className="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-neutral-500 mb-1">Email Address</label>
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
              <label className="block text-[11px] font-bold uppercase text-neutral-500 mb-1">Subject Category</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono text-neutral-900 dark:text-white focus:outline-none"
              >
                <option value="Order Enquiry">Order Status & Tracking</option>
                <option value="Sizing Help">Size Guide & Fit Help</option>
                <option value="Returns">Returns & Exchanges</option>
                <option value="Drop Schedule">Upcoming Drop Schedule</option>
                <option value="Business Query">Press & Collaboration</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-neutral-500 mb-1">Your Message</label>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can VEYRO support team assist you today?"
                className="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 shadow-xl"
            >
              {isSubmitting ? (
                <span>Transmitting...</span>
              ) : (
                <>
                  <span>Transmit Message</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Studio Info (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-white dark:bg-neutral-900/60 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <h3 className="font-mono text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white">
              STUDIO HEADQUARTERS
            </h3>

            <div className="space-y-4 text-xs font-sans">
              <div className="flex gap-3 items-start">
                <MapPin className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">New York Studio</p>
                  <p className="text-neutral-500">742 Mercer Street, Soho, New York, NY 10013</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <MapPin className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">Tokyo Flagship</p>
                  <p className="text-neutral-500">3-18-2 Jinguumae, Shibuya-ku, Tokyo 150-0001</p>
                </div>
              </div>

              <div className="flex gap-3 items-center pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <Mail className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="font-mono font-bold text-neutral-900 dark:text-white">support@veyro.com</span>
              </div>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="p-6 bg-white dark:bg-neutral-900/60 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <h3 className="font-mono text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white">
              FREQUENTLY ASKED QUESTIONS
            </h3>

            <div className="space-y-2">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-3.5 text-left text-xs font-bold text-neutral-900 dark:text-white flex items-center justify-between gap-2"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <p className="p-3.5 pt-0 text-xs text-neutral-500 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
