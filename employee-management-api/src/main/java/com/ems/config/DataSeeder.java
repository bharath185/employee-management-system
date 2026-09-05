package com.ems.config;

import com.ems.model.*;
import com.ems.repository.*;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.ems.utils.EmployeeCodeGenerator;
import javax.sql.DataSource;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.ArrayList;

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
    private final EmployeeCodeGenerator employeeCodeGenerator;

    private final DataSource dataSource;

    @org.springframework.beans.factory.annotation.Value("${app.data.seed-on-startup:true}")
    private boolean seedOnStartup;

    private List<String> seededEmployeeCodes = new ArrayList<>();

    @Override
    public void run(String... args) {
        fixColumnLengths();
        seedAdminUser();
        seedMasterData();
        seedLeaveTypes();
        seedCompany();
        if (seedOnStartup) {
            seedEmployees();
            seedEmployeeUsers();
            seedLeaveBalances();
        }
        seedDocumentTemplates();
        seedPermissions();
    }

    private void fixColumnLengths() {
        String[] stmts = {
            "ALTER TABLE employees ALTER COLUMN mobile TYPE VARCHAR(20)",
            "ALTER TABLE employees ALTER COLUMN account_number TYPE VARCHAR(30)",
            "ALTER TABLE pending_registrations ALTER COLUMN mobile TYPE VARCHAR(20)",
            "ALTER TABLE attendance_records ALTER COLUMN status TYPE VARCHAR(10)",
            "ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS encashed INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE holidays ADD COLUMN IF NOT EXISTS is_department_specific BOOLEAN NOT NULL DEFAULT FALSE",
            "ALTER TABLE holidays ADD COLUMN IF NOT EXISTS departments VARCHAR(500)"
        };
        for (String sql : stmts) {
            try (var conn = dataSource.getConnection(); var stmt = conn.createStatement()) {
                stmt.execute(sql);
                log.info("Executed: {}", sql);
            } catch (Exception e) {
                log.info("Could not execute [{}]: {}", sql, e.getMessage());
            }
        }
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
                {"ASKED_TO_GO", "Asked to Go"}, {"STOPPED_COMING", "Stopped Coming"},
                {"TERMINATED", "Terminated"}
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
            log.info("Master data seeded successfully");
        } else {
            log.debug("Master data already exists, skipping seed");
        }

        // Seed categories independently â€” existing databases may have been seeded before these were added
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
        seedCategory("LANGUAGE", new String[][]{
            {"TELUGU", "Telugu"}, {"HINDI", "Hindi"}, {"ENGLISH", "English"},
            {"TAMIL", "Tamil"}, {"KANNADA", "Kannada"}, {"MALAYALAM", "Malayalam"},
            {"URDU", "Urdu"}, {"MARATHI", "Marathi"}, {"GUJARATI", "Gujarati"},
            {"BENGALI", "Bengali"}, {"ORIYA", "Odia"}
        });
        seedCategory("DEPARTMENT", new String[][]{
            {"IT", "IT"}, {"HR", "HR"}, {"FINANCE", "Finance"},
            {"OPERATIONS", "Operations"}, {"SALES", "Sales"},
            {"MARKETING", "Marketing"}, {"ADMIN", "Admin"},
            {"PRODUCTION", "Production"}, {"QUALITY", "Quality"},
            {"RND", "R&D"}, {"PURCHASE", "Purchase"},
            {"STORES", "Stores"}, {"MAINTENANCE", "Maintenance"}
        });
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
            leaveTypeRepository.save(LeaveType.builder()
                .name("CO")
                .description("Compensatory Off")
                .annualEntitlement(0)
                .isCarryForward(false)
                .isActive(true)
                .build());
            log.info("Leave types seeded: CL(12), PL(15), SL(12), CO(0)");
        } else {
            if (leaveTypeRepository.findByName("CO").isEmpty()) {
                leaveTypeRepository.save(LeaveType.builder()
                    .name("CO")
                    .description("Compensatory Off")
                    .annualEntitlement(0)
                    .isCarryForward(false)
                    .isActive(true)
                    .build());
                log.info("CO leave type added (existing database migration)");
            }
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
        if (employeeRepository.countActive() > 0) {
            log.debug("Employees already exist, skipping seed");
            return;
        }
        seededEmployeeCodes = new ArrayList<>();
        String[][] employeeData = {
            {"MR", "Ravi", "Kumar", "MALE", "MARRIED", "Surya Narayana", "FATHER", "SALARIED", "MANAGER",
             "2020-06-15", "MBA", "MASTERS", "2015", "1991-03-10", "ravi.kumar@company.com", "9876543210",
             "B+", "1234-5678-9012", "ABCDE1234F", "SBI", "12345678901", "SBIN0012345", "Guntur Main",
             "MANAGER", "HINDU", "OC", "5-67, RTC Colony, Guntur - 522001"},
            {"MS", "Priya", "Sharma", "FEMALE", "SINGLE", "Rajesh Sharma", "FATHER", "SALARIED", "SP_ASSOCIATE",
             "2022-01-10", "B.Tech", "BACHELORS", "2017", "1996-07-25", "priya.sharma@company.com", "9876543211",
             "O+", "2345-6789-0123", "FGHIJ5678K", "HDFC", "50100123456789", "HDFC0001234", "Vijayawada",
             "SP_ASSOCIATE", "HINDU", "BC", "Flat 201, Sai Towers, Vijayawada - 520001"},
            {"MR", "Venkata", "Rao", "MALE", "MARRIED", "Nageswara Rao", "FATHER", "SALARIED", "ACCOUNTANT",
             "2018-04-01", "M.Com", "MASTERS", "2000", "1979-11-15", "venkata.rao@company.com", "9876543212",
             "A+", "3456-7890-1234", "KLMNO9012P", "CANARA", "78901234567", "CNRB0012345", "Tenali",
             "ACCOUNTANT", "HINDU", "OC", "12-34, Main Road, Tenali - 522201"},
            {"MR", "Srinivas", "Reddy", "MALE", "MARRIED", "Narayana Reddy", "FATHER", "SALARIED", "CHIEF_MANAGER",
             "2021-08-01", "MBA", "MASTERS", "2016", "1992-05-20", "srinivas.reddy@company.com", "9876543213",
             "AB+", "4567-8901-2345", "QRSTU3456V", "AXIS", "34567890123", "AXIS0012345", "Guntur",
             "CHIEF_MANAGER", "HINDU", "OC", "3-45, HR Colony, Guntur - 522002"},
            {"MR", "Mohan", "Das", "MALE", "MARRIED", "Krishna Das", "FATHER", "SALARIED", "ASST_MANAGER",
             "2019-11-01", "BBA", "BACHELORS", "2012", "1990-08-12", "mohan.das@company.com", "9876543214",
             "A-", "5678-9012-3456", "TUVWX7890Y", "ICICI", "45678901234", "ICIC0012345", "Ongole",
             "ASST_MANAGER", "HINDU", "BC", "7-89, New Colony, Ongole - 523001"},
            {"MR", "Suresh", "Naidu", "MALE", "MARRIED", "Venkata Naidu", "FATHER", "SALARIED", "TEAM_LEADER",
             "2021-02-15", "BCA", "BACHELORS", "2017", "1995-12-05", "suresh.naidu@company.com", "9876543215",
             "B+", "6789-0123-4567", "YZABC1234D", "HDFC", "56789012345", "HDFC0005678", "Nellore",
             "TEAM_LEADER", "HINDU", "OC", "Flat 102, Lake View, Nellore - 524001"},
            {"MS", "Lakshmi", "Devi", "FEMALE", "MARRIED", "Ramana Reddy", "HUSBAND", "SALARIED", "JP_ASSOCIATE",
             "2023-06-01", "B.Com", "BACHELORS", "2020", "1998-04-18", "lakshmi.devi@company.com", "9876543216",
             "O+", "7890-1234-5678", "EFGHI5678J", "SBI", "67890123456", "SBIN0067890", "Kurnool",
             "JP_ASSOCIATE", "HINDU", "BC", "2-34, Temple Street, Kurnool - 518001"},
            {"MR", "Arun", "Kumar", "MALE", "SINGLE", "Sundaram Pillai", "FATHER", "SALARIED", "WORK_LEADER",
             "2024-01-08", "B.Sc", "BACHELORS", "2022", "2000-09-22", "arun.kumar@company.com", "9876543217",
             "AB-", "8901-2345-6789", "KLMNO1234P", "AXIS", "78901234567", "AXIS0067890", "Tirupati",
             "WORK_LEADER", "HINDU", "OC", "1-23, Main Bazaar, Tirupati - 517501"},
            {"MR", "Rajesh", "Yadav", "MALE", "SINGLE", "Shyam Yadav", "FATHER", "SALARIED", "MANAGER",
             "2020-03-01", "MBA", "MASTERS", "2018", "1994-07-14", "rajesh.yadav@company.com", "9876543218",
             "B-", "9012-3456-7890", "QRSTU9012V", "ICICI", "89012345678", "ICIC0078901", "Kadapa",
             "MANAGER", "HINDU", "OC", "4-56, Gandhi Nagar, Kadapa - 516001"},
            {"MS", "Anitha", "Reddy", "FEMALE", "MARRIED", "Gopal Reddy", "HUSBAND", "SALARIED", "SP_ASSOCIATE",
             "2022-09-12", "MCA", "MASTERS", "2021", "1997-11-30", "anitha.reddy@company.com", "9876543219",
             "A+", "0123-4567-8901", "VWXYZ2345A", "HDFC", "90123456789", "HDFC0089012", "Chittoor",
             "SP_ASSOCIATE", "HINDU", "BC", "8-90, RTO Road, Chittoor - 517001"}
        };
        for (String[] d : employeeData) {
            String code = employeeCodeGenerator.generateNextCode();
            seededEmployeeCodes.add(code);
            employeeRepository.save(Employee.builder()
                .employeeCode(code)
                .prefix(d[0]).firstName(d[1]).surname(d[2])
                .gender(d[3]).maritalStatus(d[4]).fatherHusbandName(d[5]).fMH(d[6])
                .occupationKin(d[7]).occupationKinSub(d[8])
                .doj(LocalDate.parse(d[9]))
                .highestQualification(d[10]).levelOfEducation(d[11]).yearOfPassing(Integer.parseInt(d[12]))
                .dob(LocalDate.parse(d[13]))
                .email(d[14]).mobile(d[15]).bloodGroup(d[16])
                .aadharNumber(d[17]).panNumber(d[18])
                .bankName(d[19]).accountNumber(d[20]).ifscCode(d[21]).branch(d[22])
                .employeeStatus("LIVE").designation(d[23]).religion(d[24]).socialCategory(d[25])
                .presentAddress(d[26]).permanentAddress(d[26])
                .build());
        }
        log.info("Employees seeded: {} ({} employees)", seededEmployeeCodes, employeeData.length);
    }

    private void seedEmployeeUsers() {
        List<Employee> activeEmps = employeeRepository.findAllLiveEmployees();
        if (activeEmps.isEmpty()) {
            log.warn("No active employees found, skipping user seed");
            return;
        }
        List<Employee> activeEmpsList = new ArrayList<>(activeEmps);
        for (int i = 0; i < activeEmpsList.size(); i++) {
            Employee emp = activeEmpsList.get(i);
            String username = emp.getEmployeeCode();
            String role = (i == 3) ? "HR" : "EMPLOYEE";
            String finalRole = role;
            userRepository.findByUsername(username).ifPresentOrElse(user -> {
                boolean changed = false;
                if (!emp.getId().equals(user.getEmployeeId())) {
                    user.setEmployeeId(emp.getId());
                    changed = true;
                }
                if (!finalRole.equals(user.getRole())) {
                    user.setRole(finalRole);
                    changed = true;
                }
                if (changed) {
                    userRepository.save(user);
                    log.info("User updated: {} -> empId={}, role={}", username, emp.getId(), finalRole);
                }
            }, () -> {
                userRepository.save(User.builder()
                    .username(username)
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(role)
                    .employeeId(emp.getId())
                    .enabled(true)
                    .accountNonLocked(true)
                    .build());
                log.info("User created: {} / {} (linked to empId={})", username, role, emp.getId());
            });
        }
    }

    private void seedSalaries() {
        if (salaryRepository.count() > 0) {
            log.debug("Salary records already exist, skipping seed");
            return;
        }
        List<Employee> activeEmps = employeeRepository.findAllLiveEmployees();
        if (activeEmps.isEmpty()) {
            log.warn("No active employees, skipping salary seed");
            return;
        }

        int currentYear = LocalDate.now().getYear();
        int currentMonth = LocalDate.now().getMonthValue();
        int[] months = {currentMonth, currentMonth > 1 ? currentMonth - 1 : 12};
        int[] years = {currentYear, currentMonth > 1 ? currentYear : currentYear - 1};

        double[][] salaryData = {
            {25000, 10000, 5000, 3000, 0},
            {20000, 8000, 4000, 2000, 0},
            {18000, 7200, 3600, 1800, 0},
            {30000, 12000, 6000, 4000, 0},
            {22000, 8800, 4400, 2500, 0},
            {20000, 8000, 4000, 2000, 0},
            {15000, 6000, 3000, 1500, 0},
            {16000, 6400, 3200, 1600, 0},
            {25000, 10000, 5000, 3000, 0},
            {20000, 8000, 4000, 2000, 0}
        };

        for (int i = 0; i < months.length; i++) {
            int m = months[i];
            int y = years[i];
            for (int e = 0; e < Math.min(activeEmps.size(), salaryData.length); e++) {
                Employee emp = activeEmps.get(e);
                if (salaryRepository.existsByEmployeeIdAndWageYearAndWageMonth(emp.getId(), y, m)) continue;
                saveSalary(emp, m, y, salaryData[e][0], salaryData[e][1], salaryData[e][2], salaryData[e][3], salaryData[e][4]);
            }
        }
        log.info("Salary records seeded for {} months ({} employees)", months.length, Math.min(activeEmps.size(), salaryData.length));
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
                leaveTypeRepository.findByIsActiveTrue().stream()
                    .filter(lt -> !"CO".equals(lt.getName()))
                    .forEach(lt -> {
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
        String varsCommon = "[\"employee_name\",\"employee_code\",\"prefix\",\"first_name\",\"surname\",\"designation\",\"address\",\"doj\",\"doe\",\"company_name\",\"company_address\",\"company_phone\",\"company_email\",\"company_website\",\"company_cin\",\"company_logo\",\"authorized_signatory\",\"current_date\"]";
        String varsCtc = "[\"employee_name\",\"employee_code\",\"prefix\",\"first_name\",\"surname\",\"designation\",\"address\",\"doj\",\"company_name\",\"company_address\",\"company_phone\",\"company_email\",\"company_website\",\"company_cin\",\"company_logo\",\"authorized_signatory\",\"current_date\",\"basic_pay\",\"hra_amount\",\"other_allowance\",\"total_monthly\",\"total_annual\",\"pf_amount\",\"esic_amount\",\"ctc_monthly\",\"ctc_annual\"]";
        String varsJoining = "[\"employee_code\",\"doj\",\"employee_name\",\"dob\",\"gender\",\"blood_group\",\"father_husband_name\",\"address\",\"permanent_address\",\"mobile\",\"email\",\"pan_number_employee\",\"aadhar_number\",\"father_name\",\"father_phone\",\"mother_name\",\"mother_phone\",\"spouse_name\",\"spouse_phone\",\"marital_status\",\"highest_qualification\",\"year_of_passing\",\"percentage_marks\",\"organization_name\",\"period_of_employment\",\"designation\",\"account_number\",\"bank_name\",\"branch\",\"ifsc_code\",\"uan_no\",\"esic_no\",\"ref1_name\",\"ref1_relationship\",\"ref1_address\",\"ref1_mobile\",\"ref2_name\",\"ref2_relationship\",\"ref2_address\",\"ref2_mobile\",\"company_name\",\"company_address\",\"company_email\",\"company_phone\",\"company_logo\",\"current_date\"]";

        upsertLetter("JOINING_LETTER", "Joining Letter", "Official joining letter", "joining-letter.html", varsJoining);
        upsertLetter("OFFER_LETTER", "Offer Letter", "Official offer letter", "offer-letter.html", varsCommon);
        upsertLetter("EXPERIENCE_LETTER", "Experience Certificate", "Official experience letter", "experience-letter.html", varsCommon);
        upsertLetter("RELIEVING_LETTER", "Relieving Letter", "Official relieving letter", "relieving-letter.html", varsCommon);
        upsertLetter("APPOINTMENT_LETTER", "Appointment Letter", "Official appointment letter with terms and CTC", "appointment-letter.html", varsCtc);
        upsertLetter("SALARY_SLIP", "Salary Slip", "Official salary slip", "salary-slip.html", varsCtc);
        upsertLetter("CONFIRMATION_LETTER", "Confirmation Letter", "Official confirmation after probation", "confirmation-letter.html", varsCommon);
        upsertLetter("NOC", "No Objection Certificate", "Official NOC", "noc.html", varsCommon);
        String varsRefCheck = "[\"employee_name\",\"employee_code\",\"designation\",\"doj\",\"ref1_name\",\"ref1_relationship\",\"ref1_address\",\"ref1_mobile\",\"ref2_name\",\"ref2_relationship\",\"ref2_address\",\"ref2_mobile\",\"company_name\",\"company_address\",\"company_logo\",\"current_date\",\"current_time\"]";
        upsertLetter("REFERENCE_CHECK", "Reference Check Call Record", "HR reference verification call record", "reference-check.html", varsRefCheck);
        log.info("Document letter templates loaded from docs/letters");
    }

    private void upsertLetter(String type, String name, String description, String fileName, String variables) {
        String content = loadLetterHtml(fileName);
        DocumentTemplate existing = documentTemplateRepository.findFirstByTemplateType(type).orElse(null);
        if (existing == null) {
            documentTemplateRepository.save(DocumentTemplate.builder()
                .templateName(name)
                .templateType(type)
                .description(description)
                .content(content)
                .variables(variables)
                .isActive(true)
                .build());
        } else {
            existing.setTemplateName(name);
            existing.setDescription(description);
            existing.setContent(content);
            existing.setVariables(variables);
            existing.setIsActive(true);
            documentTemplateRepository.save(existing);
        }
    }

    private String loadLetterHtml(String fileName) {
        String body = readLetterFile(fileName);
        if ("joining-letter.html".equals(fileName)
            || "appointment-letter.html".equals(fileName)
            || "reference-check.html".equals(fileName)
            || body.contains("<!DOCTYPE")) {
            return body;
        }
        String letterhead = readLetterFile("letterhead.html");
        return letterhead + "\n" + body;
    }

    private String readLetterFile(String fileName) {
        Path[] candidates = new Path[] {
            Paths.get("docs", "letters", fileName),
            Paths.get("..", "docs", "letters", fileName),
            Paths.get("H:", "PARIKAR", "docs", "letters", fileName)
        };
        for (Path path : candidates) {
            try {
                if (Files.exists(path)) {
                    return Files.readString(path, StandardCharsets.UTF_8);
                }
            } catch (Exception ignored) {
                // try next location
            }
        }
        try (InputStream in = getClass().getResourceAsStream("/letters/" + fileName)) {
            if (in != null) {
                return new String(in.readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            log.warn("Could not read classpath letter {}: {}", fileName, e.getMessage());
        }
        throw new IllegalStateException("Letter template not found: " + fileName);
    }

    @Transactional
    private void seedPermissions() {
        rolePermissionRepository.deleteAll();

        String[][] resources = {
            {"dashboard", "1,1,1,1", "1,1,1,1", "1,0,0,0"},
            {"staff_master", "1,1,1,1", "1,0,1,0", "1,0,0,0"},
            {"company", "1,1,1,1", "0,0,0,0", "0,0,0,0"},
            {"masters", "1,1,1,1", "0,0,0,0", "0,0,0,0"},
            {"doc_templates", "1,1,1,1", "1,1,0,0", "0,0,0,0"},
            {"payroll", "1,1,1,1", "1,1,1,0", "0,0,0,0"},
            {"bills", "1,1,1,1", "1,1,1,0", "0,0,0,0"},
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
