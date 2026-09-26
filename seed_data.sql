-- =============================================================================
-- Database Management Systems (CS203) - Academic Year 2026-27
-- SVNIT Surat - Department of Computer Science & Engineering
-- Project: Freelance Marketplace (Phase D: Physical Database Implementation)
-- Team: Table Ninjas
-- File: seed_data.sql
-- =============================================================================

USE freelance_marketplace;

-- Disable FK checks during mass insertion to permit flexible ordering if needed
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. Seed: users (14 users: 5 Clients, 7 Freelancers, 1 Dual, 1 Admin)
-- -----------------------------------------------------------------------------
INSERT INTO users (user_id, email, password_hash, first_name, last_name, phone, user_role, account_status, created_at) VALUES
(1,  'alice@techcorp.io',        '$2y$12$e8x6sY9...dummyhash1', 'Alice',    'Johnson', '+1-415-555-0101', 'CLIENT',     'ACTIVE', '2026-01-10 09:00:00'),
(2,  'bob@finstart.com',         '$2y$12$e8x6sY9...dummyhash2', 'Bob',      'Smith',   '+1-212-555-0102', 'CLIENT',     'ACTIVE', '2026-01-12 10:30:00'),
(3,  'carol@cloudscale.net',     '$2y$12$e8x6sY9...dummyhash3', 'Carol',    'Danvers', '+1-206-555-0103', 'CLIENT',     'ACTIVE', '2026-01-15 14:15:00'),
(4,  'david@dataminds.ai',       '$2y$12$e8x6sY9...dummyhash4', 'David',    'Miller',  '+1-312-555-0104', 'CLIENT',     'ACTIVE', '2026-01-18 11:20:00'),
(5,  'emily@healthtech.org',     '$2y$12$e8x6sY9...dummyhash5', 'Emily',    'Watson',  '+1-617-555-0105', 'CLIENT',     'ACTIVE', '2026-01-20 16:45:00'),
(6,  'faisal@codecraft.dev',     '$2y$12$e8x6sY9...dummyhash6', 'Faisal',   'Khan',    '+91-98765-43210', 'FREELANCER', 'ACTIVE', '2026-01-05 08:30:00'),
(7,  'grace@fullstack.io',       '$2y$12$e8x6sY9...dummyhash7', 'Grace',    'Hopper',  '+1-650-555-0107', 'FREELANCER', 'ACTIVE', '2026-01-06 12:00:00'),
(8,  'harsh@devopsninja.com',    '$2y$12$e8x6sY9...dummyhash8', 'Harsh',    'Patel',   '+91-91234-56789', 'FREELANCER', 'ACTIVE', '2026-01-07 10:10:00'),
(9,  'isabella@uiuxdesign.de',   '$2y$12$e8x6sY9...dummyhash9', 'Isabella', 'Rossi',   '+49-30-555-0109', 'FREELANCER', 'ACTIVE', '2026-01-08 15:30:00'),
(10, 'jack@cloudarchitect.co',   '$2y$12$e8x6sY9...dummyhash10','Jack',     'Ryan',    '+1-303-555-0110', 'FREELANCER', 'ACTIVE', '2026-01-09 17:00:00'),
(11, 'kavita@cybersec.in',       '$2y$12$e8x6sY9...dummyhash11','Kavita',   'Sharma',  '+91-99887-76655', 'FREELANCER', 'ACTIVE', '2026-01-11 13:40:00'),
(12, 'liam@mobileapps.ca',        '$2y$12$e8x6sY9...dummyhash12','Liam',     'Chen',    '+1-416-555-0112', 'FREELANCER', 'ACTIVE', '2026-01-13 18:25:00'),
(13, 'mona@agencyprime.com',     '$2y$12$e8x6sY9...dummyhash13','Mona',     'Lisa',    '+1-702-555-0113', 'DUAL',       'ACTIVE', '2026-01-14 11:00:00'),
(14, 'admin@freelancemarket.com','$2y$12$e8x6sY9...dummyhash14','Admin',    'Super',   '+1-800-555-0199', 'ADMIN',      'ACTIVE', '2026-01-01 00:00:00');

-- -----------------------------------------------------------------------------
-- 2. Seed: clients (6 clients, including dual-role user 13)
-- -----------------------------------------------------------------------------
INSERT INTO clients (client_id, company_name, company_website, street_address, city, state, country, postal_code, total_spent, jobs_posted_count) VALUES
(1,  'TechCorp Solutions Inc.', 'https://techcorp.io',      '100 Market St Suite 400', 'San Francisco', 'California', 'USA',     '94105', 0.00, 3),
(2,  'FinStart Capital',        'https://finstart.com',     '350 5th Avenue 22nd Fl',  'New York',      'New York',   'USA',     '10118', 0.00, 3),
(3,  'CloudScale Networks',     'https://cloudscale.net',   '701 Pike St Suite 1200',  'Seattle',       'Washington', 'USA',     '98101', 0.00, 3),
(4,  'DataMinds Analytics',     'https://dataminds.ai',     '200 E Randolph St',       'Chicago',       'Illinois',   'USA',     '60601', 0.00, 3),
(5,  'HealthTech Dynamics',     'https://healthtech.org',   '50 Federal St',           'Boston',        'Massachusetts','USA',   '02110', 0.00, 2),
(13, 'Prime Digital Agency',    'https://agencyprime.com',  '3799 S Las Vegas Blvd',   'Las Vegas',     'Nevada',     'USA',     '89109', 0.00, 2);

