// =============================================================
//  Training Academy — Phase 6.13
//  Course library, progress tracking, certification
// =============================================================
import { useState } from 'react';
import { BookOpen, CheckCircle2, Clock, Award, ChevronDown, ChevronUp, Play, Star } from 'lucide-react';

const OFFICER = {
  name: 'Shreya Nair', badge: '#1923', role: 'Sub-Inspector', station: 'Cyber Crime Branch', level: 65,
};

const COURSES = [
  {
    id: 'C-001', title: 'Platform Overview & Navigation', category: 'mandatory', hours: 3,
    status: 'completed', score: 85, deadline: '2024-11-30',
    topics: ['Dashboard layout & features', 'Alert prioritization system', 'Incident lifecycle management', 'Officer dispatch workflow'],
    questions: 30, passMark: 70,
  },
  {
    id: 'C-002', title: 'Evidence Handling & Chain of Custody', category: 'mandatory', hours: 4,
    status: 'in_progress', progress: 60, deadline: '2024-12-15',
    topics: ['Digital evidence collection', 'Tamper-proof storage procedures', 'Blockchain verification', 'Forensic lab submission', 'Legal admissibility standards'],
    questions: 40, passMark: 70,
  },
  {
    id: 'C-003', title: 'Cyber Crime Awareness', category: 'mandatory', hours: 2,
    status: 'completed', score: 92, deadline: '2024-11-18',
    topics: ['Types of cyber crimes against women', 'Deepfake identification techniques', 'Phishing & fake profile detection', 'Online harassment patterns'],
    questions: 25, passMark: 70,
  },
  {
    id: 'C-004', title: 'Victim Support & Trauma-Informed Policing', category: 'mandatory', hours: 3,
    status: 'in_progress', progress: 30, deadline: '2024-12-15',
    topics: ['PTSD & secondary trauma understanding', 'Compassionate communication', 'Mental health resource referrals', 'Privacy protection during investigation'],
    questions: 35, passMark: 70,
  },
  {
    id: 'C-005', title: 'Digital Forensics & Image Analysis', category: 'advanced', hours: 8,
    status: 'not_assigned', deadline: null,
    topics: ['Deepfake detection algorithms', 'EXIF & metadata analysis', 'Hash verification & integrity checking', 'Device fingerprinting techniques', 'Lab workflow & report generation'],
    questions: 50, passMark: 75,
    cert: 'Forensic Analyst Credential',
  },
  {
    id: 'C-006', title: 'Blockchain & Legal Evidence', category: 'advanced', hours: 4,
    status: 'recommended', deadline: '2024-12-30',
    topics: ['Blockchain fundamentals for police', 'Chain of custody implementation', 'Tamper detection & verification', 'Court testimony on blockchain evidence'],
    questions: 30, passMark: 70,
  },
];

const COMPLETED = COURSES.filter(c => c.status === 'completed');
const IN_PROGRESS = COURSES.filter(c => c.status === 'in_progress');

const statusStyle = {
  completed:    { color: 'var(--safe)',   bg: 'rgba(5,150,105,0.1)',  label: '✅ Completed' },
  in_progress:  { color: 'var(--accent)', bg: 'rgba(37,99,235,0.1)', label: '🔄 In Progress' },
  not_assigned: { color: 'rgba(0,0,0,0.3)', bg: 'rgba(0,0,0,0.05)', label: '—  Not Assigned' },
  recommended:  { color: 'var(--warn)',   bg: 'rgba(217,119,6,0.1)', label: '⭐ Recommended' },
};

