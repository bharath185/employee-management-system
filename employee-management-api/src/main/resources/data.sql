-- ============================================================
-- Employee Management System - Seed Data for Master Data Tables
-- ============================================================

-- This script runs on startup when spring.jpa.hibernate.ddl-auto=update
-- and app.data.seed-on-startup=true

-- GENDER
INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES
('GENDER', 'MALE', 'Male', 1, true),
('GENDER', 'FEMALE', 'Female', 2, true),
('GENDER', 'OTHER', 'Other', 3, true);

-- PREFIX
INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES
('PREFIX', 'MR', 'Mr.', 1, true),
('PREFIX', 'MS', 'Ms.', 2, true),
('PREFIX', 'MRS', 'Mrs.', 3, true);

-- MARITAL_STATUS
INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES
('MARITAL_STATUS', 'SINGLE', 'Single', 1, true),
('MARITAL_STATUS', 'MARRIED', 'Married', 2, true),
('MARITAL_STATUS', 'DIVORCED', 'Divorced', 3, true),
('MARITAL_STATUS', 'WIDOWED', 'Widowed', 4, true);

-- F_M_H
INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES
('F_M_H', 'FATHER', 'Father', 1, true),
('F_M_H', 'MOTHER', 'Mother', 2, true),
('F_M_H', 'HUSBAND', 'Husband', 3, true);

-- OCCUPATION_KIN
INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES
('OCCUPATION_KIN', 'SALARIED', 'Salaried', 1, true),
('OCCUPATION_KIN', 'SELF_EMPLOYED', 'Self Employed', 2, true),
('OCCUPATION_KIN', 'HOUSE_WIFE', 'House Wife', 3, true),
('OCCUPATION_KIN', 'STUDENT', 'Student', 4, true),
('OCCUPATION_KIN', 'BUSINESS', 'Business', 5, true),
('OCCUPATION_KIN', 'FARMER', 'Farmer', 6, true),
('OCCUPATION_KIN', 'TEACHER', 'Teacher', 7, true),
('OCCUPATION_KIN', 'OTHER', 'Other', 8, true);

-- OCCUPATION_SUB
INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES
('OCCUPATION_SUB', 'AC_TECHNICIAN', 'AC Technician', 1, true),
('OCCUPATION_SUB', 'ACCOUNTANT', 'Accountant', 2, true),
('OCCUPATION_SUB', 'ADMIN', 'Admin', 3, true),
('OCCUPATION_SUB', 'AUDITOR', 'Auditor', 4, true),
('OCCUPATION_SUB', 'BANKER', 'Banker', 5, true),
('OCCUPATION_SUB', 'BUSINESS_OWNER', 'Business Owner', 6, true),
('OCCUPATION_SUB', 'CASHIER', 'Cashier', 7, true),
('OCCUPATION_SUB', 'CHEF', 'Chef', 8, true),
('OCCUPATION_SUB', 'CLERK', 'Clerk', 9, true),
('OCCUPATION_SUB', 'COOK', 'Cook', 10, true),
('OCCUPATION_SUB', 'COOLIE', 'Coolie', 11, true),
('OCCUPATION_SUB', 'DAILY_WAGES', 'Daily Wages', 12, true),
('OCCUPATION_SUB', 'DATA_ENTRY', 'Data Entry', 13, true),
('OCCUPATION_SUB', 'DELIVERY_BOY', 'Delivery Boy', 14, true),
('OCCUPATION_SUB', 'DOCTOR', 'Doctor', 15, true),
('OCCUPATION_SUB', 'DRIVER', 'Driver', 16, true),
('OCCUPATION_SUB', 'ELECTRICIAN', 'Electrician', 17, true),
('OCCUPATION_SUB', 'ENGINEER', 'Engineer', 18, true),
('OCCUPATION_SUB', 'FARMER', 'Farmer', 19, true),
('OCCUPATION_SUB', 'GOVT_EMPLOYEE', 'Govt Employee', 20, true),
('OCCUPATION_SUB', 'HOUSE_WIFE', 'House Wife', 21, true),
('OCCUPATION_SUB', 'HR', 'HR', 22, true),
('OCCUPATION_SUB', 'IT_PROFESSIONAL', 'IT Professional', 23, true),
('OCCUPATION_SUB', 'LABOR', 'Labor', 24, true),
('OCCUPATION_SUB', 'LAWYER', 'Lawyer', 25, true),
('OCCUPATION_SUB', 'MANAGER', 'Manager', 26, true),
('OCCUPATION_SUB', 'MASON', 'Mason', 27, true),
('OCCUPATION_SUB', 'MECHANIC', 'Mechanic', 28, true),
('OCCUPATION_SUB', 'NURSE', 'Nurse', 29, true),
('OCCUPATION_SUB', 'OPERATOR', 'Operator', 30, true),
('OCCUPATION_SUB', 'PAINTER', 'Painter', 31, true),
('OCCUPATION_SUB', 'PEON', 'Peon', 32, true),
('OCCUPATION_SUB', 'PLUMBER', 'Plumber', 33, true),
('OCCUPATION_SUB', 'POLICE', 'Police', 34, true),
('OCCUPATION_SUB', 'PROFESSOR', 'Professor', 35, true),
('OCCUPATION_SUB', 'SECURITY', 'Security', 36, true),
('OCCUPATION_SUB', 'STORE_KEEPER', 'Store Keeper', 37, true),
('OCCUPATION_SUB', 'SUPERVISOR', 'Supervisor', 38, true),
('OCCUPATION_SUB', 'SWEEPER', 'Sweeper', 39, true),
('OCCUPATION_SUB', 'TAILOR', 'Tailor', 40, true),
('OCCUPATION_SUB', 'TEACHER', 'Teacher', 41, true),
('OCCUPATION_SUB', 'TECHNICIAN', 'Technician', 42, true),
('OCCUPATION_SUB', 'TELE_CALLER', 'Tele Caller', 43, true),
('OCCUPATION_SUB', 'WATCHMAN', 'Watchman', 44, true),
('OCCUPATION_SUB', 'WELDER', 'Welder', 45, true),
('OCCUPATION_SUB', 'OTHERS', 'Others', 46, true);