-- -----------------------------------------------------------------------------
-- 3. Seed: freelancers (8 freelancers, including dual-role user 13)
-- -----------------------------------------------------------------------------
INSERT INTO freelancers (freelancer_id, professional_title, bio_overview, hourly_rate, availability_status, years_of_experience, total_earnings, jobs_completed_count, average_rating) VALUES
(6,  'Principal Full-Stack Engineer',   'Over 8 years of production experience in high-scale React, Node.js, and relational database systems.', 65.00, 'AVAILABLE', 8.5, 0.00, 0, 0.00),
(7,  'Senior Python & Django Architect', 'Specialized in backend APIs, PostgreSQL, microservices, and distributed data pipelines.',                  75.00, 'AVAILABLE', 9.0, 0.00, 0, 0.00),
(8,  'Senior Cloud & DevOps Engineer',   'Certified AWS Solutions Architect, Kubernetes administrator, and CI/CD automation specialist.',            80.00, 'BUSY',      7.0, 0.00, 0, 0.00),
(9,  'Lead UI/UX & Product Designer',    'Expert in Figma, design systems, modern typography, responsive design, and user research.',                  55.00, 'AVAILABLE', 6.0, 0.00, 0, 0.00),
(10, 'Distributed Systems & Go Dev',     'Low-latency microservices, gRPC, Redis caching, and robust database architecture.',                         85.00, 'AVAILABLE', 7.5, 0.00, 0, 0.00),
(11, 'Security Engineer & Auditor',      'Application security, database vulnerability assessment, penetration testing, and compliance.',              90.00, 'AVAILABLE', 8.0, 0.00, 0, 0.00),
(12, 'Cross-Platform Mobile Engineer',   'Production Flutter and React Native developer delivering smooth iOS and Android applications.',              60.00, 'AVAILABLE', 5.5, 0.00, 0, 0.00),
(13, 'Growth Engineering Consultant',    'Bridging full-stack development with marketing automation and web analytics.',                               70.00, 'AVAILABLE', 6.5, 0.00, 0, 0.00);

-- -----------------------------------------------------------------------------
-- 4. Seed: skills (18 standardized skills)
-- -----------------------------------------------------------------------------
INSERT INTO skills (skill_id, skill_name, category, description) VALUES
(1,  'React',               'Frontend Development',      'Modern frontend library for component-based web user interfaces.'),
(2,  'Node.js',             'Backend Development',       'Event-driven asynchronous JavaScript runtime for scalable backend services.'),
(3,  'Python',              'Software Development',      'Versatile high-level programming language for web, data, and scripting.'),
(4,  'Django',              'Backend Frameworks',        'High-level Python web framework encouraging clean, pragmatic design.'),
(5,  'MySQL',               'Database Management',       'Industry standard relational database management system with ACID transactions.'),
(6,  'PostgreSQL',          'Database Management',       'Advanced open-source object-relational database system.'),
(7,  'Docker',              'DevOps & Virtualization',   'Platform for developing, shipping, and running applications in containers.'),
(8,  'Kubernetes',          'DevOps & Orchestration',    'Automated container orchestration, scaling, and management system.'),
(9,  'AWS Cloud',           'Cloud Computing',           'Comprehensive cloud infrastructure (EC2, S3, RDS, Lambda, VPC).'),
(10, 'Figma UI/UX',         'UI/UX Design',              'Collaborative interface design, wireframing, and interactive prototyping tool.'),
(11, 'Flutter',             'Mobile Development',        'Google multi-platform framework for iOS, Android, and web from a single codebase.'),
(12, 'TypeScript',          'Programming Languages',     'Strict syntactical superset of JavaScript adding static type definitions.'),
(13, 'Go (Golang)',         'Backend Development',       'Statically typed, compiled language engineered for high concurrency.'),
(14, 'GraphQL',             'API Technologies',          'Query language and runtime for declarative API data fetching.'),
(15, 'Machine Learning',    'Artificial Intelligence',   'Statistical models, neural networks, predictive analytics, and Scikit-Learn.'),
(16, 'Redis',               'In-Memory Data Store',      'In-memory key-value data structure store used as a database, cache, and message broker.'),
(17, 'Cyber Security',      'Security & Audit',          'Vulnerability testing, OWASP compliance, and cryptographic security audits.'),
(18, 'Vue.js',              'Frontend Development',      'Progressive reactive framework for building user interfaces.');

-- -----------------------------------------------------------------------------
-- 5. Seed: freelancer_skills (Junction with proficiency & experience)
-- -----------------------------------------------------------------------------
INSERT INTO freelancer_skills (freelancer_id, skill_id, proficiency_level, years_experience) VALUES
(6,  1,  'EXPERT',       7.5), -- Faisal: React
(6,  2,  'EXPERT',       8.0), -- Faisal: Node.js
(6,  5,  'INTERMEDIATE', 6.0), -- Faisal: MySQL
(6,  12, 'EXPERT',       5.5), -- Faisal: TypeScript
(7,  3,  'EXPERT',       9.0), -- Grace: Python
(7,  4,  'EXPERT',       8.0), -- Grace: Django
(7,  6,  'EXPERT',       8.5), -- Grace: PostgreSQL
(7,  15, 'INTERMEDIATE', 4.0), -- Grace: Machine Learning
(8,  7,  'EXPERT',       7.0), -- Harsh: Docker
(8,  8,  'EXPERT',       6.5), -- Harsh: Kubernetes
(8,  9,  'EXPERT',       7.0), -- Harsh: AWS Cloud
(8,  5,  'INTERMEDIATE', 5.0), -- Harsh: MySQL
(9,  10, 'EXPERT',       6.0), -- Isabella: Figma
(9,  1,  'BEGINNER',     2.0), -- Isabella: React
(10, 13, 'EXPERT',       7.0), -- Jack: Go
(10, 16, 'EXPERT',       6.0), -- Jack: Redis
(10, 7,  'INTERMEDIATE', 4.5), -- Jack: Docker
(11, 17, 'EXPERT',       8.0), -- Kavita: Cyber Security
(11, 3,  'INTERMEDIATE', 5.0), -- Kavita: Python
(11, 5,  'INTERMEDIATE', 5.0), -- Kavita: MySQL
(12, 11, 'EXPERT',       5.5), -- Liam: Flutter
(12, 1,  'INTERMEDIATE', 4.0), -- Liam: React
(13, 1,  'INTERMEDIATE', 5.0), -- Mona: React
(13, 2,  'INTERMEDIATE', 5.0); -- Mona: Node.js