function CourseCard({ c }) {
  const [open, setOpen] = useState(false);
  const ss = statusStyle[c.status] || statusStyle.not_assigned;

  return (
    <div style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid var(--hud-border)', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} onClick={() => setOpen(!open)}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: ss.bg, border: `1px solid ${ss.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {c.status === 'completed' ? <CheckCircle2 size={16} color={ss.color} /> : c.status === 'in_progress' ? <Play size={16} color={ss.color} /> : <BookOpen size={16} color={ss.color} />}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {c.title}
              <span style={{ fontSize: '0.58rem', fontWeight: 800, color: c.category === 'mandatory' ? 'var(--critical)' : 'var(--accent)', background: c.category === 'mandatory' ? 'var(--critical-dim)' : 'rgba(37,99,235,0.08)', padding: '1px 5px', borderRadius: 4 }}>
                {c.category === 'mandatory' ? '⚡ MANDATORY' : '⭐ ADVANCED'}
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              {c.hours}h · {c.questions} questions · Pass: {c.passMark}%{c.deadline ? ` · Deadline: ${c.deadline}` : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: ss.color, background: ss.bg, padding: '2px 7px', borderRadius: 5 }}>{ss.label}</span>
          {c.score && <span style={{ fontSize: '0.7rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--safe)' }}>{c.score}/100</span>}
          {open ? <ChevronUp size={12} color="var(--text-secondary)" /> : <ChevronDown size={12} color="var(--text-secondary)" />}
        </div>
      </div>

      {/* Progress bar for in-progress */}
      {c.status === 'in_progress' && (
        <div style={{ padding: '0 16px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Progress</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{c.progress}%</span>
          </div>
          <div style={{ height: 5, background: 'rgba(0,0,0,0.07)', borderRadius: 3 }}>
            <div style={{ height: '100%', width: `${c.progress}%`, background: 'var(--accent)', borderRadius: 3, transition: 'width 0.6s' }} />
          </div>
        </div>
      )}

      {open && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ marginTop: 10, marginBottom: 12 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Course Content</div>
            {c.topics.map((t, i) => (
              <div key={i} style={{ fontSize: '0.74rem', color: 'var(--text-primary)', padding: '3px 0', display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--accent)' }}>•</span> {t}
              </div>
            ))}
          </div>
          {c.cert && (
            <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 800, color: 'var(--warn)' }}>
                <Award size={13} /> Earns Certification: {c.cert}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            {c.status === 'in_progress' && <button className="hud-btn hud-btn-primary" style={{ padding: '5px 12px', fontSize: '0.68rem' }}><Play size={11} /> Resume Course</button>}
            {c.status === 'completed' && <button className="hud-btn hud-btn-ghost" style={{ padding: '5px 12px', fontSize: '0.68rem' }}><Award size={11} /> View Certificate</button>}
            {(c.status === 'recommended' || c.status === 'not_assigned') && <button className="hud-btn hud-btn-primary" style={{ padding: '5px 12px', fontSize: '0.68rem' }}><Play size={11} /> Start Course</button>}
            {c.status === 'completed' && <button className="hud-btn hud-btn-ghost" style={{ padding: '5px 12px', fontSize: '0.68rem' }}>Review</button>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrainingPage() {
  const [tab, setTab] = useState('courses');

  return (
    <div className="hud-panel animate-in" style={{
      position: 'absolute', top: 24, right: 24, bottom: 90, width: 640,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div className="hud-panel-header">
        <div className="hud-panel-title"><BookOpen size={14} /> Training & Certification Academy</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ v: 'courses', l: 'Courses' }, { v: 'profile', l: 'My Profile' }].map(t => (
            <button key={t.v} className={`hud-btn ${tab === t.v ? 'hud-btn-primary' : 'hud-btn-ghost'}`} style={{ padding: '3px 10px', fontSize: '0.65rem' }} onClick={() => setTab(t.v)}>{t.l}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '10px 18px', display: 'flex', gap: 20, borderBottom: '1px solid var(--hud-border)', background: 'rgba(255,255,255,0.3)' }}>
        {[
          { l: 'Total Courses', v: COURSES.length, c: 'var(--text-primary)' },
          { l: 'Completed', v: COMPLETED.length, c: 'var(--safe)' },
          { l: 'In Progress', v: IN_PROGRESS.length, c: 'var(--accent)' },
          { l: 'Training Level', v: `${OFFICER.level}%`, c: 'var(--warn)' },
          { l: 'Certifications', v: '2', c: 'var(--safe)' },
        ].map(s => (
          <div key={s.l}>
            <div style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
        {tab === 'courses' && (
          <>
            {/* Mandatory */}
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--critical)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚡ Mandatory Courses (Required for All Officers)
            </div>
            {COURSES.filter(c => c.category === 'mandatory').map(c => <CourseCard key={c.id} c={c} />)}

            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '16px 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              ⭐ Advanced Courses (For Investigators / Lab)
            </div>
            {COURSES.filter(c => c.category === 'advanced').map(c => <CourseCard key={c.id} c={c} />)}
          </>
        )}

        {tab === 'profile' && (
          <>
            {/* Officer card */}
            <div style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.08))', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 14, padding: '18px 20px', marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(37,99,235,0.15)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>👮</div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text-primary)' }}>{OFFICER.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{OFFICER.role} · Badge {OFFICER.badge} · {OFFICER.station}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(37,99,235,0.1)', color: 'var(--accent)', padding: '3px 8px', borderRadius: 6 }}>Intermediate Level</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(5,150,105,0.1)', color: 'var(--safe)', padding: '3px 8px', borderRadius: 6 }}>2 Certifications</span>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Training Completion</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{OFFICER.level}%</span>
                </div>
                <div style={{ height: 8, background: 'rgba(0,0,0,0.1)', borderRadius: 4 }}>
                  <div style={{ height: '100%', width: `${OFFICER.level}%`, background: 'var(--accent)', borderRadius: 4, transition: 'width 0.6s' }} />
                </div>
              </div>
            </div>

            {/* Completed Courses */}
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--safe)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Completed Courses</div>
            {COMPLETED.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.15)', borderRadius: 8, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={14} color="var(--safe)" />
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>{c.title}</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Score: {c.score}/100 · {c.hours} hours</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={11} fill={i < Math.round(c.score / 20) ? 'var(--warn)' : 'none'} color={i < Math.round(c.score / 20) ? 'var(--warn)' : 'rgba(0,0,0,0.2)'} />)}
                </div>
              </div>
            ))}

            {/* In-Progress Courses */}
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '14px 0 10px' }}>Current Courses</div>
            {IN_PROGRESS.map(c => (
              <div key={c.id} style={{ padding: '10px 14px', background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 8, marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.76rem', color: 'var(--text-primary)' }}>{c.title}</div>
                  <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 800 }}>{c.progress}%</div>
                </div>
                <div style={{ height: 4, background: 'rgba(0,0,0,0.07)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${c.progress}%`, background: 'var(--accent)', borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginTop: 4 }}>Deadline: {c.deadline}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