-- YES_NO
INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES
('YES_NO', 'YES', 'Yes', 1, true),
('YES_NO', 'NO', 'No', 2, true);

-- RELIGION
INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES
('RELIGION', 'HINDU', 'Hindu', 1, true),
('RELIGION', 'MUSLIM', 'Muslim', 2, true),
('RELIGION', 'CHRISTIAN', 'Christian', 3, true),
('RELIGION', 'SIKH', 'Sikh', 4, true),
('RELIGION', 'BUDDHIST', 'Buddhist', 5, true),
('RELIGION', 'JAIN', 'Jain', 6, true),
('RELIGION', 'OTHER', 'Other', 7, true);

-- SOCIAL_CATEGORY
INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES
('SOCIAL_CATEGORY', 'BC', 'BC', 1, true),
('SOCIAL_CATEGORY', 'OBC', 'OBC', 2, true),
('SOCIAL_CATEGORY', 'SC', 'SC', 3, true),
('SOCIAL_CATEGORY', 'ST', 'ST', 4, true),
('SOCIAL_CATEGORY', 'OC', 'OC', 5, true);

-- SOCIAL_SUBCATEGORY
INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES
('SOCIAL_SUBCATEGORY', 'BC-A', 'BC-A', 1, true),
('SOCIAL_SUBCATEGORY', 'BC-B', 'BC-B', 2, true),
('SOCIAL_SUBCATEGORY', 'BC-C', 'BC-C', 3, true),
('SOCIAL_SUBCATEGORY', 'BC-D', 'BC-D', 4, true),
('SOCIAL_SUBCATEGORY', 'OBC-A', 'OBC-A', 5, true),
('SOCIAL_SUBCATEGORY', 'OBC-B', 'OBC-B', 6, true),
('SOCIAL_SUBCATEGORY', 'OC-A', 'OC-A', 7, true);

-- BLOOD_GROUP
INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES
('BLOOD_GROUP', 'A+', 'A+', 1, true),
('BLOOD_GROUP', 'A-', 'A-', 2, true),
('BLOOD_GROUP', 'B+', 'B+', 3, true),
('BLOOD_GROUP', 'B-', 'B-', 4, true),
('BLOOD_GROUP', 'AB+', 'AB+', 5, true),
('BLOOD_GROUP', 'AB-', 'AB-', 6, true),
('BLOOD_GROUP', 'O+', 'O+', 7, true),
('BLOOD_GROUP', 'O-', 'O-', 8, true);

-- EMPLOYEE_STATUS
INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES
('EMPLOYEE_STATUS', 'LIVE', 'Live', 1, true),
('EMPLOYEE_STATUS', 'QUIT', 'Quit', 2, true),
('EMPLOYEE_STATUS', 'SUSPENDED', 'Suspended', 3, true),
('EMPLOYEE_STATUS', 'MATERNITY_LEAVE', 'Maternity Leave', 4, true);

-- EXIT_TYPE
INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES
('EXIT_TYPE', 'RESIGNED', 'Resigned', 1, true),
('EXIT_TYPE', 'RETIRED', 'Retired', 2, true),
('EXIT_TYPE', 'TERMINATED', 'Terminated', 3, true),
('EXIT_TYPE', 'ABSCONDING', 'Absconding', 4, true),
('EXIT_TYPE', 'DECEASED', 'Deceased', 5, true),
('EXIT_TYPE', 'STOPPED_COMING', 'Stopped Coming', 6, true);

-- AGE_BRACKET
INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES
('AGE_BRACKET', '25_BELOW', '25 & Below', 1, true),
('AGE_BRACKET', '26_30', '26 to 30', 2, true),
('AGE_BRACKET', '31_35', '31 to 35', 3, true),
('AGE_BRACKET', '36_40', '36 to 40', 4, true),
('AGE_BRACKET', '41_50', '41 to 50', 5, true),
('AGE_BRACKET', '51_ABOVE', '51 & Above', 6, true);