-- -----------------------------------------------------------------------------
-- 6. Seed: portfolio_items
-- -----------------------------------------------------------------------------
INSERT INTO portfolio_items (portfolio_id, freelancer_id, title, description, project_url, completion_date) VALUES
(1, 6,  'E-Commerce Scalable Microservice', 'Engineered Node.js backend processing 25,000 requests/min with MySQL clustering.', 'https://github.com/faisal/ecom-backend', '2025-08-15'),
(2, 6,  'FinTech Real-time Dashboard',       'Built high-performance React and WebSocket dashboard with sub-second chart refreshes.', 'https://fintech-demo.codecraft.dev', '2025-11-20'),
(3, 7,  'Automated Data Ingestion Engine',   'Developed Django and Celery data pipeline ETL system handling multi-gigabyte daily feeds.', 'https://github.com/grace/etl-pipeline', '2025-09-10'),
(4, 8,  'Multi-Region Kubernetes Terraform', 'Infrastructure as Code deployment for high-availability AWS EKS cluster.', 'https://github.com/harsh/aws-eks-tf', '2025-10-05'),
(5, 9,  'Design System for SaaS Suite',      'Created unified 120-component design system in Figma with complete accessibility guidelines.', 'https://figma.com/@isabella/saas-design-system', '2025-12-01'),
(6, 10, 'High-Throughput In-Memory Broker',  'Go-based pub-sub message router backed by Redis with 500k msg/sec benchmark.', 'https://github.com/jack/go-broker', '2025-11-12'),
(7, 11, 'Fintech Web Application Audit',     'Identified and remediated 14 OWASP vulnerabilities before production mainnet launch.', 'https://kavitasec.in/reports/audit-2025', '2025-10-30'),
(8, 12, 'Telehealth Patient Mobile App',     'Cross-platform Flutter application with appointment booking and secure messaging.', 'https://apps.apple.com/app/telehealth-demo', '2025-12-15');

-- -----------------------------------------------------------------------------
-- 7. Seed: jobs (16 realistic jobs across various clients and domains)
-- -----------------------------------------------------------------------------
INSERT INTO jobs (job_id, client_id, title, description, category, payment_type, budget, experience_level, duration_days, deadline, job_status, created_at) VALUES
(1,  1, 'B2B Enterprise Portal Frontend',      'Build responsive client dashboard using React and TypeScript adhering to modern design tokens.', 'Frontend Development', 'FIXED_PRICE', 3500.00, 'EXPERT',       30, '2026-03-30', 'COMPLETED',   '2026-01-25 10:00:00'),
(2,  2, 'High-Throughput Trading API Backend', 'Design Node.js and MySQL microservice for real-time portfolio tracking and order matching.',    'Backend Development',  'FIXED_PRICE', 4200.00, 'EXPERT',       45, '2026-04-15', 'COMPLETED',   '2026-01-26 11:30:00'),
(3,  3, 'AWS EKS Migration & Terraform Setup', 'Migrate on-premise Docker workloads to AWS EKS with automated CI/CD and monitoring.',         'DevOps & Cloud',       'FIXED_PRICE', 3000.00, 'EXPERT',       25, '2026-03-20', 'COMPLETED',   '2026-01-28 09:15:00'),
(4,  4, 'Predictive Analytics Django Pipeline','Construct Python Django REST framework backend with PostgreSQL to serve ML inferences.',       'Data Engineering',     'FIXED_PRICE', 4000.00, 'EXPERT',       40, '2026-04-10', 'COMPLETED',   '2026-02-01 14:00:00'),
(5,  5, 'HealthTech Mobile Patient App',       'Develop cross-platform Flutter application for patient vitals monitoring and consultations.',   'Mobile Development',   'FIXED_PRICE', 4800.00, 'INTERMEDIATE', 50, '2026-04-30', 'COMPLETED',   '2026-02-03 16:20:00'),
(6,  1, 'SaaS Application Design System',     'Complete design overhaul in Figma: typography, tokens, components, and responsive prototypes.', 'UI/UX Design',         'FIXED_PRICE', 2200.00, 'EXPERT',       20, '2026-03-15', 'COMPLETED',   '2026-02-05 13:45:00'),
(7,  2, 'Distributed Cache Service with Go',   'Implement low-latency distributed caching layer using Go and Redis cluster.',                   'Backend Development',  'FIXED_PRICE', 3800.00, 'EXPERT',       35, '2026-04-20', 'COMPLETED',   '2026-02-08 10:10:00'),
(8,  3, 'Security Audit & Penetration Test',   'Conduct thorough vulnerability assessment and source code audit on cloud infrastructure.',      'Security & Audit',     'FIXED_PRICE', 2500.00, 'EXPERT',       15, '2026-03-10', 'COMPLETED',   '2026-02-10 15:30:00'),
(9,  4, 'Real-Time Notification Microservice', 'Build WebSocket notification service with Redis pub/sub and Node.js.',                          'Backend Development',  'FIXED_PRICE', 1800.00, 'INTERMEDIATE', 18, '2026-05-01', 'IN_PROGRESS', '2026-02-12 11:00:00'),
(10, 5, 'Hospital Records Relational Schema',  'Design normalized MySQL schema (up to BCNF) with stored procedures and triggers for audit.',   'Database Management',  'FIXED_PRICE', 2000.00, 'EXPERT',       21, '2026-05-10', 'IN_PROGRESS', '2026-02-15 14:15:00'),
(11, 1, 'GraphQL Gateway Implementation',     'Consolidate REST endpoints into federated GraphQL gateway using Apollo and Node.js.',           'Backend Development',  'FIXED_PRICE', 2600.00, 'INTERMEDIATE', 25, '2026-05-20', 'OPEN',        '2026-02-18 09:40:00'),
(12, 2, 'Mobile Crypto Wallet Interface',     'Build clean, accessible UI screens in Flutter with biometric authentication integration.',       'Mobile Development',   'FIXED_PRICE', 3200.00, 'INTERMEDIATE', 30, '2026-05-25', 'OPEN',        '2026-02-20 16:50:00'),
(13, 3, 'Kubernetes Cost Optimization',        'Analyze cluster resource utilization and implement Karpenter autoscaling to reduce cloud bill.','DevOps & Cloud',       'FIXED_PRICE', 2400.00, 'EXPERT',       20, '2026-05-15', 'OPEN',        '2026-02-22 12:00:00'),
(14, 4, 'Python Web Scraping & Cleaning',     'Build robust web scrapers with Scrapy and store cleaned structured datasets in PostgreSQL.',     'Data Engineering',     'HOURLY',      1500.00, 'ENTRY',        14, '2026-05-18', 'OPEN',        '2026-02-24 10:20:00'),
(15, 13,'Landing Page Conversion Redesign',    'Redesign marketing landing pages with high-converting responsive layouts and micro-animations.','UI/UX Design',         'FIXED_PRICE', 1400.00, 'INTERMEDIATE', 12, '2026-05-05', 'OPEN',        '2026-02-26 15:10:00'),
(16, 13,'Full-Stack MVP for AI Assistant',    'Build MVP with Next.js frontend, Python FastAPI backend, and vector embeddings lookup.',        'Full-Stack Web Dev',   'FIXED_PRICE', 5000.00, 'EXPERT',       45, '2026-06-01', 'OPEN',        '2026-02-28 17:30:00');

