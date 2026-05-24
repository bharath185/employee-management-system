export interface DocumentTemplate {
  id?: number;
  templateName: string;
  templateType: string;
  description?: string;
  content: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DownloadLog {
  id: number;
  employeeId: number;
  employeeName?: string;
  employeeCode?: string;
  templateId: number;
  templateName?: string;
  templateType?: string;
  format: string;
  downloadedAt: string;
  financialYear: string;
  downloadCount?: number;
}

export interface DownloadStats {
  totalDownloadsThisFY: number;
  mostDownloadedTemplate: string;
  mostDownloadedEmployee: string;
  monthlyDownloads: { month: string; count: number }[];
}

export const TEMPLATE_PLACEHOLDERS = {
  employee: [
    { key: '{{employee_name}}', desc: 'Employee Full Name' },
    { key: '{{employee_code}}', desc: 'Employee Code' },
    { key: '{{first_name}}', desc: 'First Name' },
    { key: '{{surname}}', desc: 'Surname' },
    { key: '{{prefix}}', desc: 'Prefix (Mr/Ms/Mrs)' },
    { key: '{{designation}}', desc: 'Designation' },
    { key: '{{department}}', desc: 'Department / Process' },
    { key: '{{doj}}', desc: 'Date of Joining' },
    { key: '{{doe}}', desc: 'Date of Exit' },
    { key: '{{dob}}', desc: 'Date of Birth' },
    { key: '{{gender}}', desc: 'Gender' },
    { key: '{{marital_status}}', desc: 'Marital Status' },
    { key: '{{address}}', desc: 'Present Address' },
    { key: '{{permanent_address}}', desc: 'Permanent Address' },
    { key: '{{mobile}}', desc: 'Mobile Number' },
    { key: '{{email}}', desc: 'Email Address' },
    { key: '{{blood_group}}', desc: 'Blood Group' },
    { key: '{{religion}}', desc: 'Religion' },
    { key: '{{social_category}}', desc: 'Social Category' },
    { key: '{{social_subcategory}}', desc: 'Social Subcategory' },
    { key: '{{father_name}}', desc: 'Father Name' },
    { key: '{{father_phone}}', desc: 'Father Phone' },
    { key: '{{mother_name}}', desc: 'Mother Name' },
    { key: '{{mother_phone}}', desc: 'Mother Phone' },
    { key: '{{spouse_name}}', desc: 'Spouse Name' },
    { key: '{{spouse_phone}}', desc: 'Spouse Phone' },
    { key: '{{father_husband_name}}', desc: 'Father/Husband Name' },
    { key: '{{f_m_h}}', desc: 'F/M/H Relation' },
    { key: '{{close_relative_name}}', desc: 'Close Relative Name' },
    { key: '{{close_relative_mobile}}', desc: 'Close Relative Mobile' },
    { key: '{{occupation_kin}}', desc: 'Occupation of Kin' },
    { key: '{{occupation_kin_sub}}', desc: 'Occupation of Kin (Sub)' },
    { key: '{{languages_can_speak}}', desc: 'Languages Known' },
    { key: '{{highest_qualification}}', desc: 'Highest Qualification' },
    { key: '{{level_of_education}}', desc: 'Level of Education' },
    { key: '{{year_of_passing}}', desc: 'Year of Passing' },
    { key: '{{percentage_marks}}', desc: 'Percentage Marks' },
    { key: '{{ssc_status}}', desc: 'SSC Status' },
    { key: '{{intermediate_status}}', desc: 'Intermediate Status' },
    { key: '{{bachelors_degree}}', desc: 'Bachelor\'s Degree' },
    { key: '{{masters_degree}}', desc: 'Master\'s Degree' },
    { key: '{{bank_name}}', desc: 'Bank Name' },
    { key: '{{account_number}}', desc: 'Account Number' },
    { key: '{{ifsc_code}}', desc: 'IFSC Code' },
    { key: '{{branch}}', desc: 'Branch' },
    { key: '{{pan_number_employee}}', desc: 'PAN Number' },
    { key: '{{aadhar_number}}', desc: 'Aadhaar Number' },
    { key: '{{uan_no}}', desc: 'UAN Number' },
    { key: '{{pf_no}}', desc: 'PF Number' },
    { key: '{{esic_no}}', desc: 'ESIC Number' },
    { key: '{{aadhar_seeding}}', desc: 'Aadhaar Seeding Status' },
    { key: '{{uan_activation}}', desc: 'UAN Activation Status' },
    { key: '{{aadhaar_verification}}', desc: 'Aadhaar Verification' },
    { key: '{{pan_verification}}', desc: 'PAN Verification' },
    { key: '{{osv}}', desc: 'OSV Status' },
    { key: '{{remarks}}', desc: 'Remarks' },
    { key: '{{past_experience}}', desc: 'Past Experience (years)' },
    { key: '{{organization_name}}', desc: 'Previous Organization' },
    { key: '{{period_of_employment}}', desc: 'Period of Employment' },
    { key: '{{ref1_name}}', desc: 'Reference 1 Name' },
    { key: '{{ref1_relationship}}', desc: 'Reference 1 Relationship' },
    { key: '{{ref1_address}}', desc: 'Reference 1 Address' },
    { key: '{{ref1_mobile}}', desc: 'Reference 1 Mobile' },
    { key: '{{ref2_name}}', desc: 'Reference 2 Name' },
    { key: '{{ref2_relationship}}', desc: 'Reference 2 Relationship' },
    { key: '{{ref2_address}}', desc: 'Reference 2 Address' },
    { key: '{{ref2_mobile}}', desc: 'Reference 2 Mobile' },
    { key: '{{ration_card}}', desc: 'Ration Card' },
    { key: '{{has_tv}}', desc: 'Has TV' },
    { key: '{{has_fridge}}', desc: 'Has Fridge' },
    { key: '{{has_laptop}}', desc: 'Has Laptop' },
    { key: '{{has_wifi}}', desc: 'Has WiFi' },
    { key: '{{has_2wheeler}}', desc: 'Has 2-Wheeler' },
    { key: '{{has_4wheeler}}', desc: 'Has 4-Wheeler' },
    { key: '{{employee_status}}', desc: 'Employee Status' },
    { key: '{{deletion_month}}', desc: 'Deletion Month' },
    { key: '{{exit_type}}', desc: 'Exit Type' },
    { key: '{{exit_reason}}', desc: 'Exit Reason' }
  ],
  company: [
    { key: '{{company_name}}', desc: 'Company Name' },
    { key: '{{company_address}}', desc: 'Company Address' },
    { key: '{{company_phone}}', desc: 'Company Phone' },
    { key: '{{company_email}}', desc: 'Company Email' },
    { key: '{{company_website}}', desc: 'Company Website' },
    { key: '{{company_gst}}', desc: 'GST Number' },
    { key: '{{company_pan}}', desc: 'PAN Number' },
    { key: '{{company_tan}}', desc: 'TAN Number' },
    { key: '{{company_cin}}', desc: 'CIN Number' },
    { key: '{{company_registration}}', desc: 'Registration Number' },
    { key: '{{incorporated_date}}', desc: 'Incorporated Date' },
    { key: '{{company_logo}}', desc: 'Company Logo URL' },
    { key: '{{authorized_signatory}}', desc: 'Authorized Signatory Name' }
  ],
  system: [
    { key: '{{current_date}}', desc: 'Current Date' },
    { key: '{{current_year}}', desc: 'Current Year' }
  ]
};