-- DESIGNATION
INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES
('DESIGNATION', 'MANAGER', 'Manager', 1, true),
('DESIGNATION', 'ASST_MANAGER', 'Assistant Manager', 2, true),
('DESIGNATION', 'SR_ENGINEER', 'Senior Engineer', 3, true),
('DESIGNATION', 'ENGINEER', 'Engineer', 4, true),
('DESIGNATION', 'TRAINEE', 'Trainee', 5, true),
('DESIGNATION', 'CHIEF_MANAGER', 'Chief Manager', 6, true),
('DESIGNATION', 'TEAM_LEAD', 'Team Lead', 7, true),
('DESIGNATION', 'ACCOUNTANT', 'Accountant', 8, true),
('DESIGNATION', 'HR_EXECUTIVE', 'HR Executive', 9, true),
('DESIGNATION', 'ADMIN', 'Administrator', 10, true);

-- RELATIONSHIP (for references)
INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES
('RELATIONSHIP', 'FRIEND', 'Friend', 1, true),
('RELATIONSHIP', 'COLLEAGUE', 'Colleague', 2, true),
('RELATIONSHIP', 'FAMILY_FRIEND', 'Family Friend', 3, true),
('RELATIONSHIP', 'NEIGHBOUR', 'Neighbour', 4, true),
('RELATIONSHIP', 'RELATIVE', 'Relative', 5, true),
('RELATIONSHIP', 'FORMER_EMPLOYER', 'Former Employer', 6, true);

-- EDUCATION_LEVEL
INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES
('EDUCATION_LEVEL', 'SSC', 'SSC / Std X', 1, true),
('EDUCATION_LEVEL', 'INTERMEDIATE', 'Intermediate / Std XII', 2, true),
('EDUCATION_LEVEL', 'BACHELORS', 'Bachelors', 3, true),
('EDUCATION_LEVEL', 'MASTERS', 'Masters', 4, true),
('EDUCATION_LEVEL', 'PHD', 'PhD', 5, true),
('EDUCATION_LEVEL', 'DIPLOMA', 'Diploma', 6, true),
('EDUCATION_LEVEL', 'OTHER', 'Other', 7, true);

-- QUALIFICATION
INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES
('QUALIFICATION', 'B_COM', 'B.Com', 1, true),
('QUALIFICATION', 'B_SC', 'B.Sc', 2, true),
('QUALIFICATION', 'B_TECH', 'B.Tech', 3, true),
('QUALIFICATION', 'B_A', 'B.A', 4, true),
('QUALIFICATION', 'BBA', 'BBA', 5, true),
('QUALIFICATION', 'BCA', 'BCA', 6, true),
('QUALIFICATION', 'M_COM', 'M.Com', 7, true),
('QUALIFICATION', 'M_SC', 'M.Sc', 8, true),
('QUALIFICATION', 'M_TECH', 'M.Tech', 9, true),
('QUALIFICATION', 'MBA', 'MBA', 10, true),
('QUALIFICATION', 'MCA', 'MCA', 11, true),
('QUALIFICATION', 'PHD', 'PhD', 12, true),
('QUALIFICATION', 'ITI', 'ITI', 13, true),
('QUALIFICATION', 'DIPLOMA', 'Diploma', 14, true),
('QUALIFICATION', 'OTHER', 'Other', 15, true);

-- LANGUAGE
INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES
('LANGUAGE', 'ENGLISH', 'English', 1, true),
('LANGUAGE', 'HINDI', 'Hindi', 2, true),
('LANGUAGE', 'TAMIL', 'Tamil', 3, true),
('LANGUAGE', 'TELUGU', 'Telugu', 4, true),
('LANGUAGE', 'KANNADA', 'Kannada', 5, true),
('LANGUAGE', 'MALAYALAM', 'Malayalam', 6, true),
('LANGUAGE', 'MARATHI', 'Marathi', 7, true),
('LANGUAGE', 'GUJARATI', 'Gujarati', 8, true),
('LANGUAGE', 'BENGALI', 'Bengali', 9, true),
('LANGUAGE', 'PUNJABI', 'Punjabi', 10, true),
('LANGUAGE', 'URDU', 'Urdu', 11, true),
('LANGUAGE', 'ODIA', 'Odia', 12, true);

-- RELATIONSHIP - Add Others
INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES
('RELATIONSHIP', 'OTHERS', 'Others', 7, true);

-- PROCESS (empty by default - users can add their own)
-- INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES ('PROCESS', 'DEFAULT', 'Default Process', 1, true);

-- BANK_NAME (empty by default - users can add their own)
-- INSERT IGNORE INTO master_data (category, code, value, sort_order, active) VALUES ('BANK_NAME', 'DEFAULT', 'Default Bank', 1, true);

-- Roles
INSERT IGNORE INTO roles (id, name, description) VALUES
(1, 'ROLE_ADMIN', 'Administrator with full access to all modules'),
(2, 'ROLE_EMPLOYEE', 'Employee with limited self-service access');