-- -----------------------------------------------------------------------------
-- 8. Seed: job_skills (Junction: Job Requirements)
-- -----------------------------------------------------------------------------
INSERT INTO job_skills (job_id, skill_id, is_mandatory) VALUES
(1,  1,  TRUE),  -- Job 1: React
(1,  12, TRUE),  -- Job 1: TypeScript
(2,  2,  TRUE),  -- Job 2: Node.js
(2,  5,  TRUE),  -- Job 2: MySQL
(3,  8,  TRUE),  -- Job 3: Kubernetes
(3,  9,  TRUE),  -- Job 3: AWS Cloud
(3,  7,  FALSE), -- Job 3: Docker (Preferred)
(4,  3,  TRUE),  -- Job 4: Python
(4,  4,  TRUE),  -- Job 4: Django
(4,  6,  TRUE),  -- Job 4: PostgreSQL
(5,  11, TRUE),  -- Job 5: Flutter
(5,  1,  FALSE), -- Job 5: React (Preferred)
(6,  10, TRUE),  -- Job 6: Figma UI/UX
(7,  13, TRUE),  -- Job 7: Go
(7,  16, TRUE),  -- Job 7: Redis
(8,  17, TRUE),  -- Job 8: Cyber Security
(9,  2,  TRUE),  -- Job 9: Node.js
(9,  16, TRUE),  -- Job 9: Redis
(10, 5,  TRUE),  -- Job 10: MySQL
(11, 14, TRUE),  -- Job 11: GraphQL
(11, 2,  TRUE),  -- Job 11: Node.js
(12, 11, TRUE),  -- Job 12: Flutter
(13, 8,  TRUE),  -- Job 13: Kubernetes
(13, 9,  TRUE),  -- Job 13: AWS Cloud
(14, 3,  TRUE),  -- Job 14: Python
(15, 10, TRUE),  -- Job 15: Figma UI/UX
(16, 1,  TRUE),  -- Job 16: React
(16, 3,  TRUE);  -- Job 16: Python

