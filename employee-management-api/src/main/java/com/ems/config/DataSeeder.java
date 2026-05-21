package com.ems.config;

import com.ems.model.MasterData;
import com.ems.model.User;
import com.ems.repository.MasterDataRepository;
import com.ems.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MasterDataRepository masterDataRepository;

    @Override
    public void run(String... args) {
        seedAdminUser();
        seedMasterData();
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
