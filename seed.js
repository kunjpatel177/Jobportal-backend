const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Job = require('./models/Job');

// Load environment variables
dotenv.config();

const sampleJobs = [
  {
    title: 'MERN Stack Developer',
    company: 'TechWave Solutions',
    location: 'San Francisco, CA (Hybrid)',
    description:
      'We are looking for an experienced MERN Stack Developer to design and develop scalable full-stack applications. You will collaborate with cross-functional teams to define, design, and ship new features.',
    requirements: [
      '3+ years of experience with MongoDB, Express.js, React, and Node.js',
      'Strong proficiency in JavaScript (ES6+), HTML5, and CSS3',
      'Experience with RESTful APIs, state management, and modern frontend workflows',
      'Familiarity with Git version control and agile methodologies'
    ]
  },
  {
    title: 'Node.js Backend Developer',
    company: 'Apex Cloud Systems',
    location: 'Austin, TX (Remote)',
    description:
      'Apex Cloud Systems is seeking a talented Node.js Backend Developer to build high-performance microservices, optimize database queries, and implement robust security protocols.',
    requirements: [
      '4+ years of backend development experience with Node.js and Express',
      'Proficiency in MongoDB, schema design, and indexing strategies',
      'Deep understanding of asynchronous programming and event-driven architecture',
      'Experience implementing JWT authentication and role-based access control'
    ]
  },
  {
    title: 'React.js Developer',
    company: 'PixelCraft Digital',
    location: 'New York, NY (On-site)',
    description:
      'PixelCraft is looking for an enthusiastic React.js Developer to build responsive, accessible, and high-performance user interfaces for our premier clients.',
    requirements: [
      '2+ years of hands-on experience building web apps with React.js',
      'Solid command of modern React hooks, Context API, and state management',
      'Experience with Bootstrap, CSS Grid, Flexbox, and responsive web design',
      'Passion for building intuitive, accessible, and pixel-perfect UIs'
    ]
  },
  {
    title: 'Full Stack Developer',
    company: 'InnoVantage Labs',
    location: 'Seattle, WA (Remote)',
    description:
      'Join InnoVantage Labs as a Full Stack Developer where you will spearhead end-to-end development of our next-generation enterprise SaaS platform.',
    requirements: [
      '3+ years of full-stack web development experience',
      'Solid skills in Node.js, Express, React, and NoSQL databases',
      'Experience handling file uploads, third-party API integrations, and cloud storage',
      'Ability to write clean, modular, and maintainable code'
    ]
  },
  {
    title: 'Software Engineer',
    company: 'NextGen Core Technologies',
    location: 'Boston, MA (Hybrid)',
    description:
      'We are looking for a versatile Software Engineer to solve complex technical challenges, architect scalable web systems, and contribute across our engineering stack.',
    requirements: [
      'Bachelor’s degree in Computer Science or equivalent practical experience',
      'Strong problem-solving abilities and algorithmic thinking',
      'Experience with JavaScript / Node.js development in web environments',
      'Excellent communication skills and eagerness to mentor team members'
    ]
  }
];

const seedJobs = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/job_portal';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected for seeding.');

    let insertedCount = 0;
    let existingCount = 0;

    for (const jobData of sampleJobs) {
      const existing = await Job.findOne({
        title: jobData.title,
        company: jobData.company
      });

      if (!existing) {
        await Job.create(jobData);
        console.log(`+ Added job: "${jobData.title}" at "${jobData.company}"`);
        insertedCount++;
      } else {
        console.log(`= Already exists: "${jobData.title}" at "${jobData.company}"`);
        existingCount++;
      }
    }

    console.log(
      `Seeding complete. Inserted: ${insertedCount}, Already existing: ${existingCount}`
    );
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedJobs();
