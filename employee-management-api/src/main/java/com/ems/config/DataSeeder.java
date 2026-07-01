package com.ems.config;

import com.ems.model.*;
import com.ems.repository.*;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MasterDataRepository masterDataRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final CompanyRepository companyRepository;
    private final EmployeeRepository employeeRepository;
    private final SalaryRepository salaryRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final DocumentTemplateRepository documentTemplateRepository;
    private final RolePermissionRepository rolePermissionRepository;

    @Override
    public void run(String... args) {
        seedAdminUser();
        seedMasterData();
        seedLeaveTypes();
        seedCompany();
        seedEmployees();
        seedEmployeeUsers();
        seedSalaries();
        seedLeaveBalances();
        seedDocumentTemplates();
        seedPermissions();
    }

    private void seedAdminUser() {
        if (!userRepository.existsByUsername("ADMIN")) {
            User admin = User.builder()
                .username("ADMIN")
                .password(passwordEncoder.encode("Admin@123"))
                .role("ADMIN")
                .enabled(true)
                .accountNonLocked(true)
                .build();
            userRepository.save(admin);
            log.info("Default ADMIN user created with username: ADMIN");
        } else {
            log.debug("ADMIN user already exists, skipping seed");
        }
    }

    private void seedMasterData() {
        if (masterDataRepository.findByCategoryIgnoreCaseOrderBySortOrderAsc("GENDER").isEmpty()) {
            seedCategory("GENDER", new String[][]{
                {"MALE", "Male"}, {"FEMALE", "Female"}, {"OTHER", "Other"}
            });
            seedCategory("PREFIX", new String[][]{
                {"MR", "Mr."}, {"MS", "Ms."}
            });
            seedCategory("MARITAL_STATUS", new String[][]{
                {"SINGLE", "Single"}, {"MARRIED", "Married"}
            });
            seedCategory("RELIGION", new String[][]{
                {"HINDU", "Hindu"}, {"MUSLIM", "Muslim"}, {"CHRISTIAN", "Christian"},
                {"BUDDHISM", "Buddhism"}, {"JAINISM", "Jainism"}, {"SIKHISM", "Sikhism"}
            });
            seedCategory("SOCIAL_CATEGORY", new String[][]{
                {"BC", "BC"}, {"OBC", "OBC"}, {"OC", "OC"}, {"SC", "SC"}, {"ST", "ST"}
            });
            seedCategory("SOCIAL_SUBCATEGORY", new String[][]{
                {"BC-A", "BC-A"}, {"BC-B", "BC-B"}, {"BC-C", "BC-C"}, {"BC-D", "BC-D"},
                {"BC-E", "BC-E"}, {"OBC", "OBC"}, {"OC", "OC"}
            });
            seedCategory("BLOOD_GROUP", new String[][]{
                {"A+", "A+"}, {"A-", "A-"}, {"B+", "B+"}, {"B-", "B-"},
                {"O+", "O+"}, {"O-", "O-"}, {"AB+", "AB+"}, {"AB-", "AB-"}
            });
            seedCategory("QUALIFICATION", new String[][]{
                {"BCOM", "B Com"}, {"BSC", "BSc"}, {"BA", "BA"}, {"MCOM", "M Com"},
                {"MSC", "MSc"}, {"MA", "MA"}, {"BBA", "BBA"}, {"BCA", "BCA"},
                {"MCA", "MCA"}, {"MBA", "MBA"}, {"BED", "B Ed"}, {"MED", "M Ed"},
                {"BTECH", "B Tech"}, {"MTECH", "M Tech"}, {"BALLB", "BA LLB"},
                {"BPHARM", "B Pharm"}
            });
            seedCategory("EDUCATION_LEVEL", new String[][]{
                {"BACHELORS", "Bachelors"}, {"MASTERS", "Masters"}
            });
            seedCategory("OCCUPATION_KIN", new String[][]{
                {"SALARIED", "Salaried"}, {"SELF_EMPLOYED", "Self Employed"},
                {"BUSINESS", "Business"}, {"HOUSE_WIFE", "House Wife"},
                {"FARMER", "Farmer"}, {"TEACHER", "Teacher"}
            });
            seedCategory("EMPLOYEE_STATUS", new String[][]{
                {"LIVE", "Live"}, {"QUIT", "Quit"},
                {"ASKED_TO_GO", "Asked to Go"}, {"TERMINATED", "Terminated"}
            });
            seedCategory("DESIGNATION", new String[][]{
                {"MANAGER", "Manager"}, {"CHIEF_MANAGER", "Chief Manager"},
                {"ASST_MANAGER", "Assistant Manager"}, {"TEAM_LEADER", "Team Leader"},
                {"SP_ASSOCIATE", "S.P.Associate"}, {"JP_ASSOCIATE", "J.P.Associate"},
                {"WORK_LEADER", "Work Leader"}
            });
            seedCategory("RELATIONSHIP", new String[][]{
                {"FRIEND", "Friend"}, {"NEIGHBOUR", "Neighbour"},
                {"FAMILY_FRIEND", "Family Friend"}, {"OTHERS", "Others"}
            });
            seedCategory("EXIT_TYPE", new String[][]{
                {"RESIGNED", "Resigned"}, {"STOPPED_COMING", "Stopped Coming"},
                {"TERMINATED", "Terminated"}, {"ASKED_TO_GO", "Asked to Go"}
            });
            seedCategory("AGE_BRACKET", new String[][]{
                {"25_BELOW", "25 & Below"}, {"26_30", "26 to 30"},
                {"30_35", "30 to 35"}, {"36_ABOVE", "36 & Above"}
            });
            seedCategory("F_M_H", new String[][]{
                {"FATHER", "Father"}, {"MOTHER", "Mother"}, {"HUSBAND", "Husband"}
            });
            seedCategory("YES_NO", new String[][]{
                {"YES", "Yes"}, {"NO", "No"}
            });
            seedCategory("BANK_NAME", new String[][]{
                {"SBI", "State Bank of India"}, {"HDFC", "HDFC Bank"},
                {"ICICI", "ICICI Bank"}, {"AXIS", "Axis Bank"},
                {"KOTAK", "Kotak Mahindra"}, {"PNB", "Punjab National Bank"},
                {"BOB", "Bank of Baroda"}, {"CANARA", "Canara Bank"},
                {"UNION", "Union Bank of India"}, {"IOB", "Indian Overseas Bank"}
            });
            seedCategory("OCCUPATION_SUB", new String[][]{
                {"ACCOUNTANT", "Accountant"}, {"ADMIN", "Admin"},
                {"ASST_MANAGER", "Asst Manager"}, {"AUTO_DRIVER", "Auto Driver"},
                {"BABY_CARE", "Baby Care"}, {"BARBER", "Barber"},
                {"BOOKING_AGENT", "Booking Agent"}, {"BUILDER", "Building Contractor"},
                {"BUSINESS", "Business"}, {"CABLE_OP", "Cable Operator"},
                {"CAR_DRIVER", "Car Driver"}, {"CARPENTER", "Carpenter"},
                {"CASHIER", "Cashier"}, {"COLLECTION_AGENT", "Collection Agent"},
                {"COMPOUNDER", "Compounder"}, {"CONSTRUCTION", "Construction"},
                {"CONTRACTOR", "Contractor"}, {"COOK", "Cook"},
                {"COOLIE", "Coolie"}, {"DAILY_WAGE", "Daily Wage Earner"},
                {"DELIVERY", "Delivery Man"}, {"DENTAL_TECH", "Dental Technician"},
                {"DESK_OP", "Desk Operator"}, {"DIGITAL_MKT", "Digital Marketing"},
                {"DOCTOR", "Doctor"}, {"DRIVER", "Driver"},
                {"ELECTRICIAN", "Electrician"}, {"FARMER", "Farmer"},
                {"FINANCIER", "Financier"}, {"GARDENER", "Gardener"},
                {"HELPER_HOTEL", "Helper in Hotel"}, {"HOUSEKEEPER", "Housekeeper"},
                {"HOUSE_WIFE", "House Wife"}, {"LABOURER", "Labourer"},
                {"MANAGER", "Manager"}, {"MECHANIC", "Mechanic"},
                {"OPERATOR", "Operator"}, {"PAINTER", "Painter"},
                {"PHARMACIST", "Pharmacist"}, {"PHOTOGRAPHER", "Photographer"},
                {"PRIEST", "Priest"}, {"SALARIED", "Salaried"},
                {"SALES_EXEC", "Sales Executive"}, {"SECURITY", "Security Guard"},
                {"SELF_EMPLOYED", "Self Employed"}, {"SHOP_KEEPER", "Shop Keeper"},
                {"TAILOR", "Tailor"}, {"TEACHER", "Teacher"},
                {"TECHNICIAN", "Technician"}, {"WORKER", "Worker"}
            });
            seedCategory("PROCESS", new String[][]{
                {"PROCESS_A", "Process A"}, {"PROCESS_B", "Process B"},
                {"PROCESS_C", "Process C"}, {"PROCESS_D", "Process D"}
            });
            seedCategory("DOCUMENT_TYPE", new String[][]{
                {"AADHAR", "Aadhar Card"}, {"PAN", "PAN Card"},
                {"VOTER_ID", "Voter ID"}, {"DRIVING_LICENSE", "Driving License"},
                {"PASSPORT", "Passport"}, {"SSLC", "SSLC Certificate"},
                {"12TH", "12th Mark Sheet"}, {"DEGREE", "Degree Certificate"},
                {"PG", "PG Certificate"}, {"PHOTO", "Photo"},
                {"RESUME", "Resume/CV"}, {"OFFER_LETTER", "Offer Letter"},
                {"EXPERIENCE", "Experience Letter"}, {"SALARY_SLIP", "Salary Slip"},
                {"BANK_STMT", "Bank Statement"}, {"KYC", "KYC Document"},
                {"OTHER", "Other"}
            });
            log.info("Master data seeded successfully");
        } else {
            log.debug("Master data already exists, skipping seed");
        }
    }

    private void seedLeaveTypes() {
        if (leaveTypeRepository.count() == 0) {
            leaveTypeRepository.save(LeaveType.builder()
                .name("CL")
                .description("Casual Leave")
                .annualEntitlement(12)
                .isCarryForward(false)
                .isActive(true)
                .build());
            leaveTypeRepository.save(LeaveType.builder()
                .name("PL")
                .description("Privilege Leave")
                .annualEntitlement(15)
                .isCarryForward(true)
                .isActive(true)
                .build());
            leaveTypeRepository.save(LeaveType.builder()
                .name("SL")
                .description("Sick Leave")
                .annualEntitlement(12)
                .isCarryForward(false)
                .isActive(true)
                .build());
            log.info("Leave types seeded: CL(12), PL(15), SL(12)");
        } else {
            log.debug("Leave types already exist, skipping seed");
        }
    }

    private void seedCompany() {
        if (companyRepository.count() == 0) {
            companyRepository.save(Company.builder()
                .companyName("Sri Venkateswara Enterprises")
                .address("42, Industrial Estate, Guntur, Andhra Pradesh - 522002")
                .phone("0863-2234567")
                .email("contact@sventerprises.com")
                .website("www.sventerprises.com")
                .registrationNumber("AP-GDR-2024-01234")
                .gstNumber("37ABCDE1234F1Z5")
                .panNumber("ABCDE1234F")
                .tanNumber("HYDX01234A")
                .cinNumber("U12345AP2024PTC123456")
                .incorporatedDate(LocalDate.of(2020, 4, 1))
                .authorizedSignatory("S. Venkata Ramana")
                .build());
            log.info("Company seeded: Sri Venkateswara Enterprises");
        } else {
            log.debug("Company already exists, skipping seed");
        }
    }

    private void seedEmployees() {
        if (employeeRepository.count() == 0) {
            employeeRepository.save(Employee.builder()
                .employeeCode("EMP001")
                .prefix("MR")
                .firstName("Ravi")
                .surname("Kumar")
                .gender("MALE")
                .maritalStatus("MARRIED")
                .fatherHusbandName("Surya Narayana")
                .fMH("FATHER")
                .occupationKin("SALARIED")
                .occupationKinSub("MANAGER")
                .doj(LocalDate.of(2020, 6, 15))
                .highestQualification("MBA")
                .levelOfEducation("MASTERS")
                .yearOfPassing(2015)
                .dob(LocalDate.of(1991, 3, 10))
                .presentAddress("5-67, RTC Colony, Guntur - 522001")
                .permanentAddress("5-67, RTC Colony, Guntur - 522001")
                .email("ravi.kumar@company.com")
                .mobile("9876543210")
                .bloodGroup("B+")
                .aadharNumber("1234-5678-9012")
                .panNumber("ABCDE1234F")
                .bankName("SBI")
                .accountNumber("12345678901")
                .ifscCode("SBIN0012345")
                .branch("Guntur Main")
                .employeeStatus("LIVE")
                .designation("MANAGER")
                .religion("HINDU")
                .socialCategory("OC")
                .build());
            employeeRepository.save(Employee.builder()
                .employeeCode("EMP002")
                .prefix("MS")
                .firstName("Priya")
                .surname("Sharma")
                .gender("FEMALE")
                .maritalStatus("SINGLE")
                .fatherHusbandName("Rajesh Sharma")
                .fMH("FATHER")
                .occupationKin("SALARIED")
                .occupationKinSub("ENGINEER")
                .doj(LocalDate.of(2022, 1, 10))
                .highestQualification("B.Tech")
                .levelOfEducation("BACHELORS")
                .yearOfPassing(2017)
                .dob(LocalDate.of(1996, 7, 25))
                .presentAddress("Flat 201, Sai Towers, Vijayawada - 520001")
                .permanentAddress("H.No 1-23, Old Town, Vijayawada - 520001")
                .email("priya.sharma@company.com")
                .mobile("9876543211")
                .bloodGroup("O+")
                .aadharNumber("2345-6789-0123")
                .panNumber("FGHIJ5678K")
                .bankName("HDFC")
                .accountNumber("50100123456789")
                .ifscCode("HDFC0001234")
                .branch("Vijayawada")
                .employeeStatus("LIVE")
                .designation("ENGINEER")
                .religion("HINDU")
                .socialCategory("BC")
                .build());
            employeeRepository.save(Employee.builder()
                .employeeCode("EMP003")
                .prefix("MR")
                .firstName("Venkata")
                .surname("Rao")
                .gender("MALE")
                .maritalStatus("MARRIED")
                .fatherHusbandName("Nageswara Rao")
                .fMH("FATHER")
                .occupationKin("SALARIED")
                .occupationKinSub("ACCOUNTANT")
                .doj(LocalDate.of(2018, 4, 1))
                .highestQualification("M.Com")
                .levelOfEducation("MASTERS")
                .yearOfPassing(2000)
                .dob(LocalDate.of(1979, 11, 15))
                .presentAddress("12-34, Main Road, Tenali - 522201")
                .permanentAddress("12-34, Main Road, Tenali - 522201")
                .email("venkata.rao@company.com")
                .mobile("9876543212")
                .bloodGroup("A+")
                .aadharNumber("3456-7890-1234")
                .panNumber("KLMNO9012P")
                .bankName("CANARA")
                .accountNumber("78901234567")
                .ifscCode("CNRB0012345")
                .branch("Tenali")
                .employeeStatus("LIVE")
                .designation("ACCOUNTANT")
                .religion("HINDU")
                .socialCategory("OC")
                .build());
            employeeRepository.save(Employee.builder()
                .employeeCode("EMP004")
                .prefix("MR")
                .firstName("Srinivas")
                .surname("Reddy")
                .gender("MALE")
                .maritalStatus("MARRIED")
                .fatherHusbandName("Narayana Reddy")
                .fMH("FATHER")
                .occupationKin("SALARIED")
                .occupationKinSub("HR MANAGER")
                .doj(LocalDate.of(2021, 8, 1))
                .highestQualification("MBA")
                .levelOfEducation("MASTERS")
                .yearOfPassing(2016)
                .dob(LocalDate.of(1992, 5, 20))
                .presentAddress("3-45, HR Colony, Guntur - 522002")
                .permanentAddress("3-45, HR Colony, Guntur - 522002")
                .email("srinivas.reddy@company.com")
                .mobile("9876543213")
                .bloodGroup("AB+")
                .aadharNumber("4567-8901-2345")
                .panNumber("QRSTU3456V")
                .bankName("AXIS")
                .accountNumber("34567890123")
                .ifscCode("AXIS0012345")
                .branch("Guntur")
                .employeeStatus("LIVE")
                .designation("HR MANAGER")
                .religion("HINDU")
                .socialCategory("OC")
                .build());
            log.info("Employees seeded: EMP001 (Ravi), EMP002 (Priya), EMP003 (Venkata Rao), EMP004 (Srinivas)");
        } else {
            log.debug("Employees already exist, skipping seed");
        }
    }

    private void seedEmployeeUsers() {
        String[][] emps = {{"EMP001", "EMPLOYEE"}, {"EMP002", "EMPLOYEE"}, {"EMP003", "EMPLOYEE"}, {"EMP004", "HR"}};
        for (String[] e : emps) {
            if (!userRepository.existsByUsername(e[0])) {
                employeeRepository.findByEmployeeCode(e[0]).ifPresent(emp -> {
                    User user = User.builder()
                        .username(e[0])
                        .password(passwordEncoder.encode("Admin@123"))
                        .role(e[1])
                        .employeeId(emp.getId())
                        .enabled(true)
                        .accountNonLocked(true)
                        .build();
                    userRepository.save(user);
                    log.info("User created: {} / {} (linked to empId={})", e[0], e[1], emp.getId());
                });
            }
        }
    }

    private void seedSalaries() {
        if (salaryRepository.count() == 0) {
            int currentYear = LocalDate.now().getYear();
            int currentMonth = LocalDate.now().getMonthValue();

            Employee emp1 = employeeRepository.findByEmployeeCode("EMP001").orElse(null);
            Employee emp2 = employeeRepository.findByEmployeeCode("EMP002").orElse(null);
            Employee emp3 = employeeRepository.findByEmployeeCode("EMP003").orElse(null);

            if (emp1 == null || emp2 == null || emp3 == null) {
                log.warn("Employees not found, skipping salary seed");
                return;
            }

            // Seed salaries for current month and previous month
            int[] months = {currentMonth, currentMonth > 1 ? currentMonth - 1 : 12};
            int[] years = {currentYear, currentMonth > 1 ? currentYear : currentYear - 1};

            for (int i = 0; i < months.length; i++) {
                int m = months[i];
                int y = years[i];
                if (salaryRepository.existsByEmployeeIdAndWageYearAndWageMonth(emp1.getId(), y, m)) continue;

                // Employee 1: Ravi - Basic 25000, HRA 10000, FPA 5000, OA 3000
                saveSalary(emp1, m, y, 25000, 10000, 5000, 3000, 0);
                // Employee 2: Priya - Basic 20000, HRA 8000, FPA 4000, OA 2000
                saveSalary(emp2, m, y, 20000, 8000, 4000, 2000, 0);
                // Employee 3: Venkata - Basic 18000, HRA 7200, FPA 3600, OA 1800
                saveSalary(emp3, m, y, 18000, 7200, 3600, 1800, 0);
            }
            log.info("Salary records seeded for {} months", months.length);
        } else {
            log.debug("Salary records already exist, skipping seed");
        }
    }

    private void saveSalary(Employee emp, int month, int year,
                            double basic, double hra, double fpa, double oa, double ot) {
        BigDecimal b = BigDecimal.valueOf(basic);
        BigDecimal h = BigDecimal.valueOf(hra);
        BigDecimal f = BigDecimal.valueOf(fpa);
        BigDecimal o = BigDecimal.valueOf(oa);
        BigDecimal gross = b.add(h).add(f).add(o);
        BigDecimal pf = b.multiply(BigDecimal.valueOf(0.12));
        BigDecimal esi = gross.multiply(BigDecimal.valueOf(0.0075));
        BigDecimal pt = BigDecimal.valueOf(200);
        BigDecimal otWages = BigDecimal.valueOf(ot);

        salaryRepository.save(Salary.builder()
            .employee(emp)
            .wageMonth(month)
            .wageYear(year)
            .basic(b)
            .hra(h)
            .fixedPersonalAllowance(f)
            .otherAllowance(o)
            .pfDeduction(pf)
            .esiDeduction(esi)
            .ptDeduction(pt)
            .overtimeWages(otWages)
            .dateOfPayment(java.time.LocalDateTime.now())
            .build());
    }

    private void seedLeaveBalances() {
        int currentYear = LocalDate.now().getYear();
        if (leaveBalanceRepository.findByYear(currentYear).isEmpty()) {
            employeeRepository.findAll().forEach(emp -> {
                leaveTypeRepository.findByIsActiveTrue().forEach(lt -> {
                    if (leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                            emp.getId(), lt.getId(), currentYear).isEmpty()) {
                        leaveBalanceRepository.save(LeaveBalance.builder()
                            .employee(emp)
                            .leaveType(lt)
                            .year(currentYear)
                            .entitled(lt.getAnnualEntitlement())
                            .taken(0)
                            .balance(lt.getAnnualEntitlement())
                            .build());
                    }
                });
            });
            log.info("Leave balances seeded for year {}", currentYear);
        } else {
            log.debug("Leave balances already exist, skipping seed");
        }
    }

    private void seedDocumentTemplates() {
        if (documentTemplateRepository.count() == 0) {
            documentTemplateRepository.save(DocumentTemplate.builder()
                .templateName("Standard Joining Letter")
                .templateType("JOINING_LETTER")
                .description("Standard joining letter template for new employees")
                .content(templateJoiningLetter())
                .variables("[\"employee_name\",\"designation\",\"doj\",\"company_name\"]")
                .isActive(true)
                .build());
            documentTemplateRepository.save(DocumentTemplate.builder()
                .templateName("Standard Offer Letter")
                .templateType("OFFER_LETTER")
                .description("Standard offer letter for selected candidates")
                .content(templateOfferLetter())
                .variables("[\"employee_name\",\"designation\",\"company_name\"]")
                .isActive(true)
                .build());
            documentTemplateRepository.save(DocumentTemplate.builder()
                .templateName("Standard Experience Letter")
                .templateType("EXPERIENCE_LETTER")
                .description("Standard experience certificate for exiting employees")
                .content(templateExperienceLetter())
                .variables("[\"employee_name\",\"designation\",\"doj\",\"doe\",\"company_name\"]")
                .isActive(true)
                .build());
            documentTemplateRepository.save(DocumentTemplate.builder()
                .templateName("Standard Relieving Letter")
                .templateType("RELIEVING_LETTER")
                .description("Standard relieving letter for exiting employees")
                .content(templateRelievingLetter())
                .variables("[\"employee_name\",\"designation\",\"doj\",\"doe\",\"company_name\"]")
                .isActive(true)
                .build());
            documentTemplateRepository.save(DocumentTemplate.builder()
                .templateName("Standard Appointment Letter")
                .templateType("APPOINTMENT_LETTER")
                .description("Standard appointment letter with terms and conditions")
                .content(templateAppointmentLetter())
                .variables("[\"employee_name\",\"designation\",\"company_name\"]")
                .isActive(true)
                .build());
            documentTemplateRepository.save(DocumentTemplate.builder()
                .templateName("Standard Salary Slip")
                .templateType("SALARY_SLIP")
                .description("Standard monthly salary slip")
                .content(templateSalarySlip())
                .variables("[\"employee_name\",\"employee_code\",\"designation\",\"company_name\"]")
                .isActive(true)
                .build());
            documentTemplateRepository.save(DocumentTemplate.builder()
                .templateName("Standard Confirmation Letter")
                .templateType("CONFIRMATION_LETTER")
                .description("Standard confirmation letter after probation")
                .content(templateConfirmationLetter())
                .variables("[\"employee_name\",\"designation\",\"doj\",\"company_name\"]")
                .isActive(true)
                .build());
            documentTemplateRepository.save(DocumentTemplate.builder()
                .templateName("No Objection Certificate")
                .templateType("NOC")
                .description("Standard NOC for employees")
                .content(templateNOC())
                .variables("[\"employee_name\",\"designation\",\"company_name\"]")
                .isActive(true)
                .build());
            log.info("Document templates seeded: 8 templates");
        } else {
            log.debug("Document templates already exist, skipping seed");
        }
    }

    private String templateJoiningLetter() {
        return """
            <div class="document-header"><h1>JOINING LETTER</h1></div>
            <div class="document-content">
            <p>Date: <b>{{current_date}}</b></p>
            <p>To,<br><b>{{employee_name}}</b><br>{{address}}</p>
            <p>Dear <b>{{employee_name}}</b>,</p>
            <p>We are pleased to have you join <b>{{company_name}}</b> as <b>{{designation}}</b>.</p>
            <p>Your date of joining is <b>{{doj}}</b>. Please report to the HR department on your first day.</p>
            <p>We look forward to a long and mutually beneficial association with you.</p>
            <div class="signature-section">
            <p>Yours sincerely,</p>
            <p><br><br><b>{{authorized_signatory}}</b><br>{{company_name}}</p>
            </div></div>""";
    }

    private String templateOfferLetter() {
        return """
            <div class="document-header"><h1>OFFER LETTER</h1></div>
            <div class="document-content">
            <p>Date: <b>{{current_date}}</b></p>
            <p>To,<br><b>{{employee_name}}</b><br>{{address}}</p>
            <p>Dear <b>{{employee_name}}</b>,</p>
            <p>We are pleased to offer you the position of <b>{{designation}}</b> at <b>{{company_name}}</b>.</p>
            <p>Your compensation and other terms will be communicated separately.</p>
            <p>Please confirm your acceptance by signing a copy of this letter.</p>
            <div class="signature-section">
            <p>Yours sincerely,</p>
            <p><br><br><b>{{authorized_signatory}}</b><br>{{company_name}}</p>
            </div></div>""";
    }

    private String templateExperienceLetter() {
        return """
            <div class="document-header"><h1>EXPERIENCE CERTIFICATE</h1></div>
            <div class="document-content">
            <p>Date: <b>{{current_date}}</b></p>
            <p>This is to certify that <b>{{employee_name}}</b> worked with <b>{{company_name}}</b> as <b>{{designation}}</b> from <b>{{doj}}</b> to <b>{{doe}}</b>.</p>
            <p>During this period, {{employee_name}} was found to be sincere, hardworking, and dedicated to work.</p>
            <p>We wish {{employee_name}} all the best in future endeavors.</p>
            <div class="signature-section">
            <p>Yours sincerely,</p>
            <p><br><br><b>{{authorized_signatory}}</b><br>{{company_name}}</p>
            </div></div>""";
    }

    private String templateRelievingLetter() {
        return """
            <div class="document-header"><h1>RELIEVING LETTER</h1></div>
            <div class="document-content">
            <p>Date: <b>{{current_date}}</b></p>
            <p>This is to certify that <b>{{employee_name}}</b> ({{employee_code}}) who was working as <b>{{designation}}</b> at <b>{{company_name}}</b> from <b>{{doj}}</b> to <b>{{doe}}</b> is hereby relieved from duties.</p>
            <p>{{employee_name}} has cleared all dues and obligations with the company.</p>
            <div class="signature-section">
            <p>Yours sincerely,</p>
            <p><br><br><b>{{authorized_signatory}}</b><br>{{company_name}}</p>
            </div></div>""";
    }

    private String templateAppointmentLetter() {
        return """
            <div class="letterhead">
            <div class="logo-area">{{company_logo}}</div>
            <div class="company-details">
            <h2>{{company_name}}</h2>
            <p>{{company_address}}<br>Phone: {{company_phone}} | Email: {{company_email}}</p>
            </div>
            <hr class="header-line">
            </div>

            <p class="confidential"><b>Private and Confidential</b></p>

            <p>Date: {{current_date}}</p>

            <p><b>{{prefix}} {{first_name}} {{surname}}</b><br>{{address}}</p>

            <p>Dear <b>{{prefix}} {{first_name}}</b>,</p>

            <p>On behalf of <b>{{company_name}}</b> (hereinafter referred to as "the Company"), it gives me great pleasure to welcome you onboard as <b>{{designation}}</b>. The Company is poised for strong growth and we look forward to working with you to take the firm to the next level.</p>

            <p>The following pages list down the terms and conditions of your employment with the Company as well as the breakup of your compensation package.</p>

            <p>The future holds many opportunities and challenges for us, as an organisation. Each one of us has an important role in shaping the Company of tomorrow. With our passion and dedication, we will together achieve our milestones and set up new ones!</p>

            <p>Wishing you a long, successful and enriching journey with the Company.</p>

            <div class="signature-section">
            <p>Yours sincerely,<br>For <b>{{company_name}}</b>,</p>
            <p><br><br><b>{{authorized_signatory}}</b><br>Director</p>
            </div>

            <div class="page-break"></div>

            <div class="letterhead">
            <div class="logo-area">{{company_logo}}</div>
            <div class="company-details">
            <h2>{{company_name}}</h2>
            </div>
            <hr class="header-line">
            </div>

            <p class="confidential"><b>Private and Confidential</b></p>

            <p>Dear <b>{{prefix}} {{first_name}}</b>,</p>

            <p class="section-title"><b>Contractual Terms for Employment with {{company_name}}</b></p>

            <p>We are pleased to welcome you on board. Please find the terms and conditions of your employment with the Company:</p>

            <table class="terms-table">
            <tr><td class="term-num">1)</td><td><b>Date of Commencement:</b> Your employment will commence from the date you join our organisation by submitting your testimonials.</td></tr>

            <tr><td class="term-num">2)</td><td><b>Remuneration:</b> The details of the compensation are laid out in Annexure A and will be subject to statutory and other deductions as per company policies and statutory guidelines.</td></tr>

            <tr><td class="term-num">3)</td><td><b>Place of Work:</b> Your place of work will be at {{address}}. You may need to travel to other locations basis the needs of Business or the specific work handled. Expenses incurred due to such travel will be reimbursed as per Company Policy. The Company reserves the right to transfer / post / depute you to any of its offices, client locations, branches, group entities or project sites within India depending upon business requirements.</td></tr>

            <tr><td class="term-num">4)</td><td><b>Work Details:</b> Your work timings may be in different shift timings, depending upon the exigencies / client requirements, to provide services to the clients of the Company. You will be explained your work in detail on assumption of duties. Your working hours, weekly offs, holidays and shift schedules shall be governed by applicable law and company policy as amended from time to time.</td></tr>

            <tr><td class="term-num">5)</td><td><b>Probation:</b> You will be on probation for a period of 6 months. Upon completion of your probation period, you will be confirmed in the services of the Company subject to your work performance being found to be satisfactory during the probation period. The probation period may be extended at the discretion of the Company based on performance, conduct, attendance or business requirements.</td></tr>

            <tr><td class="term-num">6)</td><td><b>Proprietary Information Agreement:</b> Your employment creates a relationship of confidence and trust between you and the Company with respect to certain information of a confidential, proprietary or trade secret in nature. For the purposes of this Agreement, all such confidential, proprietary or trade secret information will be referred to as "Proprietary Information". You therefore agree to abide by the following terms and conditions:<br>
            <ol class="sub-list">
            <li>Proprietary Information includes without limitation: all software / ideas developed or licensed by or for the Company or licensed to the Company by a third party; marketing and sales plans, product development plans, business and financial plans; any process / process related documents; customer information / data.</li>
            <li>At all times, both during and after your contract with the Company, you will hold proprietary information in confidence.</li>
            <li>You will not use, transfer, publish, disclose, or report Proprietary Information directly or indirectly, except such disclosure to other employees of the Company or authorised third parties as may be necessary in the ordinary course of performing your duties.</li>
            <li>You shall, upon conclusion of your contract with the Company, return all property belonging to the Company, including without limitation all Proprietary Information, Identity Card, documents, software, laptops and any other form of media.</li>
            <li>Proprietary Information shall not include information known publicly or generally employed in the trade.</li>
            </ol></td></tr>

            <tr><td class="term-num">7)</td><td><b>Confidentiality:</b><br>
            <ol class="sub-list">
            <li>Employee shall comply with all information security, cyber security, IT usage, client confidentiality and data privacy policies of the Company.</li>
            <li>Any intellectual property, work product, process, software, documentation, database, design, invention, development or material created during employment in connection with Company business shall remain the sole property of the Company.</li>
            <li>The terms and conditions and any other discussions with regard to this agreement are absolutely confidential.</li>
            </ol></td></tr>

            <tr><td class="term-num">8)</td><td><b>Conduct:</b> You are expected to exhibit at all times:<br>
            <ol class="sub-list">
            <li>Ethics in attitude and behaviour. Maintain professional, respectful, ethical and non-discriminatory conduct towards all employees, clients, vendors and stakeholders.</li>
            <li>Integrity and excellence in your work.</li>
            <li>Conduct your work and yourself in strict compliance with rules, regulations and policies.</li>
            <li>Be respectful in words and action with your fellow employees.</li>
            </ol></td></tr>

            <tr><td class="term-num">9)</td><td><b>POSH Compliance:</b> The Company maintains a zero-tolerance policy against sexual harassment and discrimination at workplace and complies with applicable laws relating to prevention of sexual harassment at workplace.</td></tr>

            <tr><td class="term-num">10)</td><td><b>HR Policies:</b> The employees are expected to comply with all HR policies, code of conduct, leave rules, disciplinary procedures, information security policies and operational guidelines issued by the Company from time to time.</td></tr>

            <tr><td class="term-num">11)</td><td>Please note that you will need to make your own arrangements for commuting between your residence and office and the company does not undertake to provide any transport or any conveyance allowance in lieu thereof.</td></tr>

            <tr><td class="term-num">12)</td><td><b>Termination and Notice:</b> This contract of employment can be terminated, by either side, by giving the applicable Notice as given below. The Company reserves the right to initiate disciplinary action including termination in cases involving misconduct, fraud, breach of confidentiality, harassment, violence, insubordination, unauthorised absence or violation of Company policies, subject to applicable law. At the sole discretion of the Management, servicing of Notice Period may be substituted by remittance of "Notice Pay", being the equivalent of the Net Salary as applicable.<br>
            <ol class="sub-list">
            <li>Up to one year of Service, notice period of Fifteen (15) days.</li>
            <li>Upon or after one year of Service, notice period of One (1) month.</li>
            </ol></td></tr>

            <tr><td class="term-num">13)</td><td><b>Full &amp; Final Settlement:</b> Upon cessation of employment, full and final settlement shall be processed subject to clearance of Company assets, confidential information and dues in accordance with Company policy and applicable law.</td></tr>

            <tr><td class="term-num">14)</td><td>In case of continuous unauthorised absence for two weeks without information, the Company may initiate appropriate disciplinary action in accordance with Company policy and applicable law after providing reasonable opportunity to explain the absence.</td></tr>

            <tr><td class="term-num">15)</td><td><b>Grievance Redressal:</b> Any grievance relating to employment may be escalated through the Company's grievance redressal mechanism.</td></tr>

            <tr><td class="term-num">16)</td><td><b>Background Verification:</b> This employment is subject to satisfactory background verification, reference checks and verification of documents submitted by you. If any information / documents are found false, misleading or suppressed, the Company reserves the right to withdraw the offer or terminate employment. Documentation proof includes:<br>
            <ol class="sub-list">
            <li>Personal documentation proof (Identity, Address, Date of Birth etc.).</li>
            <li>Educational Qualification proof.</li>
            <li>Prior Work Experience proof.</li>
            </ol></td></tr>

            <tr><td class="term-num">17)</td><td><b>Data Collection:</b><br>
            <ol class="sub-list">
            <li>You hereby provide explicit consent to the Company to collect, receive, store, process, use, transfer, share and retain personal information / data including sensitive personal details, documents and employment-related information for lawful business and employment purposes.</li>
            <li>You understand and agree that such personal information / data may be shared with authorised third parties, group companies, clients, consultants, statutory authorities, auditors, background verification agencies, payroll processors, IT service providers or other service partners on a need-to-know basis and in compliance with applicable laws.</li>
            </ol></td></tr>

            <tr><td class="term-num">18)</td><td><b>Validity:</b> Please confirm your acceptance of the above terms and conditions by signing the attached declaration and affixing your initials on each page of the copy of the contract and returning the copy to us.</td></tr>
            </table>

            <div class="signature-section">
            <p>Yours sincerely,<br>For <b>{{company_name}}</b>,</p>
            <p><br><br><b>{{authorized_signatory}}</b><br>Director</p>
            </div>

            <div class="page-break"></div>

            <div class="letterhead">
            <div class="logo-area">{{company_logo}}</div>
            <div class="company-details">
            <h2>{{company_name}}</h2>
            </div>
            <hr class="header-line">
            </div>

            <p class="section-title"><b>Annexure A</b></p>
            <p><b>Breakup of Cost to Company of <u>{{prefix}} {{first_name}} {{surname}}</u>, <u>{{designation}}</u></b></p>

            <table class="salary-table">
            <tr class="table-header"><th>Salary</th><th>Monthly</th><th>Annual</th></tr>
            <tr><td>Basic Pay</td><td align="right">{{basic_pay}}</td><td align="right">{{basic_pay_annual}}</td></tr>
            <tr><td>HRA (30% of Basic)</td><td align="right">{{hra_amount}}</td><td align="right">{{hra_annual}}</td></tr>
            <tr><td>Other Allowance</td><td align="right">{{other_allowance}}</td><td align="right">{{other_allowance_annual}}</td></tr>
            <tr class="total-row"><td><b>Total</b></td><td align="right"><b>{{total_monthly}}</b></td><td align="right"><b>{{total_annual}}</b></td></tr>
            <tr><td colspan="3"></td></tr>
            <tr class="table-header"><th>Company Contribution</th><th></th><th></th></tr>
            <tr><td>PF</td><td align="right">{{pf_amount}}</td><td align="right">{{pf_annual}}</td></tr>
            <tr><td>ESIC (3.25% of Gross)</td><td align="right">{{esic_amount}}</td><td align="right">{{esic_annual}}</td></tr>
            <tr class="total-row"><td><b>Total CTC</b></td><td align="right"><b>{{ctc_monthly}}</b></td><td align="right"><b>{{ctc_annual}}</b></td></tr>
            </table>

            <br>
            <ol class="sub-list">
            <li>All entitlements (as applicable and as per the law) would apply upon your joining the Company. The entitlements are subject to company policies / procedures / guidelines that may be issued / modified from time to time. All perquisites and benefits including reimbursements are subject to applicable Income Tax provisions, including taxation on perquisite value.</li>
            <li>These entitlements shall cease upon termination of your contract with the Company.</li>
            <li>The salary structure has been designed in accordance with applicable labour laws and wage-related statutory provisions. Any allowance / component interpreted by competent authorities / courts as forming part of wages shall be treated accordingly for statutory compliance purposes.</li>
            </ol>

            <div class="signature-section">
            <p>For <b>{{company_name}}</b>,</p>
            <p><br><br><b>{{authorized_signatory}}</b><br>Director</p>
            </div>

            <div class="page-break"></div>

            <div class="letterhead">
            <div class="logo-area">{{company_logo}}</div>
            <div class="company-details">
            <h2>{{company_name}}</h2>
            </div>
            <hr class="header-line">
            </div>

            <p class="section-title"><b>DECLARATION</b></p>

            <p>I, <b><u>{{prefix}} {{first_name}} {{surname}}</u></b>, have read, understood and agree with all the terms and conditions of employment with the Company as communicated vide their Appointment Letter and agree to abide by the same.</p>

            <p>I also confirm that I have read, understood and agree to comply with the provisions and requirements of the Proprietary / Confidential Information Clause.</p>

            <p>I hereby provide explicit consent to the Company to collect, receive, store, process, use, transfer, share and retain personal information / data including sensitive personal details, documents and employment-related information for lawful business and employment purposes including but not limited to recruitment, onboarding, payroll processing, statutory compliance, background verification, insurance, client requirements, internal administration, performance management and any other legitimate employment-related purposes.</p>

            <p>I understand and agree that such personal information / data may be shared with authorised third parties, group companies, clients, consultants, statutory authorities, auditors, background verification agencies, payroll processors, IT service providers or other service partners on a need-to-know basis and in compliance with applicable laws.</p>

            <p>I shall commence employment with effect from: <b>{{doj}}</b></p>

            <br>
            <table class="declaration-table">
            <tr><td style="width:30%;"><b>Signature:</b></td><td style="border-bottom:1px solid #333;"></td></tr>
            <tr><td><b>Date:</b></td><td style="border-bottom:1px solid #333;">{{current_date}}</td></tr>
            </table>
            </div>""";
    }

    private String templateSalarySlip() {
        return """
            <div class="document-header"><h1>SALARY SLIP</h1></div>
            <div class="document-content">
            <table style="width:100%; border-collapse: collapse;">
            <tr><td><b>Employee Name:</b> {{employee_name}}</td><td><b>Employee Code:</b> {{employee_code}}</td></tr>
            <tr><td><b>Designation:</b> {{designation}}</td><td><b>Company:</b> {{company_name}}</td></tr>
            </table>
            <br>
            <table style="width:100%; border-collapse: collapse; border: 1px solid #000;">
            <tr style="background:#f0f0f0;"><th colspan="2">Earnings</th><th colspan="2">Deductions</th></tr>
            <tr><td>Basic</td><td></td><td>PF</td><td></td></tr>
            <tr><td>HRA</td><td></td><td>ESI</td><td></td></tr>
            <tr><td>Fixed Personal Allowance</td><td></td><td>PT</td><td></td></tr>
            <tr><td>Other Allowance</td><td></td><td></td><td></td></tr>
            <tr><td><b>Gross</b></td><td></td><td><b>Total Deductions</b></td><td></td></tr>
            </table>
            <p style="text-align:right;"><b>Net Pay:</b></p>
            <br>
            <div class="signature-section">
            <p style="text-align:right;"><b>{{authorized_signatory}}</b><br>{{company_name}}</p>
            </div></div>""";
    }

    private String templateConfirmationLetter() {
        return """
            <div class="document-header"><h1>CONFIRMATION LETTER</h1></div>
            <div class="document-content">
            <p>Date: <b>{{current_date}}</b></p>
            <p>To,<br><b>{{employee_name}}</b><br>{{address}}</p>
            <p>Dear <b>{{employee_name}}</b>,</p>
            <p>Congratulations! We are pleased to confirm your employment at <b>{{company_name}}</b> as <b>{{designation}}</b> effective from <b>{{current_date}}</b>.</p>
            <p>Your probation period has been successfully completed, and you are now a permanent employee of the company.</p>
            <div class="signature-section">
            <p>Yours sincerely,</p>
            <p><br><br><b>{{authorized_signatory}}</b><br>{{company_name}}</p>
            </div></div>""";
    }

    private String templateNOC() {
        return """
            <div class="document-header"><h1>NO OBJECTION CERTIFICATE</h1></div>
            <div class="document-content">
            <p>Date: <b>{{current_date}}</b></p>
            <p>This is to certify that <b>{{company_name}}</b> has no objection to <b>{{employee_name}}</b> ({{employee_code}}) who worked as <b>{{designation}}</b> from <b>{{doj}}</b> to <b>{{doe}}</b> pursuing any other employment or educational opportunities.</p>
            <p>This certificate is issued upon the request of the employee.</p>
            <div class="signature-section">
            <p>Yours sincerely,</p>
            <p><br><br><b>{{authorized_signatory}}</b><br>{{company_name}}</p>
            </div></div>""";
    }

    @Transactional
    private void seedPermissions() {
        rolePermissionRepository.deleteAll();

        String[][] resources = {
            {"dashboard", "1,1,1,1", "1,0,0,0", "1,0,0,0"},
            {"staff_master", "1,1,1,1", "1,0,1,0", "1,0,0,0"},
            {"company", "1,1,1,1", "0,0,0,0", "0,0,0,0"},
            {"masters", "1,1,1,1", "0,0,0,0", "0,0,0,0"},
            {"doc_templates", "1,1,1,1", "0,0,0,0", "0,0,0,0"},
            {"payroll", "1,1,1,1", "1,1,1,0", "0,0,0,0"},
            {"leave", "1,1,1,1", "1,1,1,0", "1,1,0,0"},
            {"reports", "1,1,1,1", "1,0,0,0", "0,0,0,0"},
            {"registrations", "1,1,1,1", "1,0,1,0", "0,0,0,0"},
            {"chat", "1,1,1,1", "1,0,0,0", "0,0,0,0"}
        };

        for (String[] row : resources) {
            String resource = row[0];
            String[] adminPerms = row[1].split(",");
            String[] hrPerms = row[2].split(",");
            String[] empPerms = row[3].split(",");

            rolePermissionRepository.save(RolePermission.builder()
                .role("ADMIN").resource(resource)
                .canView("1".equals(adminPerms[0])).canAdd("1".equals(adminPerms[1]))
                .canEdit("1".equals(adminPerms[2])).canDelete("1".equals(adminPerms[3]))
                .build());

            rolePermissionRepository.save(RolePermission.builder()
                .role("HR").resource(resource)
                .canView("1".equals(hrPerms[0])).canAdd("1".equals(hrPerms[1]))
                .canEdit("1".equals(hrPerms[2])).canDelete("1".equals(hrPerms[3]))
                .build());

            rolePermissionRepository.save(RolePermission.builder()
                .role("EMPLOYEE").resource(resource)
                .canView("1".equals(empPerms[0])).canAdd("1".equals(empPerms[1]))
                .canEdit("1".equals(empPerms[2])).canDelete("1".equals(empPerms[3]))
                .build());
        }

        log.info("Role permissions seeded for ADMIN, HR, EMPLOYEE across {} resources", resources.length);
    }

    private void seedCategory(String category, String[][] values) {
        int order = 1;
        for (String[] pair : values) {
                if (masterDataRepository.findByCategoryIgnoreCaseAndCodeIgnoreCase(category, pair[0]).isEmpty()) {
                MasterData md = MasterData.builder()
                    .category(category)
                    .code(pair[0])
                    .value(pair[1])
                    .sortOrder(order++)
                    .active(true)
                    .build();
                masterDataRepository.save(md);
            }
        }
    }
}