-- -----------------------------------------------------------------------------
-- 9. Seed: proposals (24 realistic proposals from various freelancers)
-- -----------------------------------------------------------------------------
INSERT INTO proposals (proposal_id, job_id, freelancer_id, bid_amount, estimated_delivery_days, cover_letter, proposal_status, submitted_at) VALUES
-- Proposals for Job 1 (Awarded to Faisal Khan - Freelancer 6)
(1,  1, 6,  3400.00, 28, 'I have 8+ years building enterprise React/TypeScript dashboards with clean state management.', 'ACCEPTED', '2026-01-26 14:00:00'),
(2,  1, 7,  3600.00, 30, 'Extensive React frontend experience alongside Python backends.', 'REJECTED', '2026-01-27 10:30:00'),
-- Proposals for Job 2 (Awarded to Faisal Khan - Freelancer 6)
(3,  2, 6,  4100.00, 42, 'Specialist in high-throughput Node.js microservices and MySQL optimization.', 'ACCEPTED', '2026-01-28 11:00:00'),
(4,  2, 10, 4300.00, 40, 'Capable of delivering Node.js backend with low latency and clean modular code.', 'REJECTED', '2026-01-29 16:45:00'),
-- Proposals for Job 3 (Awarded to Harsh Patel - Freelancer 8)
(5,  3, 8,  2900.00, 22, 'AWS Certified Solutions Architect with hundreds of production EKS deployments.', 'ACCEPTED', '2026-01-30 09:20:00'),
(6,  3, 10, 3100.00, 25, 'Hands-on experience deploying Go and Docker workloads to cloud clusters.', 'REJECTED', '2026-01-31 15:10:00'),
-- Proposals for Job 4 (Awarded to Grace Hopper - Freelancer 7)
(7,  4, 7,  3900.00, 38, 'Core expertise in Django REST framework, PostgreSQL indexing, and Celery pipelines.', 'ACCEPTED', '2026-02-02 12:15:00'),
(8,  4, 11, 4100.00, 40, 'Senior Python developer with strong database engineering and data background.', 'REJECTED', '2026-02-03 14:00:00'),
-- Proposals for Job 5 (Awarded to Liam Chen - Freelancer 12)
(9,  5, 12, 4700.00, 48, 'Proven track record shipping polished healthcare and commercial apps on Flutter.', 'ACCEPTED', '2026-02-04 10:45:00'),
(10, 5, 6,  4900.00, 50, 'Can build high quality cross-platform apps with clean reactive architecture.', 'REJECTED', '2026-02-05 17:20:00'),
-- Proposals for Job 6 (Awarded to Isabella Rossi - Freelancer 9)
(11, 6, 9,  2150.00, 18, 'Award-winning UI/UX designer with complete Figma design system mastery.', 'ACCEPTED', '2026-02-06 11:30:00'),
-- Proposals for Job 7 (Awarded to Jack Ryan - Freelancer 10)
(12, 7, 10, 3750.00, 32, 'Go and Redis are my core focus. I will implement lock-free concurrency and cluster failover.', 'ACCEPTED', '2026-02-09 13:00:00'),
(13, 7, 8,  3800.00, 35, 'DevOps engineer with strong Go systems programming background.', 'REJECTED', '2026-02-10 14:10:00'),
-- Proposals for Job 8 (Awarded to Kavita Sharma - Freelancer 11)
(14, 8, 11, 2450.00, 14, 'Certified ethical hacker and security researcher ready to identify vulnerabilities.', 'ACCEPTED', '2026-02-11 16:00:00'),
-- Proposals for Job 9 (Awarded to Faisal Khan - Freelancer 6, In Progress)
(15, 9, 6,  1750.00, 16, 'Can deliver scalable WebSocket server backed by Redis in under 2 weeks.', 'ACCEPTED', '2026-02-13 10:00:00'),
(16, 9, 10, 1800.00, 18, 'Strong distributed background for pub/sub messaging.', 'SHORTLISTED', '2026-02-14 12:30:00'),
-- Proposals for Job 10 (Awarded to Grace Hopper - Freelancer 7, In Progress)
(17, 10, 7, 1950.00, 20, 'Rigorous relational database architect with BCNF normalization experience.', 'ACCEPTED', '2026-02-16 11:20:00'),
(18, 10, 11,2000.00, 21, 'Security and integrity focused database design.', 'SHORTLISTED', '2026-02-17 15:40:00'),
-- Open Job Proposals
(19, 11, 6, 2500.00, 24, 'Experienced in Apollo GraphQL server federated schemas.', 'SUBMITTED', '2026-02-19 14:10:00'),
(20, 11, 7, 2600.00, 25, 'Extensive API integration experience across REST and GraphQL.', 'SUBMITTED', '2026-02-20 09:30:00'),
(21, 12, 12,3100.00, 28, 'Built several crypto and fintech interfaces in Flutter.', 'SUBMITTED', '2026-02-21 11:45:00'),
(22, 13, 8, 2300.00, 18, 'Specialist in Karpenter and cluster autoscaling configuration.', 'SUBMITTED', '2026-02-23 16:15:00'),
(23, 15, 9, 1350.00, 10, 'High-converting landing page UI/UX design with responsive states.', 'SUBMITTED', '2026-02-27 10:00:00'),
(24, 16, 6, 4800.00, 40, 'Ready to build end-to-end full stack web application MVP.', 'SUBMITTED', '2026-03-01 13:20:00');

-- -----------------------------------------------------------------------------
-- 10. Seed: contracts (10 contracts: 8 COMPLETED, 2 ACTIVE)
-- -----------------------------------------------------------------------------
INSERT INTO contracts (contract_id, job_id, proposal_id, client_id, freelancer_id, agreed_amount, start_date, end_date, contract_status, created_at) VALUES
(1,  1,  1,  1, 6,  3400.00, '2026-01-27', '2026-02-24', 'COMPLETED', '2026-01-27 09:00:00'),
(2,  2,  3,  2, 6,  4100.00, '2026-01-29', '2026-03-10', 'COMPLETED', '2026-01-29 14:00:00'),
(3,  3,  5,  3, 8,  2900.00, '2026-02-01', '2026-02-22', 'COMPLETED', '2026-02-01 10:00:00'),
(4,  4,  7,  4, 7,  3900.00, '2026-02-03', '2026-03-12', 'COMPLETED', '2026-02-03 11:30:00'),
(5,  5,  9,  5, 12, 4700.00, '2026-02-05', '2026-03-24', 'COMPLETED', '2026-02-05 15:00:00'),
(6,  6,  11, 1, 9,  2150.00, '2026-02-07', '2026-02-25', 'COMPLETED', '2026-02-07 12:00:00'),
(7,  7,  12, 2, 10, 3750.00, '2026-02-10', '2026-03-14', 'COMPLETED', '2026-02-10 16:30:00'),
(8,  8,  14, 3, 11, 2450.00, '2026-02-12', '2026-02-26', 'COMPLETED', '2026-02-12 10:15:00'),
(9,  9,  15, 4, 6,  1750.00, '2026-02-14', NULL,         'ACTIVE',    '2026-02-14 13:45:00'),
(10, 10, 17, 5, 7,  1950.00, '2026-02-17', NULL,         'ACTIVE',    '2026-02-17 11:00:00');

