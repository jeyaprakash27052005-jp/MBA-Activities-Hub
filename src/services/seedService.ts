import { createActivity } from './activityService';
import { createForm } from './formService';
import { createSystemUser } from './userService';

export const seedSampleData = async () => {
  const adminId = 'seed_admin_101';
  const facultyId = 'seed_faculty_102';

  // Seed sample users
  try {
    await createSystemUser({
      uid: adminId,
      email: 'admin@mba.edu',
      displayName: 'Dean Marcus Vance',
      role: 'admin',
      department: 'Executive MBA Administration',
      batch: 'Leadership Council',
      status: 'active'
    });

    await createSystemUser({
      uid: facultyId,
      email: 'faculty@mba.edu',
      facultyId: 'FAC001',
      displayName: 'Prof. Elena Rostova',
      role: 'faculty',
      position: 'Activity & Placement Coordinator',
      department: 'Strategy & Financial Markets',
      batch: 'Faculty Board',
      status: 'active'
    });

    await createSystemUser({
      uid: 'seed_student_103',
      email: '25mba001@mba.edu',
      rollNumber: '25MBA001',
      displayName: 'Aarav Sharma',
      role: 'student',
      position: 'Class Representative (CR)',
      yearOfStudying: '1st Year (2025-2027)',
      department: 'Finance & Analytics',
      batch: 'MBA Class of 2027',
      status: 'active'
    });
  } catch (e) {
    console.warn('Users seed note:', e);
  }

  // Seed Activities
  const activities = [
    {
      title: 'Global Macroeconomics & Geopolitics Conclave 2026',
      description: 'An elite symposium featuring central bankers, chief economists, and hedge fund strategists dissecting currency fluctuations, interest rate trajectories, and global trade corridors.',
      category: 'seminar' as const,
      date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      startTime: '09:30',
      endTime: '13:00',
      venue: 'Main Auditorium, Hall A & Virtual Livestream',
      speaker: 'Dr. Raymond Sterling (Senior Fellow, Brookings)',
      organizerId: facultyId,
      organizerName: 'Prof. Elena Rostova',
      maxParticipants: 150,
      status: 'upcoming' as const,
      materialsUrl: 'https://mba-activities.edu/materials/macroeconomics-2026.pdf',
    },
    {
      title: 'McKinsey & BCG Case Crackathon: Enterprise Turnaround',
      description: 'Inter-cohort case championship. 36-hour intense business problem solving analyzing an FMCG giant restructuring its supply chain in Southeast Asia.',
      category: 'competition' as const,
      date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '18:00',
      venue: 'Executive Innovation Lab, 4th Floor',
      speaker: 'Alumni Panel from McKinsey & Bain',
      organizerId: adminId,
      organizerName: 'Dean Marcus Vance',
      maxParticipants: 60,
      status: 'upcoming' as const,
    },
    {
      title: 'Venture Capital Term Sheet Negotiation Masterclass',
      description: 'Hands-on legal and valuation workshop breaking down liquidation preferences, anti-dilution ratchets, founder vesting, and drag-along rights with actual venture capitalists.',
      category: 'workshop' as const,
      date: new Date(Date.now() + 86400000 * 12).toISOString().split('T')[0],
      startTime: '14:00',
      endTime: '17:30',
      venue: 'Seminar Hall 3',
      speaker: 'Priya Sharma (General Partner, Horizon Ventures)',
      organizerId: facultyId,
      organizerName: 'Prof. Elena Rostova',
      maxParticipants: 80,
      status: 'upcoming' as const,
    },
    {
      title: 'Corporate Connect: Google & Microsoft Cloud Strategy Briefing',
      description: 'Senior product and go-to-market directors discuss AI monetization, hyperscaler competition, and enterprise sales strategies.',
      category: 'guest_lecture' as const,
      date: new Date(Date.now() + 86400000 * 18).toISOString().split('T')[0],
      startTime: '16:00',
      endTime: '18:00',
      venue: 'Auditorium 2 & Google Meet',
      speaker: 'Vikram Joshi (VP Cloud Solutions)',
      organizerId: adminId,
      organizerName: 'Dean Marcus Vance',
      maxParticipants: 200,
      status: 'upcoming' as const,
    },
    {
      title: 'MBA Annual Alumni Leadership Dinner & Mentorship Launch',
      description: 'Networking gala connecting current MBA candidates with senior alumni leaders across banking, consulting, big tech, and healthtech.',
      category: 'club_event' as const,
      date: new Date(Date.now() + 86400000 * 25).toISOString().split('T')[0],
      startTime: '19:00',
      endTime: '22:30',
      venue: 'The Grand Pavilion, Campus Greens',
      speaker: 'Alumni Association Board',
      organizerId: adminId,
      organizerName: 'Dean Marcus Vance',
      maxParticipants: 250,
      status: 'upcoming' as const,
    }
  ];

  const createdActs = [];
  for (const act of activities) {
    try {
      const created = await createActivity(act);
      createdActs.push(created);
    } catch (e) {
      console.warn('Activity seed error:', e);
    }
  }

  // Seed sample dynamic forms linked to activities
  try {
    await createForm({
      title: 'Registration: McKinsey & BCG Case Crackathon',
      description: 'Please submit your team composition, MBA cohort specialization, and previous case tournament experience. Shortlisted teams will be allotted faculty mentors.',
      activityId: createdActs[1]?.id || '',
      activityTitle: 'McKinsey & BCG Case Crackathon: Enterprise Turnaround',
      createdBy: adminId,
      createdByName: 'Dean Marcus Vance',
      deadline: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      isPublished: true,
      allowMultipleSubmissions: false,
      fields: [
        {
          id: 'f_team_name',
          label: 'Team Name',
          type: 'text',
          placeholder: 'e.g. Apex Strategists',
          required: true,
        },
        {
          id: 'f_cohort',
          label: 'Cohort & Specialization',
          type: 'select',
          options: ['MBA Strategy & Leadership', 'MBA Finance & Quantitative Methods', 'MBA Marketing & Digital Commerce', 'MBA Tech & Supply Chain'],
          required: true,
        },
        {
          id: 'f_team_size',
          label: 'Number of Team Members (3-4)',
          type: 'radio',
          options: ['3 Members', '4 Members'],
          required: true,
        },
        {
          id: 'f_prep_notes',
          label: 'Prior Case Competition Experience or Motivation',
          type: 'textarea',
          placeholder: 'Briefly highlight any relevant case competitions or consulting projects...',
          required: false,
        },
        {
          id: 'f_confirm_rules',
          label: 'I confirm all team members are active enrolled MBA students and agree to honor code',
          type: 'checkbox',
          options: ['I Agree to Honor Code & Code of Conduct'],
          required: true,
        }
      ]
    });

    await createForm({
      title: 'Masterclass RSVP: Venture Capital Term Sheet Negotiation',
      description: 'RSVP and pre-session preparation assessment. Limited to 80 seats on a first-come, first-evaluated basis.',
      activityId: createdActs[2]?.id || '',
      activityTitle: 'Venture Capital Term Sheet Negotiation Masterclass',
      createdBy: facultyId,
      createdByName: 'Prof. Elena Rostova',
      deadline: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
      isPublished: true,
      allowMultipleSubmissions: false,
      fields: [
        {
          id: 'f_full_name',
          label: 'Participant Full Name',
          type: 'text',
          placeholder: 'Full official name',
          required: true,
        },
        {
          id: 'f_student_id',
          label: 'Student / Roll ID',
          type: 'text',
          placeholder: 'MBA2025-XXX',
          required: true,
        },
        {
          id: 'f_experience_level',
          label: 'Familiarity with Financial Valuation & Cap Tables',
          type: 'select',
          options: ['Beginner (Took Corporate Finance)', 'Intermediate (Built DCF / LBO models)', 'Advanced (Interned in PE / VC / IB)'],
          required: true,
        },
        {
          id: 'f_interest_topic',
          label: 'Key Topic You Want Answered by the General Partner',
          type: 'textarea',
          placeholder: 'e.g., How to negotiate liquidation preferences in down-rounds...',
          required: true,
        }
      ]
    });
  } catch (e) {
    console.warn('Form seed error:', e);
  }
};
