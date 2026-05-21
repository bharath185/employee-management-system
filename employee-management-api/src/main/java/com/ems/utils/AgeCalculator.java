package com.ems.utils;

import java.time.LocalDate;
import java.time.Period;

public class AgeCalculator {

    private AgeCalculator() {}

    /**
     * Calculate age in years from date of birth.
     */
    public static int calculateAge(LocalDate dob) {
        if (dob == null) return 0;
        return Period.between(dob, LocalDate.now()).getYears();
    }

    /**
     * Determine age bracket based on age.
     */
    public static String getAgeBracket(int age) {
        if (age <= 25) return "25 & Below";
        if (age <= 30) return "26 to 30";
        if (age <= 35) return "31 to 35";
        if (age <= 40) return "36 to 40";
        if (age <= 50) return "41 to 50";
        return "51 & Above";
    }

    /**
     * Determine age bracket directly from DOB.
     */
    public static String getAgeBracket(LocalDate dob) {
        return getAgeBracket(calculateAge(dob));
    }
}