-- -----------------------------------------------------------------------------
-- 11. Seed: milestones (Sequential deliverables per contract)
-- -----------------------------------------------------------------------------
INSERT INTO milestones (contract_id, milestone_seq_no, title, deliverable_description, amount, due_date, submission_notes, submission_date, milestone_status) VALUES
-- Contract 1 (React Frontend - Completed)
(1, 1, 'Architecture & Token Setup',    'Component library setup, theme tokens, routing, and mock data views.', 1400.00, '2026-02-10', 'Completed repo: github.com/client/portal/commit/a1', '2026-02-09 16:00:00', 'APPROVED'),
(1, 2, 'API Integration & Final QA',     'REST endpoints hooked to live backend with unit tests.',               2000.00, '2026-02-24', 'Live demo at portal-staging.techcorp.io',      '2026-02-23 18:30:00', 'APPROVED'),

-- Contract 2 (Trading Backend - Completed)
(2, 1, 'Schema Design & Data Access',    'MySQL tables, connection pooling, and account models.',                1800.00, '2026-02-18', 'Database scripts and migrations delivered.',    '2026-02-17 14:00:00', 'APPROVED'),
(2, 2, 'Order Matching & Testing',       'Matching engine logic, stress tests under 10k req/sec load.',          2300.00, '2026-03-10', 'Benchmarks and integration tests passed.',       '2026-03-09 19:20:00', 'APPROVED'),

-- Contract 3 (AWS EKS - Completed)
(3, 1, 'VPC & EKS Cluster Terraform',   'Terraform scripts provisioning VPC, subnets, and EKS cluster.',        1500.00, '2026-02-10', 'Infrastructure code merged and applied.',        '2026-02-09 11:30:00', 'APPROVED'),
(3, 2, 'Application Deploy & Ingress',   'Helm charts for microservices and cert-manager TLS.',                  1400.00, '2026-02-22', 'Ingress endpoints healthy and verified.',        '2026-02-21 16:45:00', 'APPROVED'),

-- Contract 4 (Data Pipeline - Completed)
(4, 1, 'PostgreSQL Schema & Ingestion',  'Partitioned tables and asynchronous Celery tasks.',                    1900.00, '2026-02-18', 'Data ingestion pipeline running on staging.',   '2026-02-17 12:00:00', 'APPROVED'),
(4, 2, 'ML Serving REST APIs',           'REST endpoints serving model inference with caching.',                 2000.00, '2026-03-12', 'Model evaluation latency under 45ms.',          '2026-03-11 17:15:00', 'APPROVED'),

-- Contract 5 (Flutter App - Completed)
(5, 1, 'App Navigation & UI Screens',    'Core UI layouts in Flutter matching Figma designs.',                   2200.00, '2026-02-25', 'TestFlight build v0.1 deployed.',               '2026-02-24 15:30:00', 'APPROVED'),
(5, 2, 'Backend Sync & Push Alerts',     'Push notification handlers and offline SQLite cache.',                 2500.00, '2026-03-24', 'Production release candidate signed.',           '2026-03-23 20:00:00', 'APPROVED'),

-- Contract 6 (Figma Design System - Completed)
(6, 1, 'Design System Tokens',           'Color palettes, typography scales, spacing units, and icons.',          1000.00, '2026-02-16', 'Figma library published.',                      '2026-02-15 14:00:00', 'APPROVED'),
(6, 2, 'Core Screen Wireframes & UI',    '24 polished screen mockups with desktop and mobile states.',           1150.00, '2026-02-25', 'Interactive Figma prototype shared.',           '2026-02-24 18:00:00', 'APPROVED'),

-- Contract 7 (Go Redis Cache - Completed)
(7, 1, 'Cache Node Driver & Hash Ring',  'Consistent hashing ring in Go with graceful node additions.',          1850.00, '2026-02-24', 'Benchmark repo and unit test suite.',           '2026-02-23 13:20:00', 'APPROVED'),
(7, 2, 'Integration with API Gateways',  'Telemetry metrics, Prometheus exporter, and cluster failover.',        1900.00, '2026-03-14', 'Cluster sustained 500k ops/sec.',               '2026-03-13 16:40:00', 'APPROVED'),

-- Contract 8 (Security Audit - Completed)
(8, 1, 'Vulnerability Assessment',       'Automated and manual penetration scan of cloud endpoints.',            1200.00, '2026-02-18', 'Preliminary vulnerability report delivered.',   '2026-02-17 11:00:00', 'APPROVED'),
(8, 2, 'Remediation Review & Signoff',   'Verification of applied patches and final certification report.',      1250.00, '2026-02-26', 'Final compliance signoff document attached.',   '2026-02-25 15:30:00', 'APPROVED'),

-- Contract 9 (Active - Node.js WebSockets)
(9, 1, 'WebSocket Connection Server',    'Socket cluster handler with Redis pub/sub adapter.',                   900.00,  '2026-02-25', 'PR opened with unit tests.',                    '2026-02-24 10:00:00', 'IN_REVIEW'),
(9, 2, 'Load Testing & Client SDK',      'Client connection SDK and reconnect backoff.',                         850.00,  '2026-03-05', NULL,                                            NULL,                  'FUNDED'),

