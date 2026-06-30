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
            <div class="document-header"><h1>APPOINTMENT LETTER</h1></div>
            <div class="document-content">
            <p>Date: <b>{{current_date}}</b></p>
            <p>To,<br><b>{{employee_name}}</b><br>{{address}}</p>
            <p>Dear <b>{{employee_name}}</b>,</p>
            <p>We are pleased to appoint you as <b>{{designation}}</b> at <b>{{company_name}}</b>.</p>
            <p><b>Terms of Appointment:</b></p>
            <ol>
            <li>You will be on probation for 6 months from the date of joining.</li>
            <li>Your working hours will be 9:00 AM to 6:00 PM, Monday to Friday.</li>
            <li>You will be entitled to all benefits as per company policy.</li>
            </ol>
            <p>Please sign a copy of this letter as acceptance.</p>
            <div class="signature-section">
            <p>Yours sincerely,</p>
            <p><br><br><b>{{authorized_signatory}}</b><br>{{company_name}}</p>
            </div></div>""";
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
