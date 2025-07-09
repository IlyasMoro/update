const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Serve static files from 'public' folder (index.html served automatically at '/')
app.use(express.static(path.join(__dirname, 'public')));

const DEFAULT_APPLY_URL = 'https://www.indeed.com/worldwide';

const jobTitles = [
  'Frontend Developer', 'Backend Engineer', 'Full Stack Developer', 'UX Designer',
  'Data Scientist', 'DevOps Engineer', 'Product Manager', 'QA Engineer',
  'Mobile App Developer', 'Technical Writer', 'Cybersecurity Analyst', 'Marketing Specialist',
  'HR Coordinator', 'Content Creator', 'Financial Analyst', 'Customer Support Rep',
  'Research Scientist', 'UI Developer', 'Database Administrator', 'Cloud Architect',
  'Machine Learning Engineer', 'Business Analyst', 'Graphic Designer', 'Sales Manager',
  'Network Engineer', 'System Administrator', 'SEO Specialist', 'Social Media Manager',
  'Project Manager', 'IT Consultant'
];

const companies = [
  'Tech Innovators', 'Global Solutions', 'Creative Minds', 'Quant Analytics',
  'AppWorks', 'Cloudify Systems', 'Growth Metrics', 'Quality First Labs',
  'DocuTech Solutions', 'SecureNet', 'Brand Boosters', 'PeopleConnect',
  'Storytellers Guild', 'Apex Capital', 'HelpDesk Pro', 'BioInnovate Labs',
  'Pixel Perfect', 'DataVault Solutions', 'SkyNet Services', 'AI Minds'
];

const locations = [
  'Remote', 'New York, NY', 'San Francisco, CA', 'London, UK',
  'Boston, MA', 'Chicago, IL', 'Dallas, TX', 'Seattle, WA',
  'Los Angeles, CA', 'Washington D.C.', 'Austin, TX', 'Denver, CO',
  'Miami, FL', 'Toronto, Canada', 'Berlin, Germany', 'Paris, France'
];

const jobTypes = ['Full-Time', 'Part-Time', 'Freelance', 'Internship', 'Contract'];

const descriptions = [
  'Develop and maintain cutting-edge web applications.',
  'Collaborate with cross-functional teams to deliver high-quality products.',
  'Design user-friendly interfaces and improve user experience.',
  'Analyze large datasets to extract actionable insights.',
  'Manage cloud infrastructure and automate deployments.',
  'Lead product development and define roadmaps.',
  'Ensure software quality through rigorous testing.',
  'Create engaging content for marketing campaigns.',
  'Provide excellent customer support and troubleshoot issues.',
  'Write clear and concise technical documentation.'
];

// Helper function: random integer between min and max inclusive
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate 100 mock jobs with unique URLs
const jobs = Array.from({ length: 100 }, (_, i) => {
  const title = jobTitles[randomInt(0, jobTitles.length - 1)];
  const company = companies[randomInt(0, companies.length - 1)];
  const location = locations[randomInt(0, locations.length - 1)];
  const jobType = jobTypes[randomInt(0, jobTypes.length - 1)];
  const description = descriptions[randomInt(0, descriptions.length - 1)];
  const id = i + 1;

  const companySlug = company.toLowerCase().replace(/\s+/g, '');
  const url = `https://apply.${companySlug}.com/job/${id}`;

  return {
    id,
    title,
    company_name: company,
    candidate_required_location: location,
    job_type: jobType,
    description,
    url
  };
});

// Validate query params middleware
function validateQueryParams(req, res, next) {
  let { page = '1', limit = '9' } = req.query;
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  if (isNaN(page) || page < 1) {
    return res.status(400).json({ error: 'Invalid page parameter. Must be a positive integer.' });
  }
  if (isNaN(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ error: 'Invalid limit parameter. Must be between 1 and 100.' });
  }

  req.query.page = page;
  req.query.limit = limit;
  next();
}

// API endpoint for jobs
app.get('/api/jobs', validateQueryParams, (req, res) => {
  try {
    let { search = '', location = '', job_type = '', page, limit } = req.query;

    search = String(search).trim().toLowerCase();
    location = String(location).trim().toLowerCase();
    job_type = String(job_type).trim().toLowerCase();

    const filteredJobs = jobs.filter(job => {
      const matchesSearch =
        job.title.toLowerCase().includes(search) ||
        job.company_name.toLowerCase().includes(search) ||
        job.description.toLowerCase().includes(search);
      const matchesLocation = job.candidate_required_location.toLowerCase().includes(location);
      const matchesType = job_type ? job.job_type.toLowerCase() === job_type : true;
      return matchesSearch && matchesLocation && matchesType;
    });

    const totalJobs = filteredJobs.length;
    const totalPages = Math.ceil(totalJobs / limit) || 1;

    if (page > totalPages) page = totalPages;

    const startIndex = (page - 1) * limit;
    const pagedJobs = filteredJobs.slice(startIndex, startIndex + limit);

    const jobsWithUrls = pagedJobs.map(job => ({
      ...job,
      url: job.url && job.url.trim() ? job.url : DEFAULT_APPLY_URL,
    }));

    res.json({
      jobs: jobsWithUrls,
      totalJobs,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error('Error in /api/jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