-- Contract 10 (Active - Relational Schema)
(10, 1, 'Conceptual ERD & DDL Script',   'Normalized tables to 3NF with constraints and foreign keys.',          1000.00, '2026-02-28', 'DDL script and schema diagrams submitted.',     '2026-02-27 16:00:00', 'IN_REVIEW'),
(10, 2, 'Stored Procedures & Triggers',  'Audit logging triggers and automated balance procedures.',              950.00,  '2026-03-10', NULL,                                            NULL,                  'PENDING');

-- -----------------------------------------------------------------------------
-- 12. Seed: payments (Simulated Escrow Locks and Milestone Releases)
-- -----------------------------------------------------------------------------
INSERT INTO payments (payment_id, contract_id, milestone_seq_no, sender_id, receiver_id, amount, payment_type, payment_status, created_at) VALUES
-- Contract 1 Payments
(1,  1, 1, 1, 14, 1400.00, 'ESCROW_LOCK',       'COMPLETED', '2026-01-27 09:30:00'),
(2,  1, 1, 14, 6, 1400.00, 'MILESTONE_RELEASE', 'COMPLETED', '2026-02-10 11:00:00'),
(3,  1, 2, 1, 14, 2000.00, 'ESCROW_LOCK',       'COMPLETED', '2026-02-10 11:05:00'),
(4,  1, 2, 14, 6, 2000.00, 'MILESTONE_RELEASE', 'COMPLETED', '2026-02-24 10:15:00'),

-- Contract 2 Payments
(5,  2, 1, 2, 14, 1800.00, 'ESCROW_LOCK',       'COMPLETED', '2026-01-29 14:15:00'),
(6,  2, 1, 14, 6, 1800.00, 'MILESTONE_RELEASE', 'COMPLETED', '2026-02-18 16:00:00'),
(7,  2, 2, 2, 14, 2300.00, 'ESCROW_LOCK',       'COMPLETED', '2026-02-18 16:05:00'),
(8,  2, 2, 14, 6, 2300.00, 'MILESTONE_RELEASE', 'COMPLETED', '2026-03-10 14:30:00'),

-- Contract 3 Payments
(9,  3, 1, 3, 14, 1500.00, 'ESCROW_LOCK',       'COMPLETED', '2026-02-01 10:15:00'),
(10, 3, 1, 14, 8, 1500.00, 'MILESTONE_RELEASE', 'COMPLETED', '2026-02-10 12:00:00'),
(11, 3, 2, 3, 14, 1400.00, 'ESCROW_LOCK',       'COMPLETED', '2026-02-10 12:05:00'),
(12, 3, 2, 14, 8, 1400.00, 'MILESTONE_RELEASE', 'COMPLETED', '2026-02-22 17:00:00'),

-- Contract 4 Payments
(13, 4, 1, 4, 14, 1900.00, 'ESCROW_LOCK',       'COMPLETED', '2026-02-03 12:00:00'),
(14, 4, 1, 14, 7, 1900.00, 'MILESTONE_RELEASE', 'COMPLETED', '2026-02-18 14:00:00'),
(15, 4, 2, 4, 14, 2000.00, 'ESCROW_LOCK',       'COMPLETED', '2026-02-18 14:05:00'),
(16, 4, 2, 14, 7, 2000.00, 'MILESTONE_RELEASE', 'COMPLETED', '2026-03-12 11:30:00'),

-- Contract 5 Payments
(17, 5, 1, 5, 14, 2200.00, 'ESCROW_LOCK',       'COMPLETED', '2026-02-05 15:30:00'),
(18, 5, 1, 14, 12,2200.00, 'MILESTONE_RELEASE', 'COMPLETED', '2026-02-25 10:00:00'),
(19, 5, 2, 5, 14, 2500.00, 'ESCROW_LOCK',       'COMPLETED', '2026-02-25 10:05:00'),
(20, 5, 2, 14, 12,2500.00, 'MILESTONE_RELEASE', 'COMPLETED', '2026-03-24 16:45:00'),

-- Contract 6 Payments
(21, 6, 1, 1, 14, 1000.00, 'ESCROW_LOCK',       'COMPLETED', '2026-02-07 12:30:00'),
(22, 6, 1, 14, 9, 1000.00, 'MILESTONE_RELEASE', 'COMPLETED', '2026-02-16 11:00:00'),
(23, 6, 2, 1, 14, 1150.00, 'ESCROW_LOCK',       'COMPLETED', '2026-02-16 11:05:00'),
(24, 6, 2, 14, 9, 1150.00, 'MILESTONE_RELEASE', 'COMPLETED', '2026-02-25 19:00:00'),

-- Contract 7 Payments
(25, 7, 1, 2, 14, 1850.00, 'ESCROW_LOCK',       'COMPLETED', '2026-02-10 17:00:00'),
(26, 7, 1, 14, 10,1850.00, 'MILESTONE_RELEASE', 'COMPLETED', '2026-02-24 14:00:00'),
(27, 7, 2, 2, 14, 1900.00, 'ESCROW_LOCK',       'COMPLETED', '2026-02-24 14:05:00'),
(28, 7, 2, 14, 10,1900.00, 'MILESTONE_RELEASE', 'COMPLETED', '2026-03-14 18:00:00'),

-- Contract 8 Payments
(29, 8, 1, 3, 14, 1200.00, 'ESCROW_LOCK',       'COMPLETED', '2026-02-12 10:45:00'),
(30, 8, 1, 14, 11,1200.00, 'MILESTONE_RELEASE', 'COMPLETED', '2026-02-18 15:00:00'),
(31, 8, 2, 3, 14, 1250.00, 'ESCROW_LOCK',       'COMPLETED', '2026-02-18 15:05:00'),
(32, 8, 2, 14, 11,1250.00, 'MILESTONE_RELEASE', 'COMPLETED', '2026-02-26 12:00:00'),

-- Contract 9 Payments (Active contract escrow)
(33, 9, 1, 4, 14, 900.00,  'ESCROW_LOCK',       'COMPLETED', '2026-02-14 14:00:00'),
(34, 9, 2, 4, 14, 850.00,  'ESCROW_LOCK',       'COMPLETED', '2026-02-14 14:05:00');

-- -----------------------------------------------------------------------------
-- 13. Seed: reviews (12 verified post-contract reviews)
-- -----------------------------------------------------------------------------
INSERT INTO reviews (review_id, contract_id, reviewer_id, reviewee_id, overall_rating, communication_rating, quality_rating, adherence_rating, feedback_comment, created_at) VALUES
-- Contract 1: Alice (1) <-> Faisal (6)
(1,  1, 1,  6,  5, 5, 5, 5, 'Faisal delivered exceptional React code. Architecture was modular and documentation was top notch.', '2026-02-24 14:00:00'),
(2,  1, 6,  1,  5, 5, 5, 5, 'Alice was an outstanding client with crystal clear specifications and swift milestone sign-offs.',   '2026-02-24 16:30:00'),

-- Contract 2: Bob (2) <-> Faisal (6)
(3,  2, 2,  6,  5, 4, 5, 5, 'Robust Node.js trading backend. Handled peak load tests effortlessly. Highly recommended!',             '2026-03-10 16:00:00'),
(4,  2, 6,  2,  5, 5, 5, 5, 'Great technical client. Provided direct access to infrastructure requirements promptly.',             '2026-03-10 18:20:00'),

-- Contract 3: Carol (3) <-> Harsh (8)
(5,  3, 3,  8,  5, 5, 5, 5, 'Harsh is a true AWS DevOps ninja. Our EKS cluster setup is rock solid and zero downtime migration.',  '2026-02-22 18:30:00'),
(6,  3, 8,  3,  4, 5, 4, 5, 'Carol and the CloudScale team were very supportive and quick with security approvals.',                '2026-02-22 20:10:00'),

-- Contract 4: David (4) <-> Grace (7)
(7,  4, 4,  7,  5, 5, 5, 5, 'Grace structured our Django pipelines with immaculate precision. Deep PostgreSQL query mastery.',        '2026-03-12 14:00:00'),
(8,  4, 7,  4,  5, 5, 5, 5, 'David provided rich data requirements and clear acceptance criteria throughout the project.',            '2026-03-12 16:45:00'),

-- Contract 5: Emily (5) <-> Liam (12)
(9,  5, 5,  12, 5, 5, 5, 5, 'Liam built a flawless Flutter medical app. Beautiful animations and reliable offline sync.',           '2026-03-24 18:00:00'),

-- Contract 6: Alice (1) <-> Isabella (9)
(10, 6, 1,  9,  5, 5, 5, 4, 'Isabella crafted a world-class Figma design system. Our developers are in love with the components.',  '2026-02-25 20:30:00'),

-- Contract 7: Bob (2) <-> Jack (10)
(11, 7, 2,  10, 5, 4, 5, 5, 'Superb Go concurrency architecture. Redis caching throughput exceeded our expectations.',               '2026-03-14 19:40:00'),

-- Contract 8: Carol (3) <-> Kavita (11)
(12, 8, 3,  11, 5, 5, 5, 5, 'Kavita identified critical security vulnerabilities that saved us from major launch risks.',          '2026-02-26 15:00:00');

-- -----------------------------------------------------------------------------
-- 14. Seed: messages (Sample communication audit trail)
-- -----------------------------------------------------------------------------
INSERT INTO messages (message_id, contract_id, proposal_id, sender_id, receiver_id, message_body, sent_at, is_read) VALUES
(1, NULL, 1,  1, 6, 'Hi Faisal, loved your proposal for the B2B portal. Can you start early next week?', '2026-01-26 16:00:00', TRUE),
(2, NULL, 1,  6, 1, 'Hi Alice, absolutely! I have reviewed the design tokens and am ready to kick off Monday.', '2026-01-26 16:30:00', TRUE),
(3, 1,    1,  1, 6, 'Milestone 1 has been approved and funded. Looking forward to the token implementation.', '2026-01-27 10:00:00', TRUE),
(4, 1,    1,  6, 1, 'Thank you Alice! Milestone 1 deliverables have been committed to the repository.', '2026-02-09 16:15:00', TRUE),
(5, NULL, 5,  3, 8, 'Harsh, what version of Kubernetes do you recommend for our EKS cluster?', '2026-01-30 11:00:00', TRUE),
(6, NULL, 5,  8, 3, 'I recommend v1.29 with Karpenter for automated node scaling. I have outlined it in my bid.', '2026-01-30 11:20:00', TRUE),
(7, 3,    5,  3, 8, 'Sounds great! Awarding the contract now.', '2026-02-01 09:45:00', TRUE),
(8, 9,    15, 4, 6, 'Faisal, we are testing the WebSocket server locally and the latency looks fantastic.', '2026-02-24 14:30:00', FALSE);

-- -----------------------------------------------------------------------------
-- 15. Seed: disputes (Sample arbitration record)
-- -----------------------------------------------------------------------------
INSERT INTO disputes (dispute_id, contract_id, milestone_seq_no, raised_by_user_id, reason, dispute_status, resolution_type, resolved_by_admin_id, resolved_at) VALUES
(1, 8, 1, 3, 'Initial dispute logged regarding timeline adherence during preliminary vulnerability scan; amicably resolved after vendor delivered extra verification scans.', 'RESOLVED', 'PAYOUT_FREELANCER', 14, '2026-02-18 14:00:00');

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
